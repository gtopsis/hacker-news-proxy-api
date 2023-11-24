import {
  StoriesFetchedTimestamps,
  NewsType,
  StoriesIds,
  Story,
  StorySourceArticleMetadata,
} from "../types/interfaces";
import { http } from "../utils/http";
import { chunk } from "lodash";
import { load } from "cheerio";
import StoryModel from "../models/Story";
import StoriesFetchedTimestampsModel from "../models/StoriesFetchedTimestamps";
import { isFulfilled, isRejected } from "../utils/promises";
import { APIError } from "../utils/APIError";
import { doDatesDiffMoreThan } from "../utils/date";

const numberOfTopStories = 10;

const getTopNStoriesBy = (
  stories: Story[],
  numberOfTopStories: number,
  feature: "score" | "time"
): Story[] => {
  if (stories.length === 0 || numberOfTopStories === 0) {
    return [];
  }

  let storyWithMaxValue: Story = stories[0];
  let storyWithMaxValueIndex: number = 0;
  for (let index = 1; index < stories.length; index++) {
    const element = stories[index];

    if (!storyWithMaxValue) {
      storyWithMaxValue = element;
    }
    if (element[feature] > storyWithMaxValue[feature]) {
      storyWithMaxValue = element;
      storyWithMaxValueIndex = index;
    }
  }
  stories.splice(storyWithMaxValueIndex, 1);
  const smallerValues = getTopNStoriesBy(
    [...stories], // pass a SHAWLOW copy of the stories' collection
    numberOfTopStories - 1,
    feature
  );

  return [storyWithMaxValue, ...smallerValues];
};

const filterStoriesByPopularity = async (
  stories: Story[],
  topNStories: number = 10
): Promise<Story[]> => {
  return new Promise((resolve, reject) => {
    const topStories: Story[] = getTopNStoriesBy(stories, topNStories, "score");

    resolve(topStories);
  });
};

