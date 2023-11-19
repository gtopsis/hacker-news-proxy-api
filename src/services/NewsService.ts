import { NewsType, StoriesIds, Story } from "../types/interfaces";
import { http } from "../utils/http";
import logger from "../utils/logger";
import { chunk, concat } from "lodash";

// credits: https://stackoverflow.com/questions/64928212/how-to-use-promise-allsettled-with-typescript
const isRejected = (
  input: PromiseSettledResult<unknown>
): input is PromiseRejectedResult => input.status === "rejected";

const isFulfilled = <T>(
  input: PromiseSettledResult<T>
): input is PromiseFulfilledResult<T> => input.status === "fulfilled";

const getPopularNews = () => {};
const getRecentNews = () => {};

const fetchStoriesIds = async () => {
  const storiesIdsResponse = await http.get<StoriesIds>(
    "/topstories.json?print=pretty"
  );

  return storiesIdsResponse;
};

const fetchStory = async (id: string) => {
  const story = await http.get<Story>(`/item/${id}.json?print=pretty`);
  return story;
};

const getNews = async (newsType: NewsType) => {
  try {
    const storiesIdsResponse = await fetchStoriesIds();
    const storiesIds = storiesIdsResponse.data;

    let allStories: Story[] = [];

    const compareStoriesScoresDesc = (story1: Story, story2: Story) =>
      story2.score - story1.score;
    const compareStoriesCreationDateDesc = (story1: Story, story2: Story) =>
      story2.time - story1.time;

    const chunks = chunk(storiesIds, 10);

    for (const chunk of chunks) {
      const storiesResponse = await Promise.allSettled(
        chunk.map((storyId: string) =>
          http.get<Story>(`/item/${storyId}.json?print=pretty`)
        )
      );

      const stories = storiesResponse
        .filter(isFulfilled)
        .map((s) => s?.value.data);

      allStories = concat(allStories, stories);
    }

    const sortedStoriesByScore = allStories.sort(
      newsType === NewsType.POPULAR
        ? compareStoriesScoresDesc
        : compareStoriesCreationDateDesc
    );

    return sortedStoriesByScore.slice(0, 10);
  } catch (error) {
    logger.error(error);
  }
};

const getHighlightNew = () => {
  return {};
};

const refreshNews = () => {
  return;
};

export { getNews, getHighlightNew, refreshNews };
