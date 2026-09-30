import express, { request, response } from "express";

import { tasks } from "./index.js";

import { getTaskById } from "./taskHelpers.js";

const app = express();

app.get("/api/health", (_request, response) => {
    response.status(200).json({ status: "ok"});
});

app.get("/api/tasks/:id", (request, response) => {

    const task = getTaskById(tasks, Number(request.params.id));

    if (!task) {
        return response.status(404).json({ message: "Task not found" });
    }

    return response.status(200).json(task);
});

app.use((_request, response) => {
    response.status(404).json({ message: "Route not found" });
});

export { app };