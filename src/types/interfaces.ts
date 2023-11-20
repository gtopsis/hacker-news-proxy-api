export enum NewsType {
  RECENT = "recent",
  POPULAR = "popular",
}

export type StoriesIds = string[];

export interface Story {
  by: string;
  descendants: number;
  id: number;
  kids: number[];
  score: number;
  time: number;
  title: string;
  type: string;
  url: string;
}

export interface ContentValidityTimestamps {
  recentStoriesLastUpdated: Date;
  popularStoriesLastUpdated: Date;
  highlightStoryLastUpdated: Date;
}
