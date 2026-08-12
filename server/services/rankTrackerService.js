import { getJson } from "serpapi";

// Search google for a keyword and extract ranking results for a target domain
export async function rankTracker(keyword, targetDomain) {
  try {
    if (!process.env.SERPAPI_KEY) {
      throw new Error("SERPAPI_KEY is missing from environment variables");
    }
    const cleanTarget = targetDomain.replace("www.", "").toLowerCase();

    // console.log("Using SerpApi key:", process.env.SERPAPI_KEY ? process.env.SERPAPI_KEY.slice(0, 6) + "..." : "MISSING");

    const response = await getJson({
      engine: "google",
      api_key: process.env.SERPAPI_KEY,
      q: keyword,
      hl: "en",
      gl: "in",
      num: 50,
    });

    const organicResults = response.organic_results || [];

    if (organicResults.length === 0) {
      return {
        success: true,
        data: {
          keyword,
          targetDomain,
          position: null,
          page: null,
          title: "",
          snippet: "",
          competitors: [],
          totalResultsScanned: 0,
        },
      };
    }

    let found = null;
    const allResults = organicResults.map((r) => {
      let domain = "";
      try {
        domain = new URL(r.link).hostname.replace("www.", "").toLowerCase();
      } catch {
        domain = "";
      }
      return {
        position: r.position,
        url: r.link,
        domain,
        title: r.title || "",
        snippet: r.snippet || "",
      };
    });

    // MOVED HERE — now allResults actually exists
    // console.log("Target domain (cleaned):", cleanTarget);
    // console.log("All domains found:", allResults.map(r => r.domain));

    function isSameDomain(domain, target) {
      const d = domain.toLowerCase().replace(/^www\./, "");
      const t = target.toLowerCase().replace(/^www\./, "");
      return d === t;
    }

    for (const r of allResults) {
      if (!found && isSameDomain(r.domain, cleanTarget)) {
        found = { ...r, page: Math.ceil(r.position / 10) };
        break;
      }
    }

    const competitors = allResults
      .filter((r) => !isSameDomain(r.domain, cleanTarget))
      .slice(0, 10);

    console.log("Result #1 raw:", JSON.stringify(allResults.find(r => r.position === 1), null, 2));
    console.log("Result #1 from SerpApi:", JSON.stringify(organicResults[0], null, 2));

    return {
      success: true,
      data: {
        keyword,
        targetDomain,
        position: found?.position || null,
        page: found?.page || null,
        title: found?.title || "",
        snippet: found?.snippet || "",
        competitors,
        totalResultsScanned: allResults.length,
      },
    };
  } catch (error) {
    console.error("Rank check error (full):", error);
    return { success: false, error: error.message || JSON.stringify(error) || "Unknown error" };
  }
}