"use client";
import { useState } from "react";

export default function ServerMessage() {

    const [message, setMessage] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleLoadMessage() {

        setLoading(true);
        setError("");
        setMessage("");

        try {
            const response = await fetch("/api/message");

            if (!response.ok) {
                throw new Error("Failed to load the server message.");
            }

            const data = await response.json();

            setMessage(data.message);
        } catch (error) {
            setError (
                error instanceof Error ? error.message : "Something went wrong."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            <button
                type="button"
                onClick={handleLoadMessage}
                disabled={loading}
            >
                Load server message
            </button>

            <p role="status">
                {loading ? "Loading..." : message}
            </p>

            {error && <p role="status">{Loading ? "Loading..." : message}
            </p>}

            {error && <p role="alert">{error}</p>}
        </div>
    );
}