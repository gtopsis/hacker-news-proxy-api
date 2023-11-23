import app from "./config/app";
import logger from "./utils/logger";
import { port } from "./config/config-env";
import { connectDB } from "./config/db";
import ContentValidityTimestampsModel from "./models/ContentValidityTimestamps";
import { errorHandler } from "./utils/errorHandler";

const createContentValidityTimestamps = async () => {
  await ContentValidityTimestampsModel.deleteMany({});

  const contentValidityTimestamps = new ContentValidityTimestampsModel({
    recentStoriesLastUpdated: new Date("1970-01-01"),
    popularStoriesLastUpdated: new Date("1970-01-01"),
    highlightStoryLastUpdated: new Date("1970-01-01"),
  });

  await ContentValidityTimestampsModel.create(contentValidityTimestamps);
};

const server = app.listen(port, async () => {
  logger.info(`Listening on port ${port}`);

  await connectDB();

  await createContentValidityTimestamps();
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
