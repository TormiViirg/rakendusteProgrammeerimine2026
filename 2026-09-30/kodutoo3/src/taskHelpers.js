export function getAllTasks(tasks) {
  return [...tasks];
}

export function getTaskById(tasks, id) {
  return tasks.find((task) => task.id === id);
}

export function getCompletedTasks(tasks) {
  return tasks.filter((task) => task.status === "completed");
}

export function getIncompleteTasks(tasks) {
  return tasks.filter((task) => task.status !== "completed");
}

export function createTask(tasks, title) {

  const highestId = tasks.reduce((highestId, task) => {
    const id = Number(task.id);
    return Number.isInteger(id) && id > highestId ? id : highestId;
  }, 0);

  const task = {
    id: highestId + 1,
    title,
    status: "in progress",
    completed: false
  };

  tasks.push(task);
  return task;
}