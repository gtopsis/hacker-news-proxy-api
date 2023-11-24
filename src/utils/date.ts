const diffMinutes = (dt2: Date, dt1: Date) => {
  const diff = (dt2.getTime() - dt1.getTime()) / 1000 / 60;

  return Math.abs(Math.round(diff));
};

export const doDatesDiffMoreThan = (
  fromDate: Date | null,
  expirationDate: Date | null,
  acceptedDiffInMinutes: number = 5
): boolean | null => {
  return fromDate && expirationDate
    ? diffMinutes(expirationDate, fromDate) > acceptedDiffInMinutes
    : null;
};
