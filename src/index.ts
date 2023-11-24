import app from "./config/app";
import logger from "./utils/logger";
import { port } from "./config/config-env";
import { connectDB } from "./config/db";
import StoriesFetchedTimestamps from "./models/StoriesFetchedTimestamps";
import { errorHandler } from "./utils/errorHandler";
import {
  createInitialStoriesFetchedTimestamps,
  resetStoriesFetchedTimestamps,
} from "./services/StoriesFetchedTimestampsService";

const server = app.listen(port, async () => {
  logger.info(`Listening on port ${port}`);

  await connectDB();

  await resetStoriesFetchedTimestamps();
});

// get the unhandled rejection (Promises rejected and we don't handle those rejections) and throw it to another fallback handler we already have.
process.on("unhandledRejection", (reason: Error, promise: Promise<any>) => {
  throw reason;
});

process.on("uncaughtException", (error: Error) => {
  errorHandler.handleError(error);

  // handle all programmatic errors (due to bugs) that error middleware intentionaly skipped
  if (!errorHandler.isTrustedError(error)) {
    logger.error(`Exit process due to a bug. Error: ${error}`);
    server.close(() => process.exit(1));
  }
});
