import { NextFunction } from "express";
import { Request, Response } from "express";

const fetchNewsController = (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  const newsType = request.query.type as string;
  const validTypes = ["recent", "popular"];
  if (!newsType || !validTypes.includes(newsType)) {
    response.status(400);

    return next({
      error:
        "Param type should be any of the following values: " +
        validTypes.join(","),
    });
  }

  response.status(200).json({
    test: request.query,
  });
};

const fetchHighlighNewController = (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  response.status(200).json({
    test: "test",
  });
};

const refreshNewsController = (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  response.status(200).json({
    test: "test",
  });
};

export {
  fetchNewsController,
  fetchHighlighNewController,
  refreshNewsController,
};
