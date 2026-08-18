import { fetchInstagramFeed } from "./lib/instagram";

export interface Env {
  ASSETS: Fetcher;
  INSTAGRAM_ACCESS_TOKEN?: string;
  INSTAGRAM_USER_ID?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/instagram.json") {
      const feed = await fetchInstagramFeed({
        accessToken: env.INSTAGRAM_ACCESS_TOKEN,
        userId: env.INSTAGRAM_USER_ID,
      });
      return Response.json(feed, {
        headers: {
          "cache-control": "public, s-maxage=300, stale-while-revalidate=86400",
        },
      });
    }

    return env.ASSETS.fetch(request);
  },
};
