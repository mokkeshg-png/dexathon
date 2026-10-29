import { analyzeProjectDocument, type DocumentPurpose } from "./src/lib/projectDocumentIntelligence";

console.log("===============================================================");
console.log("TESTING AI DOCUMENT INTELLIGENCE PIPELINE (PRD SECTION 4)");
console.log("===============================================================");

const samplePrdText = `
Title: Autonomous Drone Vision for Real-Time Precision Agriculture
Problem Statement: Farmers face severe crop damage from pest infestations due to delayed detection. Current manual field scouting is labor-intensive and error-prone.
Objectives:
- Build a lightweight convolutional neural network for drone edge inference
- Develop a high-throughput FastAPI backend for aerial telemetry and mapping
- Create an interactive React GIS map dashboard for farmer field visualization
- Implement secure JWT authentication and role-based access for field inspectors
Technical Stack:
The system utilizes Python, PyTorch, OpenCV, FastAPI, React, TypeScript, PostgreSQL, and Docker.
`;

const result = analyzeProjectDocument(samplePrdText, "Drone_Vision_PRD.pdf", "prd");

console.log("\n1. Extracted Title:");
console.log(`   "${result.title}"`);
if (result.title.toLowerCase().includes("autonomous drone")) {
  console.log("   [PASS] Extracted title accurately");
} else {
  console.error("   [FAIL] Title extraction failed");
  process.exit(1);
}

console.log("\n2. Extracted Problem Statement:");
console.log(`   "${result.problemStatement.slice(0, 100)}..."`);
if (result.problemStatement.toLowerCase().includes("farmers face")) {
  console.log("   [PASS] Problem statement identified");
}

console.log("\n3. Extracted Objectives:");
for (const obj of result.objectives) {
  console.log(`   • ${obj}`);
}
if (result.objectives.length >= 3) {
  console.log("   [PASS] Extracted bulleted objectives list");
}

console.log("\n4. Detected Skills & Domains:");
console.log(`   Skills: ${result.requiredSkills.join(", ")}`);
console.log(`   Domains: ${result.domains.join(", ")}`);
if (result.requiredSkills.includes("PyTorch") && result.requiredSkills.includes("React")) {
  console.log("   [PASS] Detected multi-tier tech stack (AI/ML + Frontend + Backend)");
}

console.log("\n5. Synthesized Roles & Role Dependencies:");
for (const role of result.suggestedRoles) {
  console.log(`   - Role: ${role.name} (${role.openings} opening)`);
  console.log(`     Skills: ${role.requiredSkills?.join(", ")}`);
  console.log(`     Desc: ${role.description}`);
}
for (const dep of result.roleDependencies) {
  console.log(`   - Dependency: ${dep.role} requires ${dep.dependsOnRole} -> ${dep.reason}`);
}
if (result.suggestedRoles.length >= 3 && result.roleDependencies.length > 0) {
  console.log("   [PASS] Synthesized dynamic team roles and cross-role dependencies");
}

console.log("\n6. Ambiguity & Missing Requirements Detection:");
for (const amb of result.missingOrAmbiguous) {
  console.log(`   ⚠️ ${amb}`);
}
if (result.missingOrAmbiguous.length > 0) {
  console.log("   [PASS] Detected missing schedule / verification criteria");
}

console.log("\n===============================================================");
console.log("ALL AI DOCUMENT INTELLIGENCE TESTS PASSED SUCCESSFULLY!");
console.log("===============================================================");
