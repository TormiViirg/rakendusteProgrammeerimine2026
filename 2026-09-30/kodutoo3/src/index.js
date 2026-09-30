import { getAllTasks, getCompletedTasks, getTaskById } from "./taskHelpers.js";

const task = {
  id: process.argv[2] || 1,
  title: process.argv[3] || "Finish demo",
  status: process.argv[4] || "in progress",
};

console.log("Hello! Welcome to the Task Tracker demo.");
console.log("\nTask data:");
console.log(`  ID:     ${task.id}`);
console.log(`  Title:  ${task.title}`);
console.log(`  Status: ${task.status}`);

export const tasks = [
  task,
  { id: 2, title: "Review pull request", status: "completed" },
  { id: 3, title: "Write documentation", status: "completed" },
];

console.log("\nAll tasks:", getAllTasks(tasks));
console.log("Current task:", getTaskById(tasks, task.id));
console.log("Completed tasks:", getCompletedTasks(tasks));
