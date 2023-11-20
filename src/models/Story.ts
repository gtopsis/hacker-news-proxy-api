import { Story } from "../types/interfaces";
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
      required: true,
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
      required: true,
    },
  },
  { timestamps: true }
);

export default model<Story>("Story", storySchema);
