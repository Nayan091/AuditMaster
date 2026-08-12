import mongoose from 'mongoose'

const rankEntrySchema = new mongoose.Schema({
date: { type: Date, required: true },
position: { type: Number, default: null },
page: { type: Number, default: null },
title: { type: String, default: ""},
snippet: { type: String, default: ""},
},{_id: false})

const competitorSchema = new mongoose.Schema({
position: { type: Number, required: true },
url: {type: String, required: true },
domain: { type: String, required: true },
title: { type: String, default: ""},
snippet: {type: String, default: ""},
}, { id: false })

const siteAnalysisSchema  = new mongoose.Schema({
  domain: { type: String, default: "" },
  url: { type: String, default: "" },
  overallScore: { type: Number, default: 0 },
  categories: {
    seo: { type: Number, default: 0 },
    performance: { type: Number, default: 0 },
    accessibility: { type: Number, default: 0 },
    bestPractices: { type: Number, default: 0 },
  },
  metaData: {
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    canonical: { type: String, default: "" },
    robots: { type: String, default: "" },
    ogTitle: { type: String, default: "" },
    ogDescription: { type: String, default: "" },
    ogImage: { type: String, default: "" },
    twitterCard: { type: String, default: "" },
    viewport: { type: String, default: "" },
    charset: { type: String, default: "" },
  },
  headings: {
    h1: { type: Number, default: 0 },
    h2: { type: Number, default: 0 },
    h3: { type: Number, default: 0 },
    h4: { type: Number, default: 0 },
    h5: { type: Number, default: 0 },
    h6: { type: Number, default: 0 },
    h1Texts: [String],
  },
  links: {
    internal: { type: Number, default: 0 },
    external: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  images: {
    total: { type: Number, default: 0 },
    missingAlt: { type: Number, default: 0 },
    withAlt: { type: Number, default: 0 },
  },
  keywords: [{
    word: String,
    count: Number,
    density: Number,
    competitionScore: Number,
    competitionLabel: String,
  }],
  wordCount: { type: Number, default: 0 },
  loadTime: { type: Number, default: 0 },
  pageSize: { type: Number, default: 0 },
  issues: [{
    severity: String,
    category: String,
    message: String,
    recommendation: String,
    priority: String,
    effort: String,
    suggestedFix: String,
  }],
  status: { type: String, enum: ["idle", "analyzing", "completed", "failed"], default: "idle" },
  errorMessage: { type: String, default: "" },
  analyzedAt: { type: Date, default: null },
}, { _id: false });

const keywordTrackingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    keyword: { type: String, required: true, trim: true, lowercase: true },
    url: { type: String, required: true, trim: true },
    domain: { type: String, required: true },
    currentPosition: { type: Number, default: null },
    currentPage: { type: Number, default: null },
    bestPosition: { type: Number, default: null },
    positionChange: { type: Number, default: 0 },
    rankHistory: [rankEntrySchema],
    competitors: [competitorSchema],
    siteAnalysis: { type: siteAnalysisSchema, default: () => ({}) },
    competitorAnalysis: { type: siteAnalysisSchema, default: () => ({}) },
    active: { type: Boolean, default: true },
    lastChecked: { type: Date, default: null },
    status: {
      type: String,
      enum: ['pending', 'checking', 'completed', 'failed'],
      default: 'pending'
    }
  },
  { timestamps: true }
)

keywordTrackingSchema.index({userId:1,keyword:1,domain:1},{unique:true})

const KeywordTracking = mongoose.model("KeywordTracking",keywordTrackingSchema);

export default KeywordTracking;