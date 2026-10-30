import express from "express";
import healthRouter from "./src/routes/health.routes.js";
import materiasRouter from "./src/routes/materias.routes.js";
import {attachTemporaryUser} from"./src/middlewares/request-context.middleware.js"
import { errorHandler, notFoundHandler } from "./src/middlewares/error.middleware.js";

const app = express();

app.use(express.json());
app.use(attachTemporaryUser);

app.use("/api/v1/health", healthRouter);
app.use("/api/v1/materias" , materiasRouter);

app.use(notFoundHandler);
app.use(errorHandler);


export default app;