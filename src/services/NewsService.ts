import { NewsType, StoriesIds, Story } from "../types/interfaces";
import { http } from "../utils/http";
import logger from "../utils/logger";
import { chunk, concat } from "lodash";
import { load } from "cheerio";

// credits: https://stackoverflow.com/questions/64928212/how-to-use-promise-allsettled-with-typescript
const isRejected = (
  input: PromiseSettledResult<unknown>
): input is PromiseRejectedResult => input.status === "rejected";

const isFulfilled = <T>(
  input: PromiseSettledResult<T>
): input is PromiseFulfilledResult<T> => input.status === "fulfilled";

const getPopularStories = (stories: Story[]) => {
  const compareStoriesScoresDesc = (story1: Story, story2: Story) =>
    story2.score - story1.score;

  const sortedStoriesByScore = stories.sort(compareStoriesScoresDesc);

  return sortedStoriesByScore.splice(0, 10);
};

const getRecentStories = (stories: Story[]) => {
  const compareStoriesCreationDateDesc = (story1: Story, story2: Story) =>
    story2.time - story1.time;

  const sortedStoriesByScore = stories.sort(compareStoriesCreationDateDesc);

  return sortedStoriesByScore.splice(0, 10);
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

const getStoryArticleMetadata = async (url: string) => {
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

const getStories = async (filter: NewsType) => {
  try {
    const storiesIds = await fetchStoriesIds();

    let allStories: Story[] = [];

    const chunks = chunk(storiesIds, 10);

    for (const chunk of chunks) {
      const storiesResponse = await Promise.allSettled(
        chunk.map(fetchStoryPromise)
      );

      const stories = storiesResponse
        .filter(isFulfilled)
        .map((s) => s?.value.data);

      allStories.push(stories);
    }

    return filter === NewsType.POPULAR
      ? getPopularStories(allStories)
      : getRecentStories(allStories);
  } catch (error) {
    logger.error(error);
  }
};

const getHighlightStory = async () => {
  try {
    const storiesIds = await fetchStoriesIds();

    const randomIndex = Math.floor(Math.random() * storiesIds.length);
    const randomStoryId = storiesIds[randomIndex];

    const story = await fetchStoryById(randomStoryId);

    const metadata = await getStoryArticleMetadata(story.url);

    return { story, metadata };
  } catch (error) {
    console.log(
      "🚀 ~ file: NewsService.ts:105 ~ getHighlightNew ~ error:",
      error
    );
    logger.error(error);
  }
};

const refreshStories = () => {
  return;
};

export { getStories, getHighlightStory, refreshStories };
