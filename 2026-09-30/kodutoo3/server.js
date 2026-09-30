import http from "node:http";

import { tasks } from "./index.js";

import { getTaskById } from "./taskHelpers.js";

const server = http.createServer((request, response) => {

    const match = request.url.match(/^\/api\/tasks\/(\d+)$/);

    if (request.method === "GET" && match) {

        const taskId = Number(match[1]);
        const task = getTaskById(tasks, taskId);

        if (!task) {
            response.writeHead(404, {"Content-Type": "application/json" });
            response.end(JSON.stringify({ message: "Task not found" }));
            return;
        }

        response.writeHead(200, { "Content-Type": "application/json" });
        response.end(JSON.stringify(task));
        return
    }

    response.writeHead(404, { "Content-Type": "application/json"});
    response.end(JSON.stringify({ message: "Route not found"}));
});

server.listen(3000, () => {
    console.log("API running at http://localhost:3000");
});