const filterStoriesByCreationTime = (
  stories: Story[],
  topNStories: number = 10
): Promise<Story[]> => {
  return new Promise((resolve, reject) => {
    const topStories: Story[] = getTopNStoriesBy(stories, topNStories, "time");

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
  return StoriesFetchedTimestampsModel.findOne({}, {}, { created_at: -1 });
};

const fetchStoriesOfTypeRequest = (newsType: NewsType) => {
  return StoryModel.find({ highlightedFeature: newsType });
};

const insertStoriesRequest = (stories: Story[]) => {
  return StoryModel.insertMany(stories);
};

const getFetchedDateOfStoryWithType = (
  timestamps: StoriesFetchedTimestamps,
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
      throw new APIError(`Non-existent type of news: ${filter}`);
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
  let butchJobsResults1 = [];
  let butchJobsResults2 = [];

  try {
    butchJobsResults1 = await Promise.allSettled([
      fetchStoredStoriesExpirationIntervalsRequest(),
      fetchStoriesOfTypeRequest(filter),
    ]);
  } catch (error) {
    // identify the failed operations and revert the successful ones (i.e dn ops)
    throw error;
  }

  const timestamp = isFulfilled(butchJobsResults1[0])
    ? butchJobsResults1[0].value
    : null;
  const existingStories = isFulfilled(butchJobsResults1[1])
    ? butchJobsResults1[1].value
    : null;

  if (!timestamp || !existingStories) {
    throw new APIError("Error fetching timestamp and/or existing stories");
  }

  const fetchedDateOfStoriesWithType = getFetchedDateOfStoryWithType(
    timestamp,
    filter
  );
  const isContentObsolete = doDatesDiffMoreThan(
    now,
    fetchedDateOfStoriesWithType
  );

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

  let newStories = [];
  try {
    butchJobsResults2 = await Promise.allSettled([
      insertStoriesRequest(
        filteredFetchedStories.map((story) => ({
          ...story,
          highlightedFeature: filter,
        }))
      ),
      timestamp.save(),
    ]);

    if (isRejected(butchJobsResults2[0])) {
      throw new APIError("Error occured trying to store new stories");
    }

    newStories = butchJobsResults2[0].value;
  } catch (error) {
    // identify the failed operations and revert the successful ones (i.e dn ops)
    throw error;
  }

  return newStories;
};

const getHighlightStory = async (): Promise<Story> => {
  const now = new Date();
  let butchJobsResults1 = [];
  let butchJobsResults2 = [];
  let butchJobsResults3 = [];

  try {
    butchJobsResults1 = await Promise.allSettled([
      fetchStoredStoriesExpirationIntervalsRequest(),
      fetchStoriesOfTypeRequest(NewsType.HIGHLIGHT),
    ]);
  } catch (error) {
    // identify the failed operations and revert the successful ones (i.e dn ops)

    throw error;
  }

  const timestamp = isFulfilled(butchJobsResults1[0])
    ? butchJobsResults1[0].value
    : null;
  const existingStory = isFulfilled(butchJobsResults1[1])
    ? butchJobsResults1[1].value[0]
    : null;

  if (!timestamp || !existingStory) {
    throw new APIError(
      "Error fetching timestamps and/or existing highlight story"
    );
  }

  const highlightedStoryTTL = 60;
  const highlightStoryFetchedDate = getFetchedDateOfStoryWithType(
    timestamp,
    NewsType.HIGHLIGHT
  );
  const isContentObsolete = doDatesDiffMoreThan(
    now,
    highlightStoryFetchedDate,
    highlightedStoryTTL
  );

  if (isContentObsolete === false) {
    return existingStory;
  }

  const storiesIds = await fetchStoriesIds();

  const randomIndex = Math.floor(Math.random() * storiesIds.length);
  const randomStoryId = storiesIds[randomIndex];

  try {
    butchJobsResults2 = await Promise.allSettled([
      fetchStoryWithArticleMetadata(randomStoryId),
      StoryModel.deleteMany({
        highlightedFeature: NewsType.HIGHLIGHT,
      }),
    ]);
  } catch (error) {
    // identify the failed operations and revert the successful ones (i.e dn ops)

    throw error;
  }

  const story = isFulfilled(butchJobsResults2[0])
    ? butchJobsResults2[0].value.story
    : null;
  const metadata = isFulfilled(butchJobsResults2[0])
    ? butchJobsResults2[0].value.metadata
    : null;

  const createHighlightStoryPromise = StoryModel.create({
    ...story,
    metadata,
    highlightedFeature: NewsType.HIGHLIGHT,
  });

  timestamp.highlightStoryLastUpdated = now;

  try {
    butchJobsResults3 = await Promise.allSettled([
      createHighlightStoryPromise,
      timestamp.save(),
    ]);
  } catch (error) {
    // identify the failed operations and revert the successful ones (i.e dn ops)

    throw error;
  }

  if (isRejected(butchJobsResults3[0])) {
    throw new APIError("Error occured trying to store new stories");
  }

  const newHighlightStory = butchJobsResults3[0].value;

  return newHighlightStory;
};

const refreshStories = async () => {
  const allFetchedStories = await fetchPopulatedStories();
  const randomIndex = Math.floor(Math.random() * allFetchedStories.length);
  const randomStory = allFetchedStories[randomIndex];

  let butchJobsResults = [];

  try {
    butchJobsResults = await Promise.allSettled([
      StoryModel.deleteMany({}),
      filterStoriesByCreationTime(allFetchedStories, numberOfTopStories),
      filterStoriesByPopularity(allFetchedStories, numberOfTopStories),
      getStoryArticleMetadata(randomStory.url),
    ]);
  } catch (error) {
    // identify the failed operations and revert the successful ones (i.e dn ops)

    throw error;
  }

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

  // update timestamps
  const now = Date.now();
  const updateTimestampsPromise =
    StoriesFetchedTimestampsModel.findOneAndUpdate(
      {},
      {
        recentStoriesLastUpdated: now,
        popularStoriesLastUpdated: now,
        highlightStoryLastUpdated: now,
      }
    );

  // store stories of all 'types'
  const newHighlightStory = {
    ...randomStory,
    metadata,
    highlightedFeature: NewsType.HIGHLIGHT,
  };

  try {
    await Promise.allSettled([
      insertStoriesRequest([
        ...allFetchedRecentStories,
        ...allFetchedPopularStories,
        newHighlightStory,
      ]),
      updateTimestampsPromise,
    ]);
  } catch (error) {
    // identify the failed operations and revert the successful ones (i.e dn ops)

    throw error;
  }
};

export { getStories, getHighlightStory, refreshStories };
