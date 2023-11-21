import express, { Express, Request, Response, Application } from "express";
const helmet = require("helmet");
import cors from "cors";
import newsRouter from "../routes/NewsRouter";
import apiDocRouter from "../routes/apiDocRouter";
import httpLogger from "../utils/httpLogger";

const app: Application = express();

// middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(httpLogger);

// routes
app.use("/news", newsRouter);
app.use("/", apiDocRouter);

export default app;
