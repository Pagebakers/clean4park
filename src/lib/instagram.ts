import {
  INSTAGRAM_HASHTAG,
  INSTAGRAM_PROFILE_URL,
  INSTAGRAM_USERNAME,
} from "../data/instagram";

export type InstagramPost = {
  id: string;
  permalink: string;
  thumbnail: string;
  caption: string;
  timestamp: number;
  username: string;
  isVideo: boolean;
  source: "profile" | "hashtag" | "mention";
};

export type InstagramFeed = {
  username: string;
  profileUrl: string;
  biography: string;
  profilePic: string;
  posts: InstagramPost[];
  fetchedAt: string;
};

const IG_APP_ID = "936619743392459";
const CACHE_MS = 5 * 60 * 1000;

const emptyFeed = (): InstagramFeed => ({
  username: INSTAGRAM_USERNAME,
  profileUrl: INSTAGRAM_PROFILE_URL,
  biography: "Leave your parking cleaner than you found it.",
  profilePic: "",
  posts: [],
  fetchedAt: new Date().toISOString(),
});

let cached: { expires: number; feed: InstagramFeed } | null = null;

const igHeaders: Record<string, string> = {
  Accept: "application/json,text/plain,*/*",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  "X-IG-App-ID": IG_APP_ID,
};

async function getJson(url: string): Promise<unknown | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, {
      headers: igHeaders,
      signal: controller.signal,
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function captionMentionsCampaign(caption: string, username: string): boolean {
  const text = caption.toLowerCase();
  return (
    text.includes(`#${INSTAGRAM_HASHTAG}`) ||
    text.includes(`@${INSTAGRAM_USERNAME}`) ||
    username.toLowerCase() === INSTAGRAM_USERNAME
  );
}

function firstString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.length > 0) return value;
  }
  return "";
}

function firstNumber(...values: unknown[]): number {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return 0;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function captionFromNode(node: Record<string, unknown>): string {
  const edges = asRecord(node.edge_media_to_caption)?.edges;
  if (Array.isArray(edges) && edges[0]) {
    const edge = asRecord(edges[0]);
    const captionNode = asRecord(edge?.node);
    return firstString(captionNode?.text);
  }
  const caption = asRecord(node.caption);
  return firstString(caption?.text, node.caption);
}

function postFromGraphNode(
  node: Record<string, unknown>,
  source: InstagramPost["source"],
  fallbackUsername = "",
): InstagramPost | null {
  const shortcode = firstString(node.shortcode, node.code);
  const id = firstString(node.id, shortcode);
  if (!id && !shortcode) return null;

  const user = asRecord(node.user) ?? asRecord(node.owner);
  const username = firstString(user?.username, node.username, fallbackUsername);
  const caption = captionFromNode(node);
  if (!captionMentionsCampaign(caption, username)) return null;

  const imageVersions = asRecord(node.image_versions2);
  const candidates = Array.isArray(imageVersions?.candidates)
    ? (imageVersions.candidates as unknown[])
    : [];
  const candidate = asRecord(candidates[0]);

  const thumbnail = firstString(
    node.display_url,
    node.thumbnail_src,
    node.media_url,
    candidate?.url,
  );
  const permalink = firstString(
    node.permalink,
    shortcode ? `https://www.instagram.com/p/${shortcode}/` : "",
  );

  return {
    id: id || shortcode,
    permalink,
    thumbnail,
    caption,
    timestamp: firstNumber(node.taken_at_timestamp, node.taken_at, node.timestamp),
    username,
    isVideo: Boolean(node.is_video) || node.media_type === 2 || node.media_type === "VIDEO",
    source,
  };
}

function collectMediaNodes(value: unknown, found: Record<string, unknown>[] = []): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    for (const item of value) collectMediaNodes(item, found);
    return found;
  }

  const record = asRecord(value);
  if (!record) return found;

  if (record.shortcode || record.code || record.display_url || record.media_url) {
    found.push(record);
  }

  const node = asRecord(record.node);
  if (node) collectMediaNodes(node, found);

  const media = asRecord(record.media);
  if (media) collectMediaNodes(media, found);

  for (const key of ["edges", "sections", "medias", "items", "data", "recent", "top", "layout_content"]) {
    if (key in record) collectMediaNodes(record[key], found);
  }

  return found;
}

