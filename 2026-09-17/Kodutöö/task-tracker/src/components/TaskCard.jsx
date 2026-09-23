import { useState } from "react";

function TaskCard({ task, onToggle, onDelete }) {
  return (
    <div className="task-card">
      <h2>{task.title}</h2>
      <p>{task.completed ? "Completed" : "Not completed"}</p>
      <button onClick={() => onToggle(task.id)}>
        Toggle completion
      </button>
      <button onClick={() => onDelete(task.id)}>Delete</button>
    </div>
  );
}

export default TaskCard;