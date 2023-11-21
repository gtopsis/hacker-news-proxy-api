import { NextFunction, Request, Response } from "express";
import logger from "../utils/logger";

const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(err);

  res.status(500).send({ errors: [{ message: "Something went wrong" }] });
};

export default errorHandler;
