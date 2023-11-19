const morgan = require("morgan");
const fs = require("fs");
const path = require("node:path");

// Create a write stream (in append mode)
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "access.log"),
  { flags: "a" }
);

const httpLogger = morgan(morgan("combined", { stream: accessLogStream }));

export default httpLogger;
