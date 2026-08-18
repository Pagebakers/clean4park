export type Product = {
  name: string;
  description: string;
  query: string;
  category: string;
};

export const AMAZON_HOST = "www.amazon.com";
export const AMAZON_TAG = "clean4park-20";

export function amazonSearchUrl(query: string): string {
  const params = new URLSearchParams({
    k: query,
    tag: AMAZON_TAG,
  });
  return `https://${AMAZON_HOST}/s?${params.toString()}`;
}

export const products: Product[] = [
  {
    name: "Foldable camping shovel",
    description:
      "A compact shovel for burying waste, covering fire pits, and leaving a pitch looking unused.",
    query: "foldable camping shovel",
    category: "Dig & bury",
  },
  {
    name: "Composting toilet",
    description:
      "The long-term vanlife option: no dumping grey secrets in the bushes, no chemical cassette smell.",
    query: "composting toilet campervan",
    category: "Sanitation",
  },
  {
    name: "Portable camping toilet",
    description:
      "A simple cassette or bucket toilet for nights off-grid — so nature stays a view, not a bathroom.",
    query: "portable camping toilet",
    category: "Sanitation",
  },
  {
    name: "Human waste bags",
    description:
      "WAG-style bags for when you cannot bury or dump. Pack it out. Always.",
    query: "human waste disposal bags camping",
    category: "Pack it out",
  },
  {
    name: "Biodegradable poop bags",
    description:
      "For pets and emergencies. Thin, sealable, and far better than leaving it on the trail.",
    query: "biodegradable poop bags camping",
    category: "Pack it out",
  },
  {
    name: "Litter picker / trash grabber",
    description:
      "Five extra minutes with a grabber and a bag can turn a tired parking into a place people still want to stay.",
    query: "litter picker grabber tool",
    category: "Clean up",
  },
  {
    name: "Collapsible trash can",
    description:
      "Give rubbish a home inside the van so it never 'accidentally' stays behind.",
    query: "collapsible camping trash can",
    category: "Clean up",
  },
  {
    name: "Heavy-duty trash bags",
    description:
      "Strong bags for wet waste, broken glass, and the leftovers other people forgot.",
    query: "heavy duty trash bags camping",
    category: "Pack it out",
  },
  {
    name: "Foldable camping rake",
    description:
      "Rake ashes, leaves, and bottle caps so the next van does not inherit your night.",
    query: "foldable camping rake",
    category: "Clean up",
  },
  {
    name: "Camping dustpan & brush",
    description:
      "Sweep the pitch, the awning, and the last noodle from last night. Tiny kit, huge difference.",
    query: "camping dustpan and brush",
    category: "Clean up",
  },
  {
    name: "Biodegradable camping soap",
    description:
      "Wash dishes and yourself away from streams. Biodegradable still means far from the water.",
    query: "biodegradable camping soap",
    category: "Water care",
  },
  {
    name: "Portable grey water tank",
    description:
      "Catch sink water and empty it at a proper dump point — not under the van at 7am.",
    query: "portable grey water tank camper",
    category: "Water care",
  },
];
