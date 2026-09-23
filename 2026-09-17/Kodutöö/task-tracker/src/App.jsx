import { useState } from 'react';
import { TaskForm } from './components/TaskForm';

import './App.css';
import Header from './components/Header';
import TaskCard from './components/TaskCard';

function App() {
  const [tasks, setTasks] = useState([
    { id: 1, title: "Conquer Baveria", completed: true },
    { id: 2, title: "Lay Siege to Brandenburg", completed: false },
    { id: 3, title: "Build a crossbow", completed: false }
  ]);

  const [filter, setFilter] = useState("all");

  function toggleTask(id) {
    setTasks((previous) =>
      previous.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task,
      ),
    );
  }

  function addTask(title) {
    setTasks((previous) => [
      ...previous,
      { id: crypto.randomUUID(), title, completed: false },
    ]);
  }

  const filteredTasks = tasks.filter((task) => {
    if (filter === "completed") return task.completed;
    if (filter === "incomplete") return !task.completed;
    return true;
  });

  return (
    <>
      <Header />
      <section id="center">
        <div className="hero">
          <h1>Task Tracker</h1>
        </div>

        <TaskForm onAddTask={addTask} />
        
        <div>
          <button onClick={() => setFilter("all")}>All tasks</button>
          <button onClick={() => setFilter("completed")}>
            Completed tasks
          </button>
          <button onClick={() => setFilter("incomplete")}>
            Incomplete tasks
          </button>
        </div>

        {filteredTasks.length === 0 ? (
          <p>No tasks found</p>
        ) : (
          filteredTasks.map((task) => (
            <TaskCard key={task.id} task={task} onToggle={toggleTask} />
          ))
        )}
      </section>
    </>
  );
}

export default App;
