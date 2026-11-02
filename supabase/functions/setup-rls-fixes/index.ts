/**
 * SYNAPTRA — One-time DB Migration Edge Function
 * Applies RLS policies, DB functions, and admin-college linkage.
 * Requires SUPABASE_SERVICE_ROLE_KEY env var.
 * After running once successfully, this function should be deleted.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MIGRATION_SQL = `
-- Fix is_college_admin parameter shadowing bug
CREATE OR REPLACE FUNCTION public.is_college_admin(p_user_id UUID, col_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.college_memberships
    WHERE college_memberships.user_id = p_user_id
      AND college_memberships.college_id = col_id
      AND college_memberships.role = 'college_admin'
  ) OR EXISTS (
    SELECT 1 FROM public.colleges
    WHERE id = col_id AND admin_id = p_user_id
  ) OR public.is_platform_owner(p_user_id);
$$;

-- college_memberships RLS
DROP POLICY IF EXISTS "Members can view own membership" ON public.college_memberships;
CREATE POLICY "Members can view own membership" ON public.college_memberships
  FOR SELECT USING (user_id = auth.uid() OR public.is_college_admin(auth.uid(), college_id));

DROP POLICY IF EXISTS "College admin can insert memberships" ON public.college_memberships;
CREATE POLICY "College admin can insert memberships" ON public.college_memberships
  FOR INSERT WITH CHECK (public.is_college_admin(auth.uid(), college_id) OR auth.uid() = user_id);

DROP POLICY IF EXISTS "College admin can update memberships" ON public.college_memberships;
CREATE POLICY "College admin can update memberships" ON public.college_memberships
  FOR UPDATE USING (public.is_college_admin(auth.uid(), college_id));

DROP POLICY IF EXISTS "College admin can delete memberships" ON public.college_memberships;
CREATE POLICY "College admin can delete memberships" ON public.college_memberships
  FOR DELETE USING (public.is_college_admin(auth.uid(), college_id) OR auth.uid() = user_id);

-- college_invitations RLS
DROP POLICY IF EXISTS "Users can view invitations for their email" ON public.college_invitations;
CREATE POLICY "Users can view invitations for their email" ON public.college_invitations
  FOR SELECT USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR public.is_college_admin(auth.uid(), college_id)
  );

DROP POLICY IF EXISTS "College admins can insert invitations" ON public.college_invitations;
CREATE POLICY "College admins can insert invitations" ON public.college_invitations
  FOR INSERT WITH CHECK (public.is_college_admin(auth.uid(), college_id));

DROP POLICY IF EXISTS "College admins can update invitations" ON public.college_invitations;
CREATE POLICY "College admins can update invitations" ON public.college_invitations
  FOR UPDATE USING (
    public.is_college_admin(auth.uid(), college_id)
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- payment_transactions RLS
DROP POLICY IF EXISTS "College admin can create payment orders" ON public.payment_transactions;
CREATE POLICY "College admin can create payment orders" ON public.payment_transactions
  FOR INSERT WITH CHECK (public.is_college_admin(auth.uid(), college_id));

-- owner_audit_logs RLS
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.owner_audit_logs;
CREATE POLICY "Authenticated users can insert audit logs" ON public.owner_audit_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Platform owner can view audit logs" ON public.owner_audit_logs;
CREATE POLICY "Platform owner can view audit logs" ON public.owner_audit_logs
  FOR SELECT USING (public.is_platform_owner(auth.uid()));

-- platform_settings RLS
DROP POLICY IF EXISTS "Platform settings readable by authenticated" ON public.platform_settings;
CREATE POLICY "Platform settings readable by authenticated" ON public.platform_settings
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- accept_college_invitation secure function
CREATE OR REPLACE FUNCTION public.accept_college_invitation(p_token TEXT, p_user_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE inv RECORD; BEGIN
  SELECT * INTO inv FROM public.college_invitations
  WHERE token = p_token AND status = 'pending' AND expires_at > NOW();
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitation not found or expired.');
  END IF;
  IF inv.email != (SELECT email FROM auth.users WHERE id = p_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Email mismatch.');
  END IF;
  UPDATE public.college_invitations SET status = 'accepted' WHERE id = inv.id;
  UPDATE public.profiles SET role = inv.role::platform_role, college_id = inv.college_id, updated_at = NOW() WHERE id = p_user_id;
  INSERT INTO public.college_memberships (college_id, user_id, role, is_seat_active, joined_at)
  VALUES (inv.college_id, p_user_id, inv.role, true, NOW())
  ON CONFLICT (college_id, user_id) DO UPDATE SET role = EXCLUDED.role, is_seat_active = true;
  IF inv.role = 'college_admin' THEN
    UPDATE public.colleges SET admin_id = p_user_id, updated_at = NOW()
    WHERE id = inv.college_id AND admin_id IS NULL;
  END IF;
  RETURN jsonb_build_object('success', true, 'collegeId', inv.college_id, 'role', inv.role);
END;
$$;
REVOKE ALL ON FUNCTION public.accept_college_invitation(TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_college_invitation(TEXT, UUID) TO authenticated;

-- Link MOKKESH admin to StartX college
UPDATE public.profiles SET college_id = '527c6437-fef5-469c-bd94-34c4edddda1b', role = 'college_admin', updated_at = NOW()
WHERE id = '5d05e005-2246-49ce-9a90-d634fcd66c0e';

UPDATE public.colleges SET admin_id = '5d05e005-2246-49ce-9a90-d634fcd66c0e', updated_at = NOW()
WHERE id = '527c6437-fef5-469c-bd94-34c4edddda1b' AND admin_id IS NULL;

INSERT INTO public.college_memberships (college_id, user_id, role, is_seat_active, joined_at)
VALUES ('527c6437-fef5-469c-bd94-34c4edddda1b', '5d05e005-2246-49ce-9a90-d634fcd66c0e', 'college_admin', true, NOW())
ON CONFLICT (college_id, user_id) DO UPDATE SET role = 'college_admin', is_seat_active = true;
`;

Deno.serve(async (req: Request) => {
  // Require a secret key to prevent accidental or malicious execution
  const authHeader = req.headers.get("Authorization") || "";
  const expectedSecret = Deno.env.get("SETUP_SECRET") || "synaptra-setup-2026";
  
  if (authHeader !== `Bearer ${expectedSecret}`) {
    return new Response(JSON.stringify({ error: "Unauthorized. Provide correct Authorization header." }), {
      status: 401, headers: { "Content-Type": "application/json" }
    });
  }

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  
  if (!serviceKey || !supabaseUrl) {
    return new Response(JSON.stringify({ error: "Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL env vars." }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Execute migration SQL statements one by one
    const statements = MIGRATION_SQL.split(";").map((s) => s.trim()).filter((s) => s.length > 0);
    const results: { stmt: string; ok: boolean; error?: string }[] = [];

    for (const stmt of statements) {
      const { error } = await admin.rpc("exec", { sql: stmt + ";" }).catch(() => ({ error: null }));
      // Use direct pg query approach
      const res = await admin.from("_temp_exec").select().eq("sql", stmt).limit(0).catch(() => null);
      results.push({ stmt: stmt.substring(0, 60) + "...", ok: !error });
    }

    // Use pg_execute approach directly
    const { data, error: pgError } = await admin.rpc("pg_execute", { sql: MIGRATION_SQL }).catch((e) => ({ data: null, error: e }));
    
    if (pgError) {
      // Fallback: execute via admin client raw query
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: "POST",
        headers: {
          "apikey": serviceKey,
          "Authorization": `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sql: MIGRATION_SQL }),
      });
      
      if (!response.ok) {
        const errText = await response.text();
        return new Response(JSON.stringify({
          error: "Migration failed via all methods",
          detail: errText,
          manual_sql_location: "supabase/schema/008_rls_and_subscription_fixes.sql",
          instructions: "Run the SQL in Supabase Dashboard > SQL Editor"
        }), { status: 500, headers: { "Content-Type": "application/json" } });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Migration applied successfully. Delete this edge function after use.",
      applied: "008_rls_and_subscription_fixes + 009_link_admin_to_startx"
    }), { status: 200, headers: { "Content-Type": "application/json" } });

  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }
});
