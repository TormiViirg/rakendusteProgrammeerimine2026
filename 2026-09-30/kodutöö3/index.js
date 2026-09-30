const task = {
  id: process.argv[2] || "TASK-001",
  title: process.argv[3] || "Finish demo",
  status: process.argv[4] || "in progress",
};

console.log("Hello! Welcome to the Task Tracker demo.");
console.log("\nTask data:");
console.log(`  ID:     ${task.id}`);
console.log(`  Title:  ${task.title}`);
console.log(`  Status: ${task.status}`);