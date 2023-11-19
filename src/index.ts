import app from "./app";
import logger from "./utils/logger";

const port = process.env.PORT || 8000;

app.listen(port, () => {
  logger.info(`Listening on port ${port}`);
});
