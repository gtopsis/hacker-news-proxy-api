import { StoriesFetchedTimestamps } from "../types/interfaces";
import { model, Schema } from "mongoose";

const StoriesFetchedTimestampsSchema: Schema = new Schema(
  {
    recentStoriesLastUpdated: { type: Date, default: null },
    popularStoriesLastUpdated: { type: Date, default: null },
    highlightStoryLastUpdated: { type: Date, default: null },
  },
  { timestamps: true }
);

export default model<StoriesFetchedTimestamps>(
  "StoriesFetchedTimestampsModel",
  StoriesFetchedTimestampsSchema
);
