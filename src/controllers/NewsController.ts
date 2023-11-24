import { Request, Response, NextFunction } from "express";
import {
  getHighlightStory,
  getStories,
  refreshStories,
} from "../services/StoriesService";
import { NewsType, Story } from "../types/interfaces";
import { HttpStatusCode } from "axios";
import { APIError } from "../utils/APIError";

const handleSuccessfullResponse = <T>(res: Response, data?: T) =>
  res.status(HttpStatusCode.Ok).send(data);

const getNewsController = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  const newsType = request.query.type as NewsType;

  try {
    if (newsType !== NewsType.POPULAR && newsType !== NewsType.RECENT) {
      throw new APIError(
        "Incorrect param type",
        "Param type should be any of the following values: " +
          Object.values(NewsType).join(","),
        HttpStatusCode.BadRequest
      );
    }

    const news = await getStories(newsType);

    handleSuccessfullResponse<unknown[]>(response, news);
  } catch (error: unknown) {
    return next(error);
  }
};

const getHighlightNewController = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    const highlightNew = await getHighlightStory();

    handleSuccessfullResponse<Story>(response, highlightNew);
  } catch (error: unknown) {
    return next(error);
  }
};

const refreshNewsController = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    await refreshStories();

    handleSuccessfullResponse<unknown>(response);
  } catch (error: unknown) {
    return next(error);
  }
};

export { getNewsController, getHighlightNewController, refreshNewsController };
