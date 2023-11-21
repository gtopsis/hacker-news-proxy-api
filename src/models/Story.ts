import { NewsType, Story } from "../types/interfaces";
import { model, Schema } from "mongoose";

const storySchema: Schema = new Schema(
  {
    id: {
      type: Number,
      required: true,
    },
    by: {
      type: String,
    },
    title: {
      type: String,
      required: true,
    },
    descendants: {
      type: Number,
    },
    kids: {
      type: [Number],
    },
    score: {
      type: Number,
      required: true,
    },
    time: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
    },
    url: {
      type: String,
    },
    highlightedFeature: {
      type: String,
      enum: NewsType,
      required: true,
    },
    metadata: {
      title: String,
      description: String,
      keywords: String,
      author: String,
      viewport: String,
      ogTitle: String,
      ogURL: String,
      ogImage: String,
      ogDescription: String,
      siteName: String,
    },
  },
  { timestamps: true }
);

export default model<Story>("StoryModel", storySchema);
