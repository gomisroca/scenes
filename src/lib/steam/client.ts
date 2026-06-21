const APP_LIST_URL =
  "https://api.steampowered.com/IStoreService/GetAppList/v1/";
const APP_DETAILS_URL = "https://store.steampowered.com/api/appdetails";

export type SteamAppListEntry = {
  appid: number;
  name: string;
};

export type SteamGameDetails = {
  steamAppId: number;
  name: string;
  headerImageUrl: string;
  shortDescription: string;
  releaseDate: string;
  developer: string;
  publisher: string;
  genres: string[];
};

let appListCache: SteamAppListEntry[] | null = null;

function getApiKey(): string {
  const key = process.env.STEAM_API_KEY;
  if (!key) {
    throw new Error(
      "STEAM_API_KEY is not set. Add it to .env.local — get a free key at https://steamcommunity.com/dev/apikey",
    );
  }
  return key;
}

export async function getSteamAppList(): Promise<SteamAppListEntry[]> {
  if (appListCache) return appListCache;

  const key = getApiKey();
  const apps: SteamAppListEntry[] = [];
  let lastAppId: number | undefined;

  for (let page = 0; page < 10; page++) {
    const params = new URLSearchParams({
      key,
      max_results: "50000",
      include_games: "true",
    });
    if (lastAppId !== undefined) {
      params.set("last_appid", String(lastAppId));
    }

    const res = await fetch(`${APP_LIST_URL}?${params.toString()}`);
    if (!res.ok) {
      throw new Error(`Steam GetAppList failed: ${res.status}`);
    }

    const data = await res.json();
    const pageApps: SteamAppListEntry[] = data?.response?.apps ?? [];
    apps.push(...pageApps.map((a) => ({ appid: a.appid, name: a.name })));

    const haveMore = data?.response?.have_more_results;
    if (!haveMore || pageApps.length === 0) break;

    lastAppId = data?.response?.last_appid;
  }

  appListCache = apps;
  return appListCache;
}

export async function searchSteamApps(
  query: string,
  limit = 10,
): Promise<SteamAppListEntry[]> {
  const apps = await getSteamAppList();
  const needle = query.trim().toLowerCase();
  if (!needle) return [];

  return apps
    .filter((app) => app.name.toLowerCase().includes(needle))
    .slice(0, limit);
}

export async function fetchSteamGameDetails(
  appId: number,
): Promise<SteamGameDetails | null> {
  const url = `${APP_DETAILS_URL}?appids=${appId}&l=english`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Steam appdetails failed: ${res.status}`);
  }

  const data = await res.json();
  const entry = data[String(appId)];

  if (!entry?.success || !entry.data) {
    return null;
  }

  const d = entry.data;

  return {
    steamAppId: appId,
    name: d.name ?? "",
    headerImageUrl: d.header_image ?? "",
    shortDescription: d.short_description ?? "",
    releaseDate: d.release_date?.date ?? "",
    developer: Array.isArray(d.developers) ? d.developers.join(", ") : "",
    publisher: Array.isArray(d.publishers) ? d.publishers.join(", ") : "",
    genres: Array.isArray(d.genres)
      ? d.genres.map((g: { description: string }) => g.description)
      : [],
  };
}
