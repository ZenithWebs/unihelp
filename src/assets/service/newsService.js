//Newsdata = pub_8e4604fffe4c4da6978410bb483909b7
//Gnews = 83f4c77fb42e587d094456b2ae149c99
//FreeNewsAPI = 204504921e20ea805733e41a32adbb95cabe0f32c73f2a2e6210c7e7edcd203e
// ---------------- CONFIG ----------------
const NEWS_DATA_API_KEY = "pub_8e4604fffe4c4da6978410bb483909b7"; 
const GNEWS_API_KEY = "83f4c77fb42e587d094456b2ae149c99";


// ---------------- FETCH FROM NEWSDATA ----------------
const fetchFromNewsData = async () => {
  try {
    const res = await fetch(
      `https://newsdata.io/api/1/news?apikey=${NEWS_DATA_API_KEY}&country=ng&language=en`
    );

    const data = await res.json();

    return (data.results || []).map((item) => ({
      title: item.title,
      description: item.description,
      link: item.link,
      image: item.image_url,
      source: "NewsData",
    }));
  } catch (err) {
    console.error("NewsData API error:", err);
    return [];
  }
};

const fetchFromGNews = async () => {
  try {
    const res = await fetch(
      `https://gnews.io/api/v4/top-headlines?country=ng&lang=en&token=${GNEWS_API_KEY}`
    );

    const data = await res.json();

    return (data.articles || []).map((item) => ({
      title: item.title,
      description: item.description,
      link: item.url,
      image: item.image,
      source: "GNews",
    }));
  } catch (err) {
    console.error("GNews API error:", err);
    return [];
  }
};

// ---------------- CATEGORY DETECTOR ----------------
const categorize = (text = "") => {
  const t = text.toLowerCase();

  if (
    t.includes("president") ||
    t.includes("government") ||
    t.includes("senate") ||
    t.includes("minister") ||
    t.includes("policy") ||
    t.includes("election")
  )
    return "Politics";

  if (
    t.includes("school") ||
    t.includes("education") ||
    t.includes("university") ||
    t.includes("jamb") ||
    t.includes("waec") ||
    t.includes("student") ||
    t.includes("admission")
  )
    return "Education";

  if (
    t.includes("tech") ||
    t.includes("ai") ||
    t.includes("startup") ||
    t.includes("software") ||
    t.includes("app") ||
    t.includes("internet")
  )
    return "Tech";

  if (
    t.includes("business") ||
    t.includes("economy") ||
    t.includes("naira") ||
    t.includes("bank") ||
    t.includes("finance")
  )
    return "Business";

  if (
    t.includes("football") ||
    t.includes("sport") ||
    t.includes("match")
  )
    return "Sports";

  return "General";
};

// ---------------- REMOVE DUPLICATES ----------------
const removeDuplicates = (articles) => {
  const seen = new Set();

  return articles.filter((item) => {
    const key = item.title;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

// ---------------- MAIN FUNCTION ----------------
export const fetchNigeriaNews = async () => {
  try {
    const [newsData, gnews] = await Promise.all([
      fetchFromNewsData(),
      fetchFromGNews(),
    ]);

    // Merge all sources
    let combined = [...newsData, ...gnews];

    // Filter Nigeria-related content
    combined = combined.filter((item) => {
      const text = (
        (item.title || "") +
        " " +
        (item.description || "")
      ).toLowerCase();

      return (
        text.includes("nigeria") ||
        text.includes("abuja") ||
        text.includes("lagos") ||
        text.includes("fg") ||
        text.includes("federal")
      );
    });

    // Remove duplicates
    combined = removeDuplicates(combined);

    // Add category + id
    const finalData = combined.map((item, index) => ({
      id: index,
      ...item,
      category: categorize(item.title + " " + item.description),
    }));

    return finalData;
  } catch (err) {
    console.error("Fetch Nigeria News Error:", err);
    return [];
  }
};