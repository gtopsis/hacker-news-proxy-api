import { NextFunction } from "express";
import { Request, Response } from "express";
import fs from "fs";
import { resolve } from "path";

export const getAPIDocs = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  const yamlData = fs.readFileSync(
    resolve(__dirname, "../../docs/api-definition-base.yaml")
  );

  response.header("Content-Type", "text/yaml");
  response.send(yamlData);
};
