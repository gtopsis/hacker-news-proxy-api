import {
  ContentValidityTimestamps,
  NewsType,
  StoriesIds,
  Story,
  StorySourceArticleMetadata,
} from "../types/interfaces";
import { http } from "../utils/http";
import logger from "../utils/logger";
import { chunk } from "lodash";
import { load } from "cheerio";
import StoryModel from "../models/Story";
import ContentValidityTimestampsModel from "../models/ContentValidityTimestamps";
import { isFulfilled, isRejected } from "../utils/promises";

const numberOfTopStories = 10;

const filterStoriesByPopularity = async (
  stories: Story[],
  topNStories: number = 10
): Promise<Story[]> => {
  return new Promise((resolve, reject) => {
    const compareStoriesScoresDesc = (story1: Story, story2: Story) =>
      story2.score - story1.score;

    const sortedStoriesByScore = stories.sort(compareStoriesScoresDesc);

    const topStories: Story[] = sortedStoriesByScore
      .splice(0, topNStories)
      .map((story) => ({ ...story, highlightedFeature: NewsType.POPULAR }));

    resolve(topStories);
  });
};

const filterStoriesByCreationTime = (
  stories: Story[],
  topNStories: number = 10
): Promise<Story[]> => {
  return new Promise((resolve, reject) => {
    const compareStoriesCreationDateDesc = (story1: Story, story2: Story) =>
      story2.time - story1.time;

    const sortedStoriesByTime = stories.sort(compareStoriesCreationDateDesc);

    const topStories: Story[] = sortedStoriesByTime
      .splice(0, topNStories)
      .map((story) => ({ ...story, highlightedFeature: NewsType.RECENT }));

    resolve(topStories);
  });
};

const fetchStoriesIds = async (): Promise<StoriesIds> => {
  const storiesIdsResponse = await http.get<StoriesIds>(
    "/topstories.json?print=pretty"
  );

  return storiesIdsResponse.data;
};

const fetchStoryRequest = (storyId: string) => {
  return http.get<Story>(`/item/${storyId}.json?print=pretty`);
};

const fetchStoryById = async (id: string): Promise<Story> => {
  const storyResponse = await fetchStoryRequest(id);

  return storyResponse.data;
};

const fetchStoryWithArticleMetadata = async (storyId: string) => {
  const story = await fetchStoryById(storyId);
  const metadata = await getStoryArticleMetadata(story.url);

  return { story, metadata };
};

const getStoryArticleMetadata = async (
  url: string
): Promise<Partial<StorySourceArticleMetadata>> => {
  const { data } = await http.get(url);
  const $ = load(data);

  const storySourceArticleMetadata: Partial<StorySourceArticleMetadata> = {
    title: $('meta[property="title"]')?.text(),
    description: $("meta[name=description]")?.attr("content"),
    keywords: $("meta[name=keywords]")?.attr("content"),
    author: $("meta[name=author]")?.attr("content"),
    viewport: $("meta[name=viewport]")?.attr("content"),
    ogTitle: $("meta[name=og:title]")?.attr("content"),
    ogURL: $("meta[name=og:URL]")?.attr("content"),
    ogImage: $("meta[name=og:image]")?.attr("content"),
    ogDescription: $("meta[name=og:Description]")?.attr("content"),
    siteName: $('meta[property="og:site_name"]')?.attr("content"),
  };

  return storySourceArticleMetadata;
};

const fetchStoredStoriesExpirationIntervalsRequest = () => {
  return ContentValidityTimestampsModel.findOne({}, {}, { created_at: -1 });
};

const fetchStoriesOfTypeRequest = (newsType: NewsType) => {
  return StoryModel.find({ highlightedFeature: newsType });
};

const getContentLastUpdateDate = (
  timestamps: ContentValidityTimestamps,
  filter: NewsType
) => {
  switch (filter) {
    case NewsType.POPULAR:
      return timestamps.popularStoriesLastUpdated;

    case NewsType.RECENT:
      return timestamps.recentStoriesLastUpdated;

    case NewsType.HIGHLIGHT:
      return timestamps.highlightStoryLastUpdated;

    default:
      throw new Error(`Non-existent type of news: ${filter}`);
  }
};

const fetchPopulatedStories = async (): Promise<Story[]> => {
  const storiesIds = await fetchStoriesIds();

  let allFetchedStoriesSets: Story[][] = [];

  const chunks = chunk(storiesIds, 20);
  for (const chunk of chunks) {
    const storiesResponse = await Promise.allSettled(
      chunk.map(fetchStoryRequest)
    );

    const storiesSet = storiesResponse
      .filter(isFulfilled)
      .map((s) => s?.value.data);

    allFetchedStoriesSets.push(storiesSet);
  }

  return allFetchedStoriesSets.flat();
};

