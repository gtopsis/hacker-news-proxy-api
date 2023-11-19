import express, { Express, Request, Response, Application } from "express";
import dotenv from "dotenv";
const helmet = require("helmet");
import cors from "cors";
import newsRouter from "./router";
import httpLogger from "./utils/httpLogger";

dotenv.config();

const app: Application = express();

// middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(httpLogger);

// routes
app.use("/news", newsRouter);

export default app;
