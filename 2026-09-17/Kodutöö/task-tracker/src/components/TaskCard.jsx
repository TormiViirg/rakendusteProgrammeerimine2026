export function TaskCard({ task }) {
  return (
    <div className="task-card">
      <h2>{task.title}</h2>
      <p>{task.completed ? 'Conquered' : 'Unconquered'}</p>
    </div>
  );
}

export default TaskCard;
