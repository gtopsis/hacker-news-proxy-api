import app from "./app";
import logger from "./utils/logger";
import { port } from "./utils/config";

app.listen(port, () => {
  logger.info(`Listening on port ${port}`);
});
