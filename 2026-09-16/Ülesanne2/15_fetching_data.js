
async function countCompletedTasks() {
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/todos");

    if (!response.ok) {
      throw new Error(`Request returned HTTP ${response.status}`);
    }

    const tasks = await response.json();
    const completedTasks = tasks.filter((task) => task.completed);
    console.log(`Completed tasks: ${completedTasks.length} of ${tasks.length}`);
  } catch (error) {
    console.error("Could not load task progress:", error.message);
  }
}

countCompletedTasks();
