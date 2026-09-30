import express, { request, response } from "express";

import { tasks } from "./index.js";

import { 
    getAllTasks,
    getTaskById,
    getCompletedTasks,
    getIncompleteTasks,
    createTask
} from "./taskHelpers.js";

const app = express();

app.use(express.json());


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


app.get("/api/tasks", (request, response) => {

    const { completed } = request.query;

    if (completed === undefined) {
        return response.status(200).json(getAllTasks(tasks));
    }

    if (completed !== "true" && completed !== "false") {
        return response.status(400).json({
            message: "The completed query must be true or false"
        });
    }

    const filteredTasks = completed === "true"
        ? getCompletedTasks(tasks)
        : getIncompleteTasks(tasks);

    return response.status(200).json(filteredTasks);
})


app.post("/api/tasks", (request, response) => {

    const { title } = request.body ?? {};

    if (typeof title !== "string" || title.trim() === ""){
        return response.status(400).json({
            message: "Title must be a non-empty string"
        });
    }

    const task = createTask(tasks, title.trim());

    return response.status(201).json(task);
});

app.use((_request, response) => {
    response.status(404).json({ message: "Route not found" });
});

export { app };