export function getCalendarFeedUrl(token: string, systemUrl: string) {
  const baseUrl = systemUrl.replace(/\/+$/, "");
  return `${baseUrl}/calendar/${token}.ics`;
}
