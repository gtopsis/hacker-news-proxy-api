import app from "./config/app";
import logger from "./utils/logger";
import { port } from "./config/config-env";
import { connectDB } from "./config/db";

const server = app.listen(port, async () => {
  logger.info(`Listening on port ${port}`);
  connectDB();
});

process.on("unhandledRejection", (error, promise) => {
  logger.error(`Logged Error: ${error}`);
  server.close(() => process.exit(1));
});
