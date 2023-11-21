import { NextFunction } from "express";
import { Request, Response } from "express";
import fs from "fs";

export const getAPIDocs = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  const yamlData = fs.readFileSync("./docs/api-definition-base.yml");

  response.header("Content-Type", "text/yaml");
  response.send(yamlData);
};
