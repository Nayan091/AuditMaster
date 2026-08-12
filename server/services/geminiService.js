import { GoogleGenAI, Type } from '@google/genai'

const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY})

const seoAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        overallScore: { type: Type.INTEGER },
        categories: {
            type: Type.OBJECT,
            properties: {
                seo: { type: Type.INTEGER },
                performance: { type: Type.INTEGER },
                accessibility: { type: Type.INTEGER },
                bestPractices: { type: Type.INTEGER },
            },
            required: ["seo", "performance", "accessibility", "bestPractices"],
        },
        // keywords: {
        //     type: Type.ARRAY,
        //     minItems: 5,
        //     items: {
        //         type: Type.OBJECT,
        //         properties: {
        //             word: { type: Type.STRING },
        //             count: { type: Type.INTEGER },
        //             density: { type: Type.NUMBER },
        //         },
        //         required: ["word", "count", "density"],
        //     },
        // },
        keywords: {
            type: Type.ARRAY,
            minItems: 5,
            items: {
                type: Type.OBJECT,
                properties: {
                    word: { type: Type.STRING },
                    count: { type: Type.INTEGER },
                    density: { type: Type.NUMBER },
                    competitionScore: { type: Type.INTEGER },
                    competitionLabel: {
                        type: Type.STRING,
                        format: "enum",
                        enum: ["Low", "Medium", "High"],
                    },
                },
                required: ["word", "count", "density", "competitionScore", "competitionLabel"],
            },
        },
        issues: {
            type: Type.ARRAY,
            minItems: 3,
            items: {
                type: Type.OBJECT,
                properties: {
                    severity: {
                        type: Type.STRING,
                        format: "enum",
                        enum: ["critical", "warning", "info"],
                    },
                    category: { type: Type.STRING },
                    message: { type: Type.STRING },
                    recommendation: { type: Type.STRING },
                    priority: {
                        type: Type.STRING,
                        format: "enum",
                        enum: ["Fix First", "Fix Soon", "Nice to Have"],
                    },
                    effort: {
                        type: Type.STRING,
                        format: "enum",
                        enum: ["Quick Fix", "Moderate", "Involved"],
                    },
                    suggestedFix: { type: Type.STRING },
                },
                required: ["severity", "category", "message", "recommendation", "priority", "effort", "suggestedFix"],
            },
        },
    },
    required: ["overallScore", "categories", "keywords", "issues"],
};

