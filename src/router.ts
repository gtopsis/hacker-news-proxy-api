import express from "express";
import {
  getHighlighNewController,
  refreshNewsController,
  getNewsController,
} from "./controllers/NewsController";

const newsRouter = express.Router();
enum Routes {
  FETCH_NEWS = "/",
  FETCH_HIGHLIGHT_NEW = "/highlight",
  REFRESH_NEWS = "/refresh",
}

newsRouter.get(Routes.FETCH_NEWS, getNewsController);

newsRouter.get(Routes.FETCH_HIGHLIGHT_NEW, getHighlighNewController);

newsRouter.post(Routes.REFRESH_NEWS, refreshNewsController);

export default newsRouter;
