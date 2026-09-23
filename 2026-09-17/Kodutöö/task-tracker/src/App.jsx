import { useState } from 'react';
import './App.css';
import Header from './components/Header'
import TaskCard from './components/TaskCard'

function App() {
    const task1 = {
      title: "Conquer Baveria",
      completed: true,
    };

    const task2 = {
      title: "Lay siege to Brandenburg",
      completed: false,
    };
  return (
    <>
      <Header />
      <section id="center">
        <div className="hero">
          <h1>Task Tracker</h1>
        </div>
        <TaskCard task={task1} />
        <TaskCard task={task2} />
      </section>
    </>
  );
}

export default App;