export async function analyzeSeoData(scrapedData) {
    // console.log("links:", scrapedData.links);
    // console.log("images:", scrapedData.images);
    // console.log("headings:", scrapedData.headings);
    // console.log("metaData:", scrapedData.metaData);
    try {
        const prompt = `You are an expert SEO analyst. Analyze the following website data and provide a comprehensive SEO audit.

        Website URL: ${scrapedData.url}
        Load Time: ${scrapedData.loadTime}ms
        Status Code: ${scrapedData.statusCode}
        Page Size: ${Math.round(scrapedData.pageSize / 1024)}KB
        Word Count: ${scrapedData.wordCount}

        META DATA:
        - Title: "${scrapedData.metaData.title}" (${scrapedData.metaData.title.length} chars)
        - Description: "${scrapedData.metaData.description}" (${scrapedData.metaData.description.length} chars)
        - Canonical: "${scrapedData.metaData.canonical}"
        - Robots: "${scrapedData.metaData.robots}"
        - OG Title: "${scrapedData.metaData.ogTitle}"
        - OG Description: "${scrapedData.metaData.ogDescription}"
        - OG Image: "${scrapedData.metaData.ogImage}"
        - Twitter Card: "${scrapedData.metaData.twitterCard}"
        - Viewport: "${scrapedData.metaData.viewport}"
        - Charset: "${scrapedData.metaData.charset}"

        HEADINGS:
        - H1: ${scrapedData.headings.h1} (texts: ${JSON.stringify(scrapedData.headings.h1Texts)})
        - H2: ${scrapedData.headings.h2}
        - H3: ${scrapedData.headings.h3}
        - H4: ${scrapedData.headings.h4}
        - H5: ${scrapedData.headings.h5}
        - H6: ${scrapedData.headings.h6}

        LINKS:
        - Internal: ${scrapedData.links.internal}
        - External: ${scrapedData.links.external}
        - Total: ${scrapedData.links.total}

        IMAGES:
        - Total: ${scrapedData.images.total}
        - Missing Alt Text: ${scrapedData.images.missingAlt}
        - With Alt Text: ${scrapedData.images.withAlt}

        PAGE CONTENT (first 3000 chars):
        ${scrapedData.bodyText}

        Scoring guidelines:
        - Title: 50-60 chars optimal, must exist
        - Description: 150-160 chars optimal, must exist
        - H1: exactly 1 is ideal
        - Images: all should have alt text
        - Load time: <3s good, <5s ok, >5s poor
        - Page size: <3MB good
        - Must have viewport meta, charset, canonical
        - OG tags and Twitter cards are important
        - Internal linking is good for SEO
        - Word count: >300 words for content pages
        - Check heading hierarchy

        For each issue, also provide:
        - "priority": how urgently this should be fixed — "Fix First" (major SEO/ranking impact), 
          "Fix Soon" (moderate impact), or "Nice to Have" (minor/cosmetic impact).
        - "effort": how much work the fix requires — "Quick Fix" (under 10 minutes, e.g. editing a meta tag), 
          "Moderate" (some content work, e.g. writing new copy), or "Involved" (structural changes, e.g. rebuilding page speed).
        - "suggestedFix": a ready-to-use, concrete fix the user can copy-paste directly. For example, if the 
          title is too long, write an actual improved title (not just advice). If a meta description is missing, 
          write a real one for this specific page based on its content. Keep suggestedFix under 160 characters 
          for titles/descriptions, or a short code/text snippet for technical issues.

        Severity levels must be exactly one of: "critical", "warning", or "info".
        Provide 5-15 issues sorted by severity (critical first). Be specific and actionable with recommendations.
        Extract top 10 keywords by frequency from the page content.

        For each extracted keyword, also estimate a "competitionScore" (0-100) and "competitionLabel" 
        ("Low", "Medium", or "High") representing how competitive that keyword likely is to rank for 
        organically, based on your general knowledge of search competitiveness for that term/topic 
        (broad generic terms = higher competition, long-tail/specific terms = lower competition).
        This is an estimate, not live SERP data.`;

        

        async function callGeminiWithRetry(params, maxRetries = 3) {
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    return await ai.models.generateContent(params);
                } catch (error) {
                    const is503 = error.message?.includes('"code":503') || error.message?.includes('UNAVAILABLE');
                    const is429 = error.message?.includes('"code":429') || error.message?.includes('RESOURCE_EXHAUSTED') || error.status === 429;

                    if (is429) {
                        // Rate limit hit - don't burn retries fast, wait longer since limits reset per minute
                        if (attempt < maxRetries) {
                            const delay = attempt * 15000; // 15s, 30s
                            console.warn(`Gemini rate limited, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})...`);
                            await new Promise((resolve) => setTimeout(resolve, delay));
                            continue;
                        }
                        // Retries exhausted - throw a tagged error so caller can show a friendly message
                        const rateLimitError = new Error("RATE_LIMIT_EXCEEDED");
                        rateLimitError.isRateLimit = true;
                        throw rateLimitError;
                    }

                    if (is503 && attempt < maxRetries) {
                        const delay = attempt * 2000; // 2s, 4s, 6s
                        console.warn(`Gemini overloaded, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})...`);
                        await new Promise((resolve) => setTimeout(resolve, delay));
                        continue;
                    }
                    throw error;
                }
            }
        }

        // const response = await ai.models.generateContent({
        const response = await callGeminiWithRetry({
        model: 'gemma-4-31b-it',
        contents: [{role: "user", parts: [{text: prompt}]}],
        config: {
            responseMimeType: "application/json",
            responseSchema: seoAnalysisSchema,
        }
        })

        const analysis = JSON.parse(response.text)
        console.log("Issues count:", analysis.issues?.length, "Keywords count:", analysis.keywords?.length);   

        return {success: true, data: analysis}

    } catch (error) {
        console.error("Gemini analysis error:", error.message);
        if (error.isRateLimit) {
            return { success: false, error: "Too many requests right now. Please try again in a minute.", isRateLimit: true };
        }
        return { success: false, error: error.message}
    }
}