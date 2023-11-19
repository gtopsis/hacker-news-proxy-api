import { NextFunction } from "express";
import { Request, Response } from "express";
import { getHighlightNew, getNews, refreshNews } from "../services/NewsService";
import { NewsType } from "../types/interfaces";

enum HTTP_STATUS_CODE {
  SUCCESS = 200,
  WRONG_REQUEST = 404,
}

const getNewsController = (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  const newsType = request.query.type as string;
  if (!newsType || !Object.values(NewsType).includes(newsType as NewsType)) {
    response.status(HTTP_STATUS_CODE.WRONG_REQUEST);

    return next({
      error:
        "Param type should be any of the following values: " +
        validTypes.join(","),
    });
  }

  const news = getNews(newsType as NewsType);

  response.status(HTTP_STATUS_CODE.SUCCESS).json(news);
};

const getHighlighNewController = (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  const highlightNew = getHighlightNew();

  response.status(HTTP_STATUS_CODE.SUCCESS).json(highlightNew);
};

const refreshNewsController = (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  refreshNews();

  response.status(HTTP_STATUS_CODE.SUCCESS).json();
};

export { getNewsController, getHighlighNewController, refreshNewsController };
