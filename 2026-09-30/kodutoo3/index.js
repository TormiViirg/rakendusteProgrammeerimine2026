import { 
  getAllTasks, 
  getCompletedTasks, 
  getTaskById
} from "./taskHelpers";

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

const tasks = [
  task,
  {  id: "TASK-002", title: "Review pull request", status: "completed" },
  {  id: "TASK-003", title: "Write documentation", status: "completed" }
];

console.log("\nAll tasks:", getAllTasks(tasks));
console.log("Current task:", getTaskById(tasks, task.id));
console.log("Completed tasks:", getCompletedTasks(tasks));