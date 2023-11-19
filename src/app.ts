import express, { Express, Request, Response, Application } from "express";
import dotenv from "dotenv";
const helmet = require("helmet");
import cors from "cors";
import { newsRouter } from "./controllers/router";
import { httpLogger } from "./utils/httpLogger";

//For env File
dotenv.config();

const app: Application = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(httpLogger);

app.use(newsRouter);

export default app;
