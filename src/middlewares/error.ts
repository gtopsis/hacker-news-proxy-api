import { NextFunction, Request, Response } from "express";
import logger from "../utils/logger";
import { errorHandler } from "../utils/errorHandler";

const errorMiddleware = async (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(err);
  if (!errorHandler.isTrustedError(err)) {
    return next(err);
  }

  await errorHandler.handleError(err);
};

export default errorMiddleware;
