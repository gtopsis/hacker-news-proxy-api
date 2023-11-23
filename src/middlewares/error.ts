import { NextFunction, Request, Response } from "express";
import { errorHandler } from "../utils/errorHandler";
import { HttpStatusCode } from "axios";
import { APIError } from "../utils/APIError";

const errorMiddleware = async (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!errorHandler.isTrustedError(err)) {
    return next(err);
  }

  await errorHandler.handleError(err);

  const statusCode =
    err instanceof APIError ? err.httpCode : HttpStatusCode.InternalServerError;
  res.status(statusCode).send(err);
};

export default errorMiddleware;
