// utils/estimateCompetition.js

const AUTHORITY_DOMAINS = [
  'wikipedia.org', 'amazon.com', 'youtube.com', 'facebook.com',
  'linkedin.com', 'instagram.com', 'twitter.com', 'pinterest.com',
  'reddit.com', 'quora.com', 'forbes.com', 'nytimes.com',
  'bbc.com', 'cnn.com', '.gov', '.edu', 'wordpress.com',
  'medium.com', 'shopify.com', 'ebay.com'
];

function isAuthorityDomain(domain) {
  return AUTHORITY_DOMAINS.some(d => domain.toLowerCase().includes(d));
}

function isHomepage(url) {
  try {
    const path = new URL(url).pathname;
    return path === '/' || path === '';
  } catch {
    return false;
  }
}

/**
 * @param {Object} params
 * @param {string} params.keyword - the keyword being analyzed
 * @param {Array} params.topResults - array of { domain, title, url } from top 10 SERP results
 * @param {Object} [params.serpFeatures] - optional flags: { featuredSnippet, peopleAlsoAsk, shoppingAds, localPack }
 * @returns {Object} { score, label, breakdown }
 */
function estimateCompetition({ keyword, topResults, serpFeatures = {} }) {
  if (!topResults || topResults.length === 0) {
    return { score: 0, label: 'Unknown', breakdown: null };
  }

  const total = topResults.length;

  // Signal 1: Authority domains (0-30 points)
  const authorityCount = topResults.filter(r => isAuthorityDomain(r.domain || '')).length;
  const authorityScore = Math.min((authorityCount / total) * 30, 30);

  // Signal 2: Homepage ratio (0-25 points)
  const homepageCount = topResults.filter(r => isHomepage(r.url || '')).length;
  const homepageScore = (homepageCount / total) * 25;

  // Signal 3: Exact keyword match in title (0-20 points)
  const kwLower = keyword.toLowerCase();
  const exactMatchCount = topResults.filter(r =>
    (r.title || '').toLowerCase().includes(kwLower)
  ).length;
  const titleMatchScore = (exactMatchCount / total) * 20;

  // Signal 4: SERP features (0-25 points)
  const featureWeights = {
    featuredSnippet: 10,
    peopleAlsoAsk: 5,
    shoppingAds: 5,
    localPack: 5
  };
  const featureScore = Object.keys(featureWeights).reduce(
    (sum, key) => sum + (serpFeatures[key] ? featureWeights[key] : 0),
    0
  );

  const rawTotal = authorityScore + homepageScore + titleMatchScore + featureScore;
  const score = Math.round(rawTotal);

  const label = score < 30 ? 'Low' : score < 60 ? 'Medium' : 'High';

  return {
    score,
    label,
    breakdown: {
      authorityScore: Math.round(authorityScore),
      homepageScore: Math.round(homepageScore),
      titleMatchScore: Math.round(titleMatchScore),
      featureScore: Math.round(featureScore)
    }
  };
}

module.exports = { estimateCompetition };