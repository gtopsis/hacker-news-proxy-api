import StoriesFetchedTimestampsModel from "../models/StoriesFetchedTimestamps";

const createInitialStoriesFetchedTimestamps = async () => {
  const contentValidityTimestamps = new StoriesFetchedTimestampsModel({
    recentStoriesLastUpdated: new Date("1970-01-01"),
    popularStoriesLastUpdated: new Date("1970-01-01"),
    highlightStoryLastUpdated: new Date("1970-01-01"),
  });

  await StoriesFetchedTimestampsModel.create(contentValidityTimestamps);
};

const resetStoriesFetchedTimestamps = async () => {
  await StoriesFetchedTimestampsModel.deleteMany({});
  await createInitialStoriesFetchedTimestamps();
};

const getStoredStoriesExpirationIntervalsRequest = () => {
  return StoriesFetchedTimestampsModel.findOne({}, {}, { created_at: -1 });
};

const updateStoriesFetchedTimestampsRequest = (date: number = Date.now()) => {
  return StoriesFetchedTimestampsModel.findOneAndUpdate(
    {},
    {
      recentStoriesLastUpdated: date,
      popularStoriesLastUpdated: date,
      highlightStoryLastUpdated: date,
    }
  );
};

export {
  createInitialStoriesFetchedTimestamps,
  resetStoriesFetchedTimestamps,
  getStoredStoriesExpirationIntervalsRequest,
  updateStoriesFetchedTimestampsRequest,
};
