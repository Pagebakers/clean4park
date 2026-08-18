import type { APIRoute } from "astro";
import { fetchInstagramFeed } from "../../lib/instagram";

export const prerender = true;

export const GET: APIRoute = async () => {
  const feed = await fetchInstagramFeed();
  return new Response(JSON.stringify(feed), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
};
