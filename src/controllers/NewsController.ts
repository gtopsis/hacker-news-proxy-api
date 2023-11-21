import { NextFunction } from "express";
import { Request, Response } from "express";
import {
  getHighlightStory,
  getStories,
  refreshStories,
} from "../services/StoriesService";
import { NewsType } from "../types/interfaces";

enum HTTP_STATUS_CODE {
  SUCCESS = 200,
  WRONG_REQUEST = 404,
}

const getNewsController = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  const newsType = request.query.type as NewsType;
  if (newsType !== NewsType.POPULAR && newsType !== NewsType.RECENT) {
    response.status(HTTP_STATUS_CODE.WRONG_REQUEST);

    return next({
      error:
        "Param type should be any of the following values: " +
        Object.values(NewsType).join(","),
    });
  }

  const news = await getStories(newsType);

  response.status(HTTP_STATUS_CODE.SUCCESS).json(news);
};

const getHighlightNewController = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  const highlightNew = await getHighlightStory();

  response.status(HTTP_STATUS_CODE.SUCCESS).json(highlightNew);
};

const refreshNewsController = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  await refreshStories();

  response.status(HTTP_STATUS_CODE.SUCCESS).json();
};

export {
  getNewsController,
  getHighlightNewController as getHighlighNewController,
  refreshNewsController,
};
