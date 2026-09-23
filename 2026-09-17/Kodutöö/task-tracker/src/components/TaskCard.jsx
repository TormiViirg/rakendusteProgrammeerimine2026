import { useState } from "react";

function TaskCard({ task }) {
  const [completed, setCompleted] = useState(task.completed);

  return (
    <div className="task-card">
      <h2>{task.title}</h2>
      <p>{completed ? "Conquered" : "Unconquered"}</p>
      <button onClick={() => setCompleted((previous) => !previous)}>
        Toggle completion
      </button>
    </div>
  );
}

export default TaskCard;