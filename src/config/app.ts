import express, { Request, Response, Application, NextFunction } from "express";
const helmet = require("helmet");
import cors from "cors";
import newsRouter from "../routes/NewsRouter";
import apiDocRouter from "../routes/apiDocRouter";
import httpLogger from "../utils/httpLogger";
import errorMiddleware from "../middlewares/error";
import { APIError } from "../utils/APIError";
import { HttpStatusCode } from "axios";

const app: Application = express();

// middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(httpLogger);

// routes
app.use("/", apiDocRouter);
app.use("/news", newsRouter);

app.all("*", (req: Request, res: Response, next: NextFunction) => {
  next(new APIError("Route not found", "", HttpStatusCode.NotFound));
});

app.use(errorMiddleware);

export default app;
