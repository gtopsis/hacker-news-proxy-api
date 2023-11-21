const swaggerUi = require("swagger-ui-express");
import express from "express";

const apiDocRouter = express.Router();

const swaggerDocument = require("../../docs/api-definition.json");

apiDocRouter.use("/api-docs", swaggerUi.serve);
apiDocRouter.get("/api-docs", swaggerUi.setup(swaggerDocument));

export default apiDocRouter;
