import app from "./config/app";
import logger from "./utils/logger";
import { port } from "./config/config-env";
import { connectDB } from "./config/db";
import ContentValidityTimestampsModel from "./models/ContentValidityTimestamps";

const createContentValidityTimestamps = async () => {
  const existingDocs = await ContentValidityTimestampsModel.find({});

  if (existingDocs.length === 0) {
    const contentValidityTimestamps = new ContentValidityTimestampsModel({
      recentStoriesLastUpdated: null,
      popularStoriesLastUpdated: null,
      highlightStoryLastUpdated: null,
    });

    await ContentValidityTimestampsModel.create(contentValidityTimestamps);
  }
};

const server = app.listen(port, async () => {
  logger.info(`Listening on port ${port}`);

  await connectDB();

  await createContentValidityTimestamps();
});

process.on("unhandledRejection", (error, promise) => {
  logger.error(`Logged Error: ${error}`);
  server.close(() => process.exit(1));
});
