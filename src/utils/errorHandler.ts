import { BaseError } from "./baseError";
import logger from "./logger";

class ErrorHandler {
  public async handleError(err: Error): Promise<void> {
    await logger.error(
      "Error message from the centralized error-handling component",
      err
    );
  }

  public isTrustedError(error: Error) {
    return error instanceof BaseError ? error.isOperational : false;
  }
}

export const errorHandler = new ErrorHandler();