const getStories = async (filter: Exclude<NewsType, NewsType.HIGHLIGHT>) => {
  const now = new Date();
  try {
    const butchJobsResults1 = await Promise.allSettled([
      fetchStoredStoriesExpirationIntervalsRequest(),
      fetchStoriesOfTypeRequest(filter),
    ]);

    const timestamp = isFulfilled(butchJobsResults1[0])
      ? butchJobsResults1[0].value
      : null;
    const existingStories = isFulfilled(butchJobsResults1[1])
      ? butchJobsResults1[1].value
      : null;

    if (!timestamp || !existingStories) {
      throw new Error("Error fetching timestamp and/or existing stories");
    }

    const contentLastUpdateDate = getContentLastUpdateDate(timestamp, filter);
    const isContentObsolete = doDatesDiffMoreThan(now, contentLastUpdateDate);

    if (isContentObsolete === false) {
      return existingStories;
    }

    const allFetchedStories = await fetchPopulatedStories();

    const filteredFetchedStories =
      filter === NewsType.POPULAR
        ? await filterStoriesByPopularity(allFetchedStories, numberOfTopStories)
        : await filterStoriesByCreationTime(
            allFetchedStories,
            numberOfTopStories
          );

    if (filter === NewsType.POPULAR) {
      timestamp.popularStoriesLastUpdated = now;
    } else {
      timestamp.recentStoriesLastUpdated = now;
    }

    const results2 = await Promise.allSettled([
      StoryModel.insertMany(filteredFetchedStories),
      timestamp.save(),
    ]);

    if (isRejected(results2[0])) {
      throw new Error("Error occured trying to store new stories");
    }

    const newStories = results2[0].value;

    return newStories;
  } catch (error) {
    logger.error(error);

    throw error;
  }
};

const getHighlightStory = async (): Promise<Story> => {
  try {
    const now = new Date();

    const butchJobsResults1 = await Promise.allSettled([
      fetchStoredStoriesExpirationIntervalsRequest(),
      fetchStoriesOfTypeRequest(NewsType.HIGHLIGHT),
    ]);

    const timestamp = isFulfilled(butchJobsResults1[0])
      ? butchJobsResults1[0].value
      : null;
    const existingStory = isFulfilled(butchJobsResults1[1])
      ? butchJobsResults1[1].value[0]
      : null;

    if (!timestamp || !existingStory) {
      throw new Error(
        "Error fetching timestamps and/or existing highlight story"
      );
    }

    const highlightedStoryTTL = 60;
    const contentLastUpdateDate = getContentLastUpdateDate(
      timestamp,
      NewsType.HIGHLIGHT
    );
    const isContentObsolete = doDatesDiffMoreThan(
      now,
      contentLastUpdateDate,
      highlightedStoryTTL
    );

    if (isContentObsolete === false) {
      return existingStory;
    }

    const storiesIds = await fetchStoriesIds();

    const randomIndex = Math.floor(Math.random() * storiesIds.length);
    const randomStoryId = storiesIds[randomIndex];

    const butchJobsResults2 = await Promise.allSettled([
      fetchStoryWithArticleMetadata(randomStoryId),
      StoryModel.deleteMany({
        highlightedFeature: NewsType.HIGHLIGHT,
      }),
    ]);

    const story = isFulfilled(butchJobsResults2[0])
      ? butchJobsResults2[0].value.story
      : null;
    const metadata = isFulfilled(butchJobsResults2[0])
      ? butchJobsResults2[0].value.metadata
      : null;

    const newHighlightStoryPromise = StoryModel.create({
      ...story,
      metadata,
      highlightedFeature: NewsType.HIGHLIGHT,
    });

    timestamp.highlightStoryLastUpdated = now;

    const butchJobsResults3 = await Promise.allSettled([
      newHighlightStoryPromise,
      timestamp.save(),
    ]);

    if (isRejected(butchJobsResults3[0])) {
      throw new Error("Error occured trying to store new stories");
    }

    const newHighlightStory = butchJobsResults3[0].value;

    return newHighlightStory;
  } catch (error) {
    logger.error(error);

    throw error;
  }
};

const refreshStories = async () => {
  const allFetchedStories = await fetchPopulatedStories();
  const randomIndex = Math.floor(Math.random() * allFetchedStories.length);
  const randomStory = allFetchedStories[randomIndex];

  try {
    const butchJobsResults = await Promise.allSettled([
      StoryModel.deleteMany({}),
      filterStoriesByCreationTime(allFetchedStories, numberOfTopStories),
      filterStoriesByPopularity(allFetchedStories, numberOfTopStories),
      getStoryArticleMetadata(randomStory.url),
    ]);

    // get recent
    const allFetchedRecentStories: Story[] = isFulfilled(butchJobsResults[1])
      ? butchJobsResults[1].value
      : [];
    filterStoriesByCreationTime(allFetchedStories);
    // get popular
    const allFetchedPopularStories: Story[] = isFulfilled(butchJobsResults[2])
      ? butchJobsResults[2].value
      : [];

    // get highlight metadata
    const metadata: Partial<StorySourceArticleMetadata> = isFulfilled(
      butchJobsResults[3]
    )
      ? butchJobsResults[3].value
      : {};

    // store stories of all 'types'
    const createStoriesPromise = StoryModel.insertMany([
      ...allFetchedRecentStories,
      ...allFetchedPopularStories,
      {
        ...randomStory,
        metadata,
        highlightedFeature: NewsType.HIGHLIGHT,
      },
    ]);

    // update timestamps
    const now = Date.now();
    const updateTimestampsPromise =
      ContentValidityTimestampsModel.findOneAndUpdate(
        {},
        {
          recentStoriesLastUpdated: now,
          popularStoriesLastUpdated: now,
          highlightStoryLastUpdated: now,
        }
      );

    await Promise.allSettled([createStoriesPromise, updateTimestampsPromise]);
  } catch (error) {
    logger.error(error);

    throw error;
  }
};

export { getStories, getHighlightStory, refreshStories };
