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

const filterStoriesByPopularity = (stories: Story[]) => {
  const compareStoriesScoresDesc = (story1: Story, story2: Story) =>
    story2.score - story1.score;

  const sortedStoriesByScore = stories.sort(compareStoriesScoresDesc);

  return sortedStoriesByScore
    .splice(0, 10)
    .map((story) => ({ ...story, highlightedFeature: NewsType.POPULAR }));
};

const filterStoriesByCreationTime = (stories: Story[]) => {
  const compareStoriesCreationDateDesc = (story1: Story, story2: Story) =>
    story2.time - story1.time;

  const sortedStoriesByTime = stories.sort(compareStoriesCreationDateDesc);

  return sortedStoriesByTime
    .splice(0, 10)
    .map((story) => ({ ...story, highlightedFeature: NewsType.RECENT }));
};

const fetchStoriesIds = async () => {
  const storiesIdsResponse = await http.get<StoriesIds>(
    "/topstories.json?print=pretty"
  );

  return storiesIdsResponse.data;
};

const fetchStoryPromise = (storyId: string) => {
  return http.get<Story>(`/item/${storyId}.json?print=pretty`);
};

const fetchStoryById = async (id: string) => {
  const storyResponse = await fetchStoryPromise(id);

  return storyResponse.data;
};

const getStoryArticleMetadata = async (
  url: string
): Promise<Partial<StorySourceArticleMetadata>> => {
  const { data } = await http.get(url);
  const $ = load(data);

  const title = $('meta[property="title"]')?.text();
  const description = $("meta[name=description]")?.attr("content");
  const keywords = $("meta[name=keywords]")?.attr("content");
  const author = $("meta[name=author]")?.attr("content");
  const viewport = $("meta[name=viewport]")?.attr("content");
  const ogTitle = $("meta[name=og:title]")?.attr("content");
  const ogURL = $("meta[name=og:URL]")?.attr("content");
  const ogImage = $("meta[name=og:image]")?.attr("content");
  const ogDescription = $("meta[name=og:Description]")?.attr("content");
  const siteName = $('meta[property="og:site_name"]')?.attr("content");

  return {
    title,
    description,
    keywords,
    author,
    viewport,
    ogTitle,
    ogURL,
    ogImage,
    ogDescription,
    siteName,
  };
};

const diffMinutes = (dt2: Date, dt1: Date) => {
  const diff = (dt2.getTime() - dt1.getTime()) / 1000 / 60;

  return Math.abs(Math.round(diff));
};

const doDatesDiffMoreThan = (
  from: Date | null,
  expirationDate: Date | null,
  acceptedDiffInMinutes: number = 5
): boolean | null => {
  return from && expirationDate
    ? diffMinutes(expirationDate, from) > acceptedDiffInMinutes
    : null;
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

const fetchPopulatedStories = async () => {
  const storiesIds = await fetchStoriesIds();

  let allFetchedStoriesSets: Story[][] = [];

  const chunks = chunk(storiesIds, 20);
  for (const chunk of chunks) {
    const storiesResponse = await Promise.allSettled(
      chunk.map(fetchStoryPromise)
    );

    const storiesSet = storiesResponse
      .filter(isFulfilled)
      .map((s) => s?.value.data);

    allFetchedStoriesSets.push(storiesSet);
  }

  return allFetchedStoriesSets.flat();
};

const getStories = async (filter: Exclude<NewsType, NewsType.HIGHLIGHT>) => {
  try {
    const now = new Date();

    const timestamps = await ContentValidityTimestampsModel.find({});

    const contentLastUpdateDate = getContentLastUpdateDate(
      timestamps[0],
      filter
    );
    const isContentObsolete = doDatesDiffMoreThan(now, contentLastUpdateDate);

    if (isContentObsolete === false) {
      return await StoryModel.find({ highlightedFeature: filter });
    }

    const allFetchedStories = await fetchPopulatedStories();

    const filteredFetchedStories =
      filter === NewsType.POPULAR
        ? filterStoriesByPopularity(allFetchedStories)
        : filterStoriesByCreationTime(allFetchedStories);

    if (filter === NewsType.POPULAR) {
      timestamps[0].popularStoriesLastUpdated = now;
    } else {
      timestamps[0].recentStoriesLastUpdated = now;
    }

    const results = await Promise.allSettled([
      StoryModel.insertMany(filteredFetchedStories),
      timestamps[0].save(),
    ]);

    if (isRejected(results[0])) {
      throw new Error("Error occured trying to store new stories");
    }

    const storedStories = results[0].value;

    return storedStories;
  } catch (error) {
    logger.error(error);
  }
};

const getHighlightStory = async () => {
  try {
    const now = new Date();

    const timestamps = await ContentValidityTimestampsModel.find({});

    const highlightedStoryTTL = 60;
    const contentLastUpdateDate = getContentLastUpdateDate(
      timestamps[0],
      NewsType.HIGHLIGHT
    );
    const isContentObsolete = doDatesDiffMoreThan(
      now,
      contentLastUpdateDate,
      highlightedStoryTTL
    );

    if (isContentObsolete === false) {
      return await StoryModel.find({ highlightedFeature: NewsType.HIGHLIGHT });
    }

    const storiesIds = await fetchStoriesIds();

    const randomIndex = Math.floor(Math.random() * storiesIds.length);
    const randomStoryId = storiesIds[randomIndex];

    const story = await fetchStoryById(randomStoryId);
    const metadata = await getStoryArticleMetadata(story.url);

    await StoryModel.deleteMany({
      highlightedFeature: NewsType.HIGHLIGHT,
    });
    const newHighlightStoryPromise = StoryModel.create({
      ...story,
      metadata,
      highlightedFeature: NewsType.HIGHLIGHT,
    });

    timestamps[0].highlightStoryLastUpdated = now;

    const results = await Promise.allSettled([
      newHighlightStoryPromise,
      timestamps[0].save(),
    ]);

    if (isRejected(results[0])) {
      throw new Error("Error occured trying to store new stories");
    }

    const newHighlightStory = results[0].value;

    return newHighlightStory;
  } catch (error) {
    logger.error(error);
  }
};

const refreshStories = async () => {
  const allFetchedStories = await fetchPopulatedStories();
  const randomIndex = Math.floor(Math.random() * allFetchedStories.length);
  const randomStory = allFetchedStories[randomIndex];

  const results = await Promise.allSettled([
    StoryModel.deleteMany({}),
    new Promise((resolve, reject) => {
      // get recent
      const allFetchedRecentStories =
        filterStoriesByCreationTime(allFetchedStories);
      // get popular
      const allFetchedPopularStories =
        filterStoriesByPopularity(allFetchedStories);

      resolve({
        popular: allFetchedPopularStories,
        recent: allFetchedRecentStories,
      });
    }),
    getStoryArticleMetadata(randomStory.url),
  ]);

  // get recent
  const allFetchedRecentStories = isFulfilled(results[1])
    ? results[1].value?.recent
    : [];
  filterStoriesByCreationTime(allFetchedStories);
  // get popular
  const allFetchedPopularStories = isFulfilled(results[1])
    ? results[1].value?.popular
    : [];

  // get highlight metadata
  const metadata = isFulfilled(results[2]) ? results[2].value : {};

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
};

export { getStories, getHighlightStory, refreshStories };
