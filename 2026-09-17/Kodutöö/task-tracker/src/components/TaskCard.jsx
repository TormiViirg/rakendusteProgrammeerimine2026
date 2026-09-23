import { useState } from "react";

function TaskCard({ task, onToggle }) {
  return (
    <div className="task-card">
      <h2>{task.title}</h2>
      <p>{task.completed ? "Completed" : "Not completed"}</p>
      <button onClick={() => onToggle(task.id)}>
        Toggle completion
      </button>
    </div>
  );
}

export default TaskCard;