import { app } from "./app.js";

const port =  3000;

app.listen(port, () => {
    console.log("API running at http://localhost:3000")
})