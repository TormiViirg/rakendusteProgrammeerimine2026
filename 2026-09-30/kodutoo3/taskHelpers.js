export function getAllTasks(tasks) {
  return [...tasks];
}

export function getTaskById(tasks, id) {
  return tasks.find((task) => task.id === id);
}

export function getCompletedTasks(tasks) {
  return tasks.filter((task) => task.status === "completed");
}