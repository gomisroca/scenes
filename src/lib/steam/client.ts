/**
 * Thin wrapper around Steam's public, key-less endpoints:
 *  - GetAppList: full id -> name index, used to *find* an app id
 *  - appdetails: per-app metadata, used to *populate* a game record
 *
 * Both are unauthenticated and free. We don't hit either of these
 * on page render — only when an admin adds a new game — so there's
 * no rate-limit concern at this scale.
 */

const APP_LIST_URL = "https://api.steampowered.com/ISteamApps/GetAppList/v2/";
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

/**
 * Fetches the full Steam app list (id -> name). This is a large
 * payload (tens of thousands of entries), so we cache it in memory
 * for the lifetime of the server process — fine for an admin-only,
 * low-frequency "search for a game to add" flow.
 */
export async function getSteamAppList(): Promise<SteamAppListEntry[]> {
  if (appListCache) return appListCache;

  const res = await fetch(APP_LIST_URL);
  if (!res.ok) {
    throw new Error(`Steam GetAppList failed: ${res.status}`);
  }
  const data = await res.json();
  appListCache = data.applist.apps as SteamAppListEntry[];
  return appListCache;
}

/**
 * Simple case-insensitive substring search over the cached app list.
 * Good enough for an admin typing a game name to find its App ID;
 * not meant for end-user search.
 */
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

/**
 * Fetches full details for a single Steam App ID and shapes them
 * into the fields our `games` table expects. Returns null if Steam
 * has no data for that id (delisted game, invalid id, etc.) rather
 * than throwing, since "not found" is an expected, recoverable case
 * for whoever is adding a game.
 */
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
