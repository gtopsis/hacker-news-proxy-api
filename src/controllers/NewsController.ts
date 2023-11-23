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
  if (newsType !== NewsType.POPULAR && newsType !== NewsType.RECENT) {
    return next(
      new APIError(
        "Incorrect param type",
        "Param type should be any of the following values: " +
          Object.values(NewsType).join(","),
        HttpStatusCode.BadRequest
      )
    );
  }

  const news = await getStories(newsType);

  handleSuccessfullResponse<unknown[]>(response, news);
};

const getHighlightNewController = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  const highlightNew = await getHighlightStory();

  handleSuccessfullResponse<Story>(response, highlightNew);
};

const refreshNewsController = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  await refreshStories();

  handleSuccessfullResponse<unknown>(response);
};

export { getNewsController, getHighlightNewController, refreshNewsController };
