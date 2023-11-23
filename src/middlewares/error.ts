import { NextFunction, Request, Response } from "express";
import { errorHandler } from "../utils/errorHandler";

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
};

export default errorMiddleware;
