import { useState } from 'react';
import './App.css';
import Header from './components/Header'
import TaskCard from './components/TaskCard'

function App() {

  return (
    <>
      <Header/>
      <TaskCard/>
      <section id="center">
        <div className="hero">
          <div>
            <h1>Task Tracker</h1>
          </div>
        </div>
      </section>
    </>
  );
}

export default App;