function mergePosts(posts: InstagramPost[]): InstagramPost[] {
  const byId = new Map<string, InstagramPost>();
  for (const post of posts) {
    const key = post.permalink || post.id;
    const existing = byId.get(key);
    if (!existing || post.timestamp > existing.timestamp) {
      byId.set(key, post);
    }
  }
  return [...byId.values()].sort((a, b) => b.timestamp - a.timestamp).slice(0, 12);
}

async function fetchProfile(): Promise<Pick<InstagramFeed, "biography" | "profilePic"> & { posts: InstagramPost[] }> {
  const json = await getJson(
    `https://www.instagram.com/api/v1/users/web_profile_info/?username=${INSTAGRAM_USERNAME}`,
  );
  const data = asRecord(asRecord(json)?.data);
  const user = asRecord(data?.user);
  if (!user) return { biography: emptyFeed().biography, profilePic: "", posts: [] };

  const media = asRecord(user.edge_owner_to_timeline_media);
  const nodes = collectMediaNodes(media);
  const posts = nodes
    .map((node) => postFromGraphNode(node, "profile", INSTAGRAM_USERNAME))
    .filter((post): post is InstagramPost => Boolean(post));

  return {
    biography: firstString(user.biography, emptyFeed().biography),
    profilePic: firstString(user.profile_pic_url, user.profile_pic_url_hd),
    posts,
  };
}

async function fetchHashtagPosts(): Promise<InstagramPost[]> {
  const endpoints = [
    `https://www.instagram.com/api/v1/tags/web_info/?tag_name=${INSTAGRAM_HASHTAG}`,
    `https://www.instagram.com/api/v1/fbsearch/web/top_serp/?query=${encodeURIComponent(`#${INSTAGRAM_HASHTAG}`)}`,
  ];

  const posts: InstagramPost[] = [];
  for (const endpoint of endpoints) {
    const json = await getJson(endpoint);
    if (!json) continue;
    const nodes = collectMediaNodes(json);
    for (const node of nodes) {
      const post = postFromGraphNode(node, "hashtag");
      if (post) posts.push(post);
    }
    if (posts.length > 0) break;
  }
  return posts;
}

type InstagramAuth = {
  accessToken?: string;
  userId?: string;
};

function readProcessEnv(name: string): string | undefined {
  try {
    return process.env[name];
  } catch {
    return undefined;
  }
}

async function fetchGraphApiPosts(auth: InstagramAuth = {}): Promise<InstagramPost[]> {
  const token = auth.accessToken || readProcessEnv("INSTAGRAM_ACCESS_TOKEN");
  const userId = auth.userId || readProcessEnv("INSTAGRAM_USER_ID");
  if (!token || !userId) return [];

  const fields = "id,caption,media_type,media_url,permalink,timestamp,username";
  const urls = [
    `https://graph.instagram.com/${userId}/media?fields=${fields}&access_token=${token}&limit=12`,
    `https://graph.facebook.com/v21.0/${userId}/tags?fields=${fields}&access_token=${token}&limit=12`,
  ];

  const posts: InstagramPost[] = [];
  for (const url of urls) {
    const json = await getJson(url);
    const data = asRecord(json)?.data;
    if (!Array.isArray(data)) continue;
    for (const item of data) {
      const node = asRecord(item);
      if (!node) continue;
      const caption = firstString(node.caption);
      const username = firstString(node.username);
      if (!captionMentionsCampaign(caption, username)) continue;
      const timestampValue = firstString(node.timestamp);
      posts.push({
        id: firstString(node.id),
        permalink: firstString(node.permalink),
        thumbnail: firstString(node.media_url),
        caption,
        timestamp: timestampValue ? Date.parse(timestampValue) / 1000 : 0,
        username,
        isVideo: node.media_type === "VIDEO",
        source: username.toLowerCase() === INSTAGRAM_USERNAME ? "profile" : "mention",
      });
    }
  }
  return posts;
}

export async function fetchInstagramFeed(auth: InstagramAuth = {}): Promise<InstagramFeed> {
  if (cached && cached.expires > Date.now()) return cached.feed;

  const feed = emptyFeed();
  const [profile, hashtagPosts, graphPosts] = await Promise.all([
    fetchProfile(),
    fetchHashtagPosts(),
    fetchGraphApiPosts(auth),
  ]);

  feed.biography = profile.biography || feed.biography;
  feed.profilePic = profile.profilePic;
  feed.posts = mergePosts([...graphPosts, ...profile.posts, ...hashtagPosts]);
  feed.fetchedAt = new Date().toISOString();

  cached = { expires: Date.now() + CACHE_MS, feed };
  return feed;
}
