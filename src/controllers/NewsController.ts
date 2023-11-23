import { Request, Response, NextFunction } from "express";
import {
  getHighlightStory,
  getStories,
  refreshStories,
} from "../services/StoriesService";
import { NewsType, Story } from "../types/interfaces";
import { HttpStatusCode } from "axios";

const handleResponse = <T>(res: Response, data?: T) =>
  res.status(HttpStatusCode.Ok).send(data);

const getNewsController = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  const newsType = request.query.type as NewsType;
  if (newsType !== NewsType.POPULAR && newsType !== NewsType.RECENT) {
    response.status(HttpStatusCode.BadRequest);

    return next({
      error:
        "Param type should be any of the following values: " +
        Object.values(NewsType).join(","),
    });
  }

  const news = await getStories(newsType);

  handleResponse<unknown[]>(response, news);
};

const getHighlightNewController = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  const highlightNew = await getHighlightStory();

  handleResponse<Story>(response, highlightNew);
};

const refreshNewsController = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  await refreshStories();

  handleResponse<unknown>(response);
};

export { getNewsController, getHighlightNewController, refreshNewsController };
