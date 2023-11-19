import express, { NextFunction } from "express";
import {
  fetchHighlighNewController,
  fetchNewsController,
  refreshNewsController,
} from "./controllers/newsController";
const newsRouter = express.Router();
enum Routes {
  FETCH_NEWS = "/",
  FETCH_HIGHLIGHT_NEW = "/highlight",
  REFRESH_NEWS = "/refresh",
}

newsRouter.get(Routes.FETCH_NEWS, fetchNewsController);

newsRouter.get(Routes.FETCH_HIGHLIGHT_NEW, fetchHighlighNewController);

newsRouter.post(Routes.REFRESH_NEWS, refreshNewsController);

export default newsRouter;
