import express, { Express, Request, Response, Application } from "express";
const helmet = require("helmet");
import cors from "cors";
import newsRouter from "../router";
import httpLogger from "../utils/httpLogger";
import { getAPIDocs } from "../controllers/DocsController";

const app: Application = express();

// middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(httpLogger);

// routes
app.use("/news", newsRouter);
app.get("/api-doc", getAPIDocs);

export default app;
