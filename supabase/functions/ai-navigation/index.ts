import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "npm:@supabase/server";
import { createClient } from "npm:@supabase/supabase-js@^2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function isValidUUID(value: unknown): value is string {
  if (typeof value !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export default {
  fetch: withSupabase(
    { auth: "user" },
    async (req: Request, ctx: any) => {
      // 1. Handle CORS preflight
      if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
      }

      if (req.method !== "POST") {
        return jsonResponse(
          { error: "Only POST requests are supported." },
          405
        );
      }

      try {
        // 2. Verify caller authentication
        const callerUserId = ctx.userClaims?.sub ?? ctx.userClaims?.id;
        if (!callerUserId) {
          return jsonResponse(
            { error: "Unauthorized: Valid user session required." },
            401
          );
        }

        // 3. Initialize user-scoped Supabase client (strictly respecting RLS & user's JWT)
        const authHeader = req.headers.get("Authorization");
        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
          global: {
            headers: authHeader ? { Authorization: authHeader } : {},
          },
        });

        // 4. Verify caller profile exists and is active (not suspended)
        const { data: callerProfile, error: callerErr } = await supabase
          .from("profiles")
          .select("id, status, role")
          .eq("id", callerUserId)
          .maybeSingle();

        if (callerErr || !callerProfile) {
          return jsonResponse(
            { error: "Unauthorized: Caller profile not found." },
            401
          );
        }

        if (callerProfile.status === "suspended") {
          return jsonResponse(
            { error: "Forbidden: Your account is suspended." },
            403
          );
        }

        // Role authorization check — student and faculty only
        const ALLOWED_ROLES = ["student", "faculty"];
        if (!ALLOWED_ROLES.includes(callerProfile.role)) {
          return jsonResponse(
            { error: "Forbidden: Your role does not have access to AI navigation." },
            403
          );
        }

        // 5. Parse request body
        let body: any = {};
        try {
          body = await req.json();
        } catch {
          return jsonResponse(
            { error: "Request body must be valid JSON." },
            400
          );
        }

        const target = typeof body.target === "string" ? body.target.trim() : "";
        const id = typeof body.id === "string" ? body.id.trim() : "";
        const entityType =
          typeof body.entity_type === "string"
            ? body.entity_type.trim().toLowerCase()
            : "profile";

        if (!target && !id) {
          return jsonResponse(
            { error: "Either target name or entity id must be provided." },
            400
          );
        }

        // 6. Handle Project Navigation
        if (entityType === "project") {
          let project: any = null;

          if (id && isValidUUID(id)) {
            const { data } = await supabase
              .from("projects")
              .select("id, title, status, visibility, owner_id")
              .eq("id", id)
              .maybeSingle();
            project = data;
          } else if (target) {
            const { data } = await supabase
              .from("projects")
              .select("id, title, status, visibility, owner_id")
              .ilike("title", `%${target}%`)
              .limit(1)
              .maybeSingle();
            project = data;
          }

          if (!project) {
            return jsonResponse(
              { error: "Project not found or inaccessible under your permissions." },
              404
            );
          }

          // Construct server-validated route (never trust client-supplied routes)
          const route = `/projects/${project.id}`;

          return jsonResponse({
            success: true,
            type: "navigate",
            route,
            label: "Open Project",
            entity: {
              id: project.id,
              title: project.title,
              type: "project",
            },
          });
        }

        // 7. Handle Profile Navigation (Faculty or Student)
        let resolvedProfile: any = null;

        // Try direct UUID lookup if provided
        if (id && isValidUUID(id)) {
          const { data } = await supabase
            .from("profiles")
            .select("id, full_name, role, designation, status, visibility")
            .eq("id", id)
            .maybeSingle();
          resolvedProfile = data;
        }

        // Try target lookup by name / username / identifier
        if (!resolvedProfile && target) {
          if (isValidUUID(target)) {
            const { data } = await supabase
              .from("profiles")
              .select("id, full_name, role, designation, status, visibility")
              .eq("id", target)
              .maybeSingle();
            resolvedProfile = data;
          } else {
            const cleanTarget = target.replace(/_/g, " ").trim();

            let query = supabase
              .from("profiles")
              .select("id, full_name, role, designation, status, visibility")
              .or(`full_name.ilike.%${target}%,full_name.ilike.%${cleanTarget}%`);

            if (entityType === "faculty") {
              query = query.or("role.eq.faculty,designation.not.is.null");
            } else if (entityType === "student") {
              query = query.eq("role", "student");
            }

            const { data } = await query.limit(1).maybeSingle();
            resolvedProfile = data;
          }
        }

        // 8. Validate entity existence and account status
        if (!resolvedProfile) {
          return jsonResponse(
            { error: "Profile not found or inaccessible under your permissions." },
            404
          );
        }

        if (resolvedProfile.status === "suspended") {
          return jsonResponse(
            { error: "Forbidden: Target profile is suspended or inactive." },
            403
          );
        }

        // Determine profile role classification
        const isFaculty = Boolean(
          resolvedProfile.designation || resolvedProfile.role === "faculty"
        );
        const label = isFaculty ? "Open Faculty Profile" : "Open Student Profile";

        // Deterministically construct verified route (never trust arbitrary client routes)
        const route = `/profile/${resolvedProfile.id}`;

        return jsonResponse({
          success: true,
          type: "navigate",
          route,
          label,
          entity: {
            id: resolvedProfile.id,
            name: resolvedProfile.full_name,
            type: isFaculty ? "faculty" : "student",
          },
        });
      } catch (err: any) {
        console.error("ai-navigation unhandled error:", err);
        return jsonResponse(
          { error: "Internal navigation resolution error." },
          500
        );
      }
    }
  ),
};

