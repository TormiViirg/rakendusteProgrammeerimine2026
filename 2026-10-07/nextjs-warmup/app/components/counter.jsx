"use client";
import { useState } from "react";


export default function Counter() {

    const [count, setCount] = useState(0);

    return (
        <div>
            <p>Count: {count}</p>
            <button
                type="button"
                onClick={() => setCount((current) => current + 1)}
            >
                Increase   
            </button>
        </div>
    );
}