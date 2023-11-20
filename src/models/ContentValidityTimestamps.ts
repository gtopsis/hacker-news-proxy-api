import { ContentValidityTimestamps } from "../types/interfaces";
import { model, Schema } from "mongoose";

const ContentValidityTimestampsSchema: Schema = new Schema(
  {
    recentStoriesLastUpdated: { type: Date, default: null },
    popularStoriesLastUpdated: { type: Date, default: null },
    highlightStoryLastUpdated: { type: Date, default: null },
  },
  { timestamps: true }
);

export default model<ContentValidityTimestamps>(
  "ContentValidityTimestampsModel",
  ContentValidityTimestampsSchema
);
