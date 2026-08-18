import { fetchInstagramFeed } from "../../src/lib/instagram";

export const onRequestGet = async (): Promise<Response> => {
  const feed = await fetchInstagramFeed();
  return Response.json(feed, {
    headers: {
      "cache-control": "public, s-maxage=300, stale-while-revalidate=86400",
    },
  });
};
