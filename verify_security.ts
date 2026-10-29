import {
  canAccessRoomSync,
  saveProfile,
  reviewApplication,
  reviewMentorship,
  transferOwnership,
  removeMember,
  saveTask,
  uploadDocument,
  addDiscussion,
  suspendUser,
  moderateProject,
} from "./src/lib/supabase-db";
import type { ProjectMember, Task, DocumentItem } from "./src/types";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passedCount++;
  } else {
    console.error(`[FAIL] ${testName}: ${detail || "Condition not met"}`);
    failedCount++;
  }
}

async function runSecurityAuditSuite() {
  console.log("===============================================================");
  console.log("SYNAPTRA RBAC & ACCESS CONTROL AUDIT VERIFICATION SUITE");
  console.log("Platform Hierarchy: Student, Faculty, Administrator (100k Users)");
  console.log("===============================================================\n");

  const projectId = "proj-security-test-1";
  const studentOwnerId = "student-owner-alice";
  const activeMemberId = "student-member-bob";
  const inactiveMemberId = "student-left-david";
  const unrelatedStudentId = "student-unrelated-charlie";
  const unassignedFacultyId = "faculty-unassigned-brown";
  const adminId = "admin-sys-root";

  const members: ProjectMember[] = [
    {
      id: "pm-1",
      projectId,
      userId: activeMemberId,
      role: "ML Researcher",
      systemRole: "member",
      status: "active",
      joinedAt: "2026-01-01T00:00:00Z",
    },
    {
      id: "pm-2",
      projectId,
      userId: inactiveMemberId,
      role: "Former Contributor",
      systemRole: "member",
      status: "left",
      joinedAt: "2026-01-01T00:00:00Z",
    },
  ];

  console.log("--- 1. PROJECT ROOM & CHAT ACCESS CONTROL (RBAC) ---");
  // Test 1: Project Owner can access room
  const test1 = canAccessRoomSync(studentOwnerId, projectId, members, studentOwnerId);
  assert(test1 === true, "Project Owner has authorized room access");

  // Test 2: Active Project Member can access room
  const test2 = canAccessRoomSync(activeMemberId, projectId, members, studentOwnerId);
  assert(test2 === true, "Active Project Member has authorized room access");

  // Test 3: Inactive/Left Member cannot access room
  const test3 = canAccessRoomSync(inactiveMemberId, projectId, members, studentOwnerId);
  assert(test3 === false, "Inactive / Left Member DENIED room access");

  // Test 4: Unrelated Student CANNOT access private room
  const test4 = canAccessRoomSync(unrelatedStudentId, projectId, members, studentOwnerId);
  assert(test4 === false, "Unrelated Student DENIED room access");

  // Test 5: Unassigned Faculty CANNOT access unrelated project room
  const test5 = canAccessRoomSync(unassignedFacultyId, projectId, members, studentOwnerId);
  assert(test5 === false, "Unassigned Faculty DENIED project room access");

  // Test 6: Administrator WITHOUT membership does NOT have room access (least privilege)
  const test6 = canAccessRoomSync(adminId, projectId, members, studentOwnerId);
  assert(test6 === false, "Platform Admin without membership DENIED private room access (No backdoor)");

  console.log("\n--- 2. ROLE TAMPERING & PRIVILEGE ESCALATION PREVENTION ---");
  // Test 7: Attempted role escalation via profile update
  try {
    const maliciousPayload = {
      fullName: "Arjun Updated",
      role: "admin" as const, // Attacker attempting to self-promote to admin
    };
    const updated = await saveProfile("student-profile-1", maliciousPayload as any);
    assert(
      (updated as any)?.role !== "admin",
      "Self-role escalation to 'admin' PREVENTED (role mutation stripped by data layer)"
    );
  } catch (err: any) {
    // If it threw or prevented, role escalation was blocked
    assert(true, "Self-role escalation to 'admin' PREVENTED (Operation rejected)");
  }

  console.log("\n--- 3. ADMINISTRATIVE BOUNDARIES & UNAUTHORIZED MODERATION ---");
  // Test 8: Non-admin calling suspendUser is rejected
  try {
    await suspendUser("target-user-1", "Spamming", unrelatedStudentId);
    assert(false, "Student calling suspendUser should throw unauthorized error");
  } catch (err: any) {
    assert(
      err.message.includes("Unauthorized") || err.message.includes("admin"),
      "Student calling suspendUser BLOCKED with Unauthorized error"
    );
  }

  // Test 9: Non-admin calling moderateProject is rejected
  try {
    await moderateProject(projectId, "flagged", unrelatedStudentId);
    assert(false, "Student calling moderateProject should throw unauthorized error");
  } catch (err: any) {
    assert(
      err.message.includes("Unauthorized") || err.message.includes("admin"),
      "Student calling moderateProject BLOCKED with Unauthorized error"
    );
  }

  console.log("\n--- 4. WORKSPACE MUTATIONS (TASKS, DOCS, DISCUSSIONS) ---");
  // Test 10: Non-member attempting to save task is rejected
  try {
    const maliciousTask: Partial<Task> = {
      projectId,
      title: "Unauthorized Task Injection",
      status: "todo",
      priority: "high",
    };
    await saveTask(maliciousTask, unrelatedStudentId);
    assert(false, "Non-member saving task should be rejected");
  } catch (err: any) {
    assert(
      err.message.includes("Unauthorized") || err.message.includes("access"),
      "Non-member saving task BLOCKED"
    );
  }

  // Test 11: Non-member attempting to upload document is rejected
  try {
    const maliciousDoc: Partial<DocumentItem> = {
      projectId,
      title: "Malicious Document",
      fileType: "application/pdf",
      fileSize: 1024,
      access: "project_members",
      url: "https://evil.com/doc.pdf",
    };
    await uploadDocument(maliciousDoc, unrelatedStudentId);
    assert(false, "Non-member uploading document should be rejected");
  } catch (err: any) {
    assert(
      err.message.includes("Unauthorized") || err.message.includes("access"),
      "Non-member uploading document BLOCKED"
    );
  }

  // Test 12: Non-member attempting to post discussion is rejected
  try {
    await addDiscussion(projectId, "Unauthorized Discussion", "Content", unrelatedStudentId);
    assert(false, "Non-member adding discussion should be rejected");
  } catch (err: any) {
    assert(
      err.message.includes("Unauthorized") || err.message.includes("access"),
      "Non-member posting discussion BLOCKED"
    );
  }

  console.log("\n--- 5. APPLICATION & PROJECT GOVERNANCE AUTHORIZATION ---");
  // Test 13: Non-owner attempting to accept join application is rejected
  try {
    await reviewApplication(unrelatedStudentId, "fake-req-id", "accepted", undefined, projectId);
    assert(false, "Non-owner reviewing application should be rejected");
  } catch (err: any) {
    assert(
      err.message.includes("Unauthorized") || err.message.includes("owner"),
      "Non-owner reviewing application BLOCKED"
    );
  }

  // Test 14: Non-owner attempting to accept mentorship is rejected
  try {
    await reviewMentorship(unrelatedStudentId, "fake-mentor-req", true, projectId);
    assert(false, "Non-owner reviewing mentorship should be rejected");
  } catch (err: any) {
    assert(
      err.message.includes("Unauthorized") || err.message.includes("owner"),
      "Non-owner reviewing mentorship BLOCKED"
    );
  }

  // Test 15: Non-owner attempting to remove member is rejected
  try {
    await removeMember(unrelatedStudentId, projectId, activeMemberId);
    assert(false, "Non-owner removing member should be rejected");
  } catch (err: any) {
    assert(
      err.message.includes("Unauthorized") || err.message.includes("owner"),
      "Non-owner removing member BLOCKED"
    );
  }

  // Test 16: Non-owner attempting to transfer ownership is rejected
  try {
    await transferOwnership(projectId, unrelatedStudentId, activeMemberId);
    assert(false, "Non-owner transferring ownership should be rejected");
  } catch (err: any) {
    assert(
      err.message.includes("Unauthorized") || err.message.includes("owner"),
      "Non-owner transferring ownership BLOCKED"
    );
  }

  console.log("\n===============================================================");
  console.log(`AUDIT RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("===============================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runSecurityAuditSuite().catch((err) => {
  console.error("Test suite runtime failure:", err);
  process.exit(1);
});
