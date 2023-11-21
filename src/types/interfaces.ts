export enum NewsType {
  RECENT = "recent",
  POPULAR = "popular",
  HIGHLIGHT = "highlight",
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

export interface StorySourceArticleMetadata {
  title: string;
  description: string;
  keywords: string;
  author: string;
  viewport: string;
  ogTitle: string;
  ogURL: string;
  ogImage: string;
  ogDescription: string;
  siteName: string;
}
