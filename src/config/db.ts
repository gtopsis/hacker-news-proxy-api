const mongoose = require("mongoose");
import logger from "../utils/logger";
import { BDConnectionURI } from "./config-env";

export const connectDB = async () => {
  try {
    logger.info("Trying to connect to database to: " + BDConnectionURI);
    await mongoose.connect(BDConnectionURI, {});
  } catch (error: any) {
    console.error(error.message);
    process.exit(1);
  }
};

mongoose.connection.on("connected", () => {
  logger.info("Mongoose connected to db...");
});

mongoose.connection.on("error", (err: Error) => {
  logger.error(err.message);
});

mongoose.connection.on("disconnected", () => {
  logger.info("Mongoose connection is disconnected...");
});

process.on("SIGINT", () => {
  mongoose.connection.close(() => {
    logger.info(
      "Mongoose connection is disconnected due to app termination..."
    );
    process.exit(0);
  });
});
