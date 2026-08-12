import KeywordTracking from "../models/keywordTracking.js";
import { keywordTracking } from "../services/keywordTrackingService.js";
import { scrapeUrl } from "../services/scraperService.js";
import { analyzeSeoData } from "../services/geminiService.js";

// Add a keyword to track
export const addKeyword = async(req,res)=>{
    try {
        const {keyword,url} = req.body;

        if(!keyword || !url) return res.status(400).json({success:false,message:"Ketword and url are required"})

        // Extract domain from url

        let domain;
        try {
            const urlObj = new URL(url.startsWith("http")? url : `https://${url}`);
            domain = urlObj.hostname.replace("www.","")
        } catch (error) {
            return res.status(400).json({success:false,message:"Invalid URL format"});
        }

        // checking if already tracking this keyword+domain
        const existing = await KeywordTracking.findOne({userId:req.userId, keyword:keyword.toLowerCase().trim(), domain});

        if (existing) {
            return res.status(400).json({success:false,message:"Already Tracking this keyword for this domain"})
        }

        // create tracking entry
        const tracking  = await KeywordTracking.create({
            userId : req.userId,
            keyword: keyword.toLowerCase().trim(),
            url : url.startsWith("http") ? url : `https://${url}`,
            domain,
            status: "checking"
        })

        res.status(201).json({success:true,message:"Keyword tracking started",tracking})
        keywordTracking(tracking)

    } catch (error) {
        console.error("Add keywprd error:",error.message);
        console.log("Inner retry error:", error.message); 
        if (error.code === 11000) return res.status(400).json({success:false,message:"Already tracking this keyword"});
        res.status(500).json({success: false,message: "Server Error"});
    }
}

// get all tracked keywords for user
export const getKeywords = async(req,res)=>{

    try {
    const keywords = await KeywordTracking.find({userId: req.userId}).sort({createdAt: -1 }).
    select("-rankHistory")
    res.json({ success: true, keywords });
    } catch (error) {
    console.error("Get keywords error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
    }
}

// get single keyword with full history
export const getKeyword = async(req,res)=>{
    try {
    const tracking = await KeywordTracking.findOne({_id: req.params.id, userId: req.userId});
    if(!tracking) return res.status(404).json({ success: false, message: "Keyword tracking not found" });
    res.json({ success: true, tracking });
    } catch (error) {
    console.error("Get keyword error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
}
}

// mamually refresh a keyword ranking
export const refreshKeyword = async(req,res)=>{
    try {
    const tracking = await KeywordTracking.findOne({_id: req.params.id, userId: req.userId});
    if(!tracking) return res.status(404).json({ success: false, message: "Keyword tracking not found" });
    tracking.status = "checking";
    await tracking.save();
    res.json({ success: true, message: "Rank check started" });
    keywordTracking(tracking)
    } catch (error) {
    console.error("Refresh keyword error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
}
}

// delete keyword tracking
export const deleteKeyword = async(req,res)=>{
    try {
    const tracking = await KeywordTracking.findByIdAndDelete({_id: req.params.id, userId: req.
    userId});
    if(!tracking) return res.status(404).json({ success: false, message: "Keyword tracking not found" });

    res.json({ success: true, message: "Keyword tracking deleted" });

    } catch (error) {
        console.error("Delete keyword error:", error.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

// toggle tracking active/inactive
export const toggleTracking = async(req,res)=>{
    try {
    const tracking = await KeywordTracking.findOne({_id: req.params.id, userId: req.userId});
    if(!tracking) return res.status(404).json({ success: false, message: "Keyword tracking not found" });

    tracking.active = !tracking.active;
    await tracking.save();

    res.json({ success: true, tracking });

    } catch (error) {
        console.error("Toggle Tracking error:", error.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
}


// Compare against the #1 ranked competitor
export const compareCompetitor = async (req, res) => {
    try {
        const tracking = await KeywordTracking.findOne({ _id: req.params.id, userId: req.userId });
        if (!tracking) return res.status(404).json({ success: false, message: "Keyword tracking not found" });

        if (!tracking.competitors || tracking.competitors.length === 0) {
            return res.status(400).json({ success: false, message: "No competitor data available. Try refreshing the rank check first." });
        }

        const topCompetitor = tracking.competitors[0];

        tracking.siteAnalysis = { status: "analyzing" };
        tracking.competitorAnalysis = { status: "analyzing", domain: topCompetitor.domain, url: topCompetitor.url };
        await tracking.save();

        // Helper to scrape + analyze one URL into the shared shape
        async function analyzeOne(url, domain) {
            const scrapeResult = await scrapeUrl(url);
            if (!scrapeResult.success) {
                return { status: "failed", errorMessage: "Could not load the page.", domain, url };
            }
            const aiResult = await analyzeSeoData(scrapeResult.data);
            if (!aiResult.success) {
                return { status: "failed", errorMessage: aiResult.error || "Analysis failed.", domain, url };
            }
            return {
                domain,
                url,
                overallScore: aiResult.data.overallScore || 0,
                categories: aiResult.data.categories || {},
                metaData: scrapeResult.data.metaData || {},
                headings: scrapeResult.data.headings || {},
                links: scrapeResult.data.links || {},
                images: scrapeResult.data.images || {},
                keywords: aiResult.data.keywords || [],
                wordCount: scrapeResult.data.wordCount || 0,
                loadTime: scrapeResult.data.loadTime || 0,
                pageSize: scrapeResult.data.pageSize || 0,
                issues: aiResult.data.issues || [],
                status: "completed",
                errorMessage: "",
                analyzedAt: new Date(),
            };
        }

        // Run both analyses in parallel to save time
        const [siteResult, competitorResult] = await Promise.all([
            analyzeOne(tracking.url, tracking.domain),
            analyzeOne(topCompetitor.url, topCompetitor.domain),
        ]);

        tracking.siteAnalysis = siteResult;
        tracking.competitorAnalysis = competitorResult;
        await tracking.save();

        if (siteResult.status === "failed" || competitorResult.status === "failed") {
            return res.status(207).json({
                success: true,
                partial: true,
                siteAnalysis: tracking.siteAnalysis,
                competitorAnalysis: tracking.competitorAnalysis,
                message: "One or both pages could not be fully analyzed. See details below.",
            });
        }

        res.json({ success: true, siteAnalysis: tracking.siteAnalysis, competitorAnalysis: tracking.competitorAnalysis });

    } catch (error) {
        console.error("Compare competitor error:", error.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
};