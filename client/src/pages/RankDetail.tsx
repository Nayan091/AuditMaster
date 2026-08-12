/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Target, Globe, Clock, TrendingUp, TrendingDown, Minus, RefreshCw, AlertCircle, ExternalLink, Trophy, Users, Calendar, Loader2 } from "lucide-react";
// import { dummyWebsiteRanking } from "../assets/assets";
import { useApp } from "../context/useApp";

interface RankHistoryEntry {
    date: string;
    position: number | null;
    page: number | null;
    title: string;
    snippet: string;
}

interface Competitor {
    position: number;
    url: string;
    domain: string;
    title: string;
    snippet: string;
}

interface CompetitorAnalysis {
    domain: string;
    url: string;
    overallScore: number;
    categories: { seo: number; performance: number; accessibility: number; bestPractices: number };
    metaData: { title: string; description: string; canonical: string; robots: string; ogTitle: string; ogDescription: string; ogImage: string; twitterCard: string; viewport: string; charset: string };
    headings: { h1: number; h2: number; h3: number; h4: number; h5: number; h6: number; h1Texts: string[] };
    links: { internal: number; external: number; total: number };
    images: { total: number; missingAlt: number; withAlt: number };
    keywords: { word: string; count: number; density: number; competitionScore: number; competitionLabel: string }[];
    wordCount: number;
    loadTime: number;
    pageSize: number;
    issues: { severity: string; category: string; message: string; recommendation: string; priority: string; effort: string; suggestedFix: string }[];
    status: string;
    errorMessage: string;
    analyzedAt: string | null;
}

interface TrackingData {
    _id: string;
    keyword: string;
    url: string;
    domain: string;
    currentPosition: number | null;
    currentPage: number | null;
    bestPosition: number | null;
    positionChange: number;
    rankHistory: RankHistoryEntry[];
    competitors: Competitor[];
    siteAnalysis?: CompetitorAnalysis;
    competitorAnalysis?: CompetitorAnalysis;
    active: boolean;
    lastChecked: string | null;
    status: string;
    createdAt: string;
}

export default function RankDetail() {
    const { api } = useApp();
    const { id } = useParams();
    const [tracking, setTracking] = useState<TrackingData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [comparing, setComparing] = useState(false);
    const [compareError, setCompareError] = useState("");
    const [activeTab, setActiveTab] = useState("overview");
    const chartRef = useRef<HTMLCanvasElement>(null);

    const fetchTracking = async () => {
        try {
        const res = await api.get(`/api/rank/${id}`);
        if (res.data.success) {
            if (res.data.tracking.status === "checking"){
                setTimeout(fetchTracking, 3000)
                setTracking(res.data.tracking)
                return;
            }
            setTracking(res.data.tracking)
        }
        } catch{
        // handled by null state
        }
        setLoading(false)
    };

    const handleRefresh = async () => {
        if (!tracking) return;
        setRefreshing(true);
        try {
        await api.post(`/api/rank/${tracking._id}/refresh`);
        setTracking((prev)=>(prev ? { ...prev, status: "checking" } : null))

        const pollInterval = setInterval(async () => {
            try {
            const check = await api.get(`/api/rank/${tracking._id}`);
            if(check.data.tracking.status !== "checking"){
                clearInterval(pollInterval);
                setTracking(check.data.tracking)
                setRefreshing(false)
            }
            } catch (error: any) {
            console.error(error)
            }
        }, 3000)
        } catch {
            setRefreshing(false);
        }
    };

    const handleCompare = async () => {
        if (!tracking) return;
        setComparing(true);
        setCompareError("");
        try {
            const res = await api.post(`/api/rank/${tracking._id}/compare`);
            if (res.data.success) {
                setTracking((prev) => (prev ? { ...prev, siteAnalysis: res.data.siteAnalysis, competitorAnalysis: res.data.competitorAnalysis } : null));
                setActiveTab("compare");
                if (res.data.partial) setCompareError(res.data.message);
            } else {
                setCompareError(res.data.message || "Comparison failed.");
            }
        } catch (err: any) {
            setCompareError(err.response?.data?.message || "Comparison failed. Please try again.");
        } finally {
            setComparing(false);
        }
    };

    const getScoreClass = (s: number) => {
        if (s >= 80) return "text-emerald-500";
        if (s >= 50) return "text-accent";
        return "text-danger";
    };

    const drawChart = () => {
        const canvas = chartRef.current;
        if (!canvas || !tracking) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const history = tracking.rankHistory.filter((h) => h.position !== null).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        if (history.length === 0) return;

        // High DPI support
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const w = rect.width;
        const h = rect.height;
        const padding = { top: 30, right: 30, bottom: 50, left: 50 };
        const chartW = w - padding.left - padding.right;
        const chartH = h - padding.top - padding.bottom;

        // Clear
        ctx.clearRect(0, 0, w, h);

        // Find range (invert: position 1 = top)
        const positions = history.map((h) => h.position!);
        const minPos = Math.max(1, Math.min(...positions) - 2);
        const maxPos = Math.max(...positions) + 2;

        // Dynamic colors from theme
        const styles = getComputedStyle(document.documentElement);
        const borderColor = styles.getPropertyValue("--border").trim() || "rgba(128,128,128,0.2)";
        const primaryColor = styles.getPropertyValue("--accent").trim() || "#3b82f6";
        const textColor = styles.getPropertyValue("--muted-foreground").trim() || "rgba(128,128,128,0.5)";
        const bgColor = styles.getPropertyValue("--background").trim() || "#ffffff";

        // Draw grid
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1;
        const gridLines = 5;
        for (let i = 0; i <= gridLines; i++) {
            const y = padding.top + (chartH / gridLines) * i;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(w - padding.right, y);
            ctx.stroke();

            // Labels (inverted: top = lowest position number)
            const posVal = Math.round(minPos + ((maxPos - minPos) / gridLines) * i);
            ctx.fillStyle = textColor;
            ctx.font = "11px Outfit";
            ctx.textAlign = "right";
            ctx.fillText(`#${posVal}`, padding.left - 8, y + 4);
        }

        // Draw date labels
        ctx.fillStyle = textColor;
        ctx.font = "10px Outfit";
        ctx.textAlign = "center";
        const maxLabels = Math.min(history.length, 7);
        const labelStep = Math.max(1, Math.floor(history.length / maxLabels));
        for (let i = 0; i < history.length; i += labelStep) {
            const x = padding.left + (chartW / Math.max(history.length - 1, 1)) * i;
            const date = new Date(history[i].date);
            ctx.fillText(`${date.getMonth() + 1}/${date.getDate()}`, x, h - padding.bottom + 20);
        }

        // Draw line
        ctx.beginPath();
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 2.5;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";

        history.forEach((entry, i) => {
            const x = padding.left + (chartW / Math.max(history.length - 1, 1)) * i;
            const yNorm = (entry.position! - minPos) / (maxPos - minPos);
            const y = padding.top + yNorm * chartH;

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Draw gradient fill
        const gradient = ctx.createLinearGradient(0, padding.top, 0, h - padding.bottom);
        // Using accent rgb roughly (59, 130, 246)
        gradient.addColorStop(0, "rgba(59, 130, 246, 0.15)");
        gradient.addColorStop(1, "rgba(59, 130, 246, 0)");

        ctx.beginPath();
        history.forEach((entry, i) => {
            const x = padding.left + (chartW / Math.max(history.length - 1, 1)) * i;
            const yNorm = (entry.position! - minPos) / (maxPos - minPos);
            const y = padding.top + yNorm * chartH;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.lineTo(padding.left + chartW, h - padding.bottom);
        ctx.lineTo(padding.left, h - padding.bottom);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw dots
        history.forEach((entry, i) => {
            const x = padding.left + (chartW / Math.max(history.length - 1, 1)) * i;
            const yNorm = (entry.position! - minPos) / (maxPos - minPos);
            const y = padding.top + yNorm * chartH;

            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fillStyle = primaryColor;
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fillStyle = bgColor;
            ctx.fill();
        });

        // Y-axis label
        ctx.save();
        ctx.translate(12, h / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillStyle = textColor;
        ctx.font = "11px Outfit";
        ctx.textAlign = "center";
        ctx.fillText("Position", 0, 0);
        ctx.restore();
    };

    const getChangeIndicator = (change: number) => {
        if (change > 0) return { icon: <TrendingUp size={16} />, text: `+${change}`, class: "text-emerald-500" };
        if (change < 0) return { icon: <TrendingDown size={16} />, text: `${change}`, class: "text-danger" };
        return { icon: <Minus size={16} />, text: "—", class: "text-muted-foreground" };
    };

    const getPositionColor = (pos: number | null) => {
        if (pos === null) return "text-muted-foreground";
        if (pos <= 3) return "text-emerald-500";
        if (pos <= 10) return "text-primary";
        if (pos <= 20) return "text-accent";
        return "text-danger";
    };

    useEffect(() => {
        (async () => await fetchTracking())();
         // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    useEffect(() => {
            if (tracking && tracking.rankHistory.length > 0 && chartRef.current) {
                drawChart();
            }
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [tracking, activeTab]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!tracking) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center glass-strong rounded-2xl p-10">
                    <AlertCircle size={48} className="mx-auto text-danger mb-4" />
                    <h2 className="text-xl font-bold text-foreground mb-2">Tracking Not Found</h2>
                    <Link to="/rank-tracker" className="bg-primary px-5 py-2.5 rounded-xl text-sm font-semibold text-primary-foreground mt-4 inline-block" style={{ color: "var(--background)" }}>
                        Back to Rank Tracker
                    </Link>
                </div>
            </div>
        );
    }

    const change = getChangeIndicator(tracking.positionChange);
    const tabs = [
        { id: "overview", label: "Overview" },
        { id: "competitors", label: `Competitors (${tracking.competitors.length})` },
        { id: "compare", label: "Compare" },
        { id: "history", label: "History" },
    ];

    return (
        <div className="min-h-screen pt-16 md:pt-24 bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                {/* Back + Header */}
                <div className="mb-8">
                    <Link to="/rank-tracker" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
                        <ArrowLeft size={16} />
                        Back to Rank Tracker
                    </Link>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-medium text-foreground">
                                "<span className="gradient-text">{tracking.keyword}</span>"
                            </h1>
                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                <Globe size={14} />
                                <span>{tracking.domain}</span>
                                <a href={tracking.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                                    Visit <ExternalLink size={12} />
                                </a>
                            </div>
                        </div>
                        <button onClick={handleRefresh} disabled={refreshing || tracking.status === "checking"} className="glass px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-muted/50 transition-all disabled:opacity-50 self-start text-foreground">
                            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                            Refresh Now
                        </button>
                    </div>
                </div>

                {/* Score Hero */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6" style={{ animationDelay: "100ms" }}>
                    <div className="glass-strong rounded-2xl p-6 text-center">
                        <p className="text-xs text-muted-foreground mb-2 flex items-center justify-center gap-1">
                            <Target size={14} />
                            Current Position
                        </p>
                        {tracking.status === "checking" ? <Loader2 size={32} className="animate-spin mx-auto text-primary" /> : <p className={`text-4xl font-bold ${getPositionColor(tracking.currentPosition)}`}>{tracking.currentPosition ? `#${tracking.currentPosition}` : "Not Ranked"}</p>}
                        {tracking.currentPage && <p className="text-xs text-muted-foreground mt-1">Page {tracking.currentPage}</p>}
                    </div>

                    <div className="glass rounded-2xl p-6 text-center">
                        <p className="text-xs text-muted-foreground mb-2 flex items-center justify-center gap-1">
                            <TrendingUp size={14} />
                            Position Change
                        </p>
                        <div className={`text-3xl font-bold flex items-center justify-center gap-2 ${change.class}`}>
                            {change.icon}
                            {change.text}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">since last check</p>
                    </div>

                    <div className="glass rounded-2xl p-6 text-center">
                        <p className="text-xs text-muted-foreground mb-2 flex items-center justify-center gap-1">
                            <Trophy size={14} />
                            Best Position
                        </p>
                        <p className={`text-3xl font-bold ${getPositionColor(tracking.bestPosition)}`}>{tracking.bestPosition ? `#${tracking.bestPosition}` : "—"}</p>
                        <p className="text-xs text-muted-foreground mt-1">all time</p>
                    </div>

                    <div className="glass rounded-2xl p-6 text-center">
                        <p className="text-xs text-muted-foreground mb-2 flex items-center justify-center gap-1">
                            <Calendar size={14} />
                            Data Points
                        </p>
                        <p className="text-3xl font-bold text-accent">{tracking.rankHistory.length}</p>
                        <p className="text-xs text-muted-foreground mt-1">{tracking.lastChecked ? `Last: ${new Date(tracking.lastChecked).toLocaleDateString()}` : "Never checked"}</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-6 overflow-x-auto pb-1" style={{ animationDelay: "200ms" }}>
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? "bg-primary text-primary-foreground" : "glass text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
                            style={activeTab === tab.id ? { color: "var(--background)" } : {}}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div key={activeTab}>
                    {activeTab === "overview" && (
                        <div className="space-y-6">
                            {/* Ranking Chart */}
                            <div className="glass rounded-2xl p-6">
                                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                                    <TrendingUp size={20} className="text-primary" />
                                    Ranking History
                                </h3>
                                {tracking.rankHistory.filter((h) => h.position !== null).length > 0 ? (
                                    <div className="relative" style={{ height: "300px" }}>
                                        <canvas ref={chartRef} style={{ width: "100%", height: "100%" }} className="rounded-xl" />
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <Calendar size={32} className="mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">No ranking data yet. Check back after the daily tracking runs.</p>
                                    </div>
                                )}
                                <p className="text-xs text-muted-foreground mt-3 text-center">↑ Lower position number = higher rank. Updated daily at 6:00 AM UTC.</p>
                            </div>

                            {/* Top 3 Competitors Preview */}
                            {tracking.competitors.length > 0 && (
                                <div className="glass rounded-2xl p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                            <Users size={20} className="text-accent" />
                                            Top Competitors
                                        </h3>
                                        <button onClick={() => setActiveTab("competitors")} className="text-sm text-primary hover:underline">
                                            View All →
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {tracking.competitors.slice(0, 3).map((comp, i) => (
                                            <div key={i} className="glass rounded-xl p-4 flex items-start gap-4">
                                                <div
                                                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                                                        i === 0 ? "bg-amber-500/15 text-amber-400 border border-amber-500/30" : i === 1 ? "bg-gray-400/15 text-gray-300 border border-gray-400/30" : "bg-orange-500/15 text-orange-400 border border-orange-500/30"
                                                    }`}
                                                >
                                                    #{comp.position}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-foreground truncate">{comp.title || comp.domain}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{comp.domain}</p>
                                                </div>
                                                <a href={comp.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary shrink-0 transition-colors">
                                                    <ExternalLink size={14} />
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "competitors" && (
                        <div className="glass rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                    <Users size={20} className="text-accent" />
                                    Competitors for "{tracking.keyword}"
                                </h3>
                                {tracking.competitors.length > 0 && (
                                    <button onClick={handleCompare} disabled={comparing} className="bg-primary px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 text-primary-foreground" style={{ color: "var(--background)" }}>
                                        {comparing ? <Loader2 size={14} className="animate-spin" /> : <Target size={14} />}
                                        {comparing ? "Analyzing #1..." : "Compare with #1"}
                                    </button>
                                )}
                            </div>
                            {compareError && (
                                <div className="mb-4 px-4 py-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm flex items-center gap-2">
                                    <AlertCircle size={16} className="shrink-0" />
                                    {compareError}
                                </div>
                            )}
                            {tracking.competitors.length > 0 ? (
                                <div className="space-y-3">
                                    {tracking.competitors.map((comp, i) => (
                                        <div key={i} className="glass rounded-xl p-4 hover:bg-muted/50 transition-all">
                                            <div className="flex items-start gap-4">
                                                <div
                                                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                                                        comp.position <= 3 ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : comp.position <= 10 ? "bg-primary/15 text-primary border border-primary/30" : "bg-accent/15 text-accent border border-accent/30"
                                                    }`}
                                                >
                                                    #{comp.position}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-foreground">{comp.title || "Untitled"}</p>
                                                    <p className="text-xs text-primary mt-0.5">{comp.domain}</p>
                                                    {comp.snippet && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{comp.snippet}</p>}
                                                </div>
                                                <a href={comp.url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-all shrink-0">
                                                    <ExternalLink size={16} />
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Users size={32} className="mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No competitor data available yet.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "compare" && (
                        <div>
                            {!tracking.siteAnalysis || tracking.siteAnalysis.status !== "completed" || !tracking.competitorAnalysis || tracking.competitorAnalysis.status !== "completed" ? (
                                <div className="glass rounded-2xl p-12 text-center">
                                    <Target size={32} className="mx-auto mb-3 opacity-50 text-muted-foreground" />
                                    <h3 className="text-lg font-semibold text-foreground mb-2">No Comparison Yet</h3>
                                    <p className="text-sm text-muted-foreground mb-5">Run a full side-by-side SEO comparison against the #1 ranked competitor.</p>
                                    <button onClick={handleCompare} disabled={comparing || tracking.competitors.length === 0} className="bg-primary px-5 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 text-primary-foreground" style={{ color: "var(--background)" }}>
                                        {comparing ? <Loader2 size={16} className="animate-spin" /> : <Target size={16} />}
                                        {comparing ? "Analyzing both sites... 30-60s" : "Compare with #1"}
                                    </button>
                                    {tracking.competitors.length === 0 && <p className="text-xs text-muted-foreground mt-3">No competitor data available. Refresh the rank check first.</p>}
                                    {compareError && <p className="text-xs text-danger mt-3">{compareError}</p>}
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="glass-strong rounded-2xl p-5 flex items-center justify-between flex-wrap gap-3">
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Full comparison</p>
                                            <p className="text-sm font-medium text-foreground">{tracking.domain} vs {tracking.competitorAnalysis.domain}</p>
                                        </div>
                                        <button onClick={handleCompare} disabled={comparing} className="glass px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-muted/50 transition-all disabled:opacity-50 text-foreground">
                                            <RefreshCw size={14} className={comparing ? "animate-spin" : ""} />
                                            Re-analyze
                                        </button>
                                    </div>

                                    {/* Overall score comparison */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="glass rounded-2xl p-6 border-2 border-primary/30">
                                            <p className="text-xs text-muted-foreground mb-2">Your Site — {tracking.domain}</p>
                                            <p className={`text-4xl font-bold ${getScoreClass(tracking.siteAnalysis.overallScore)}`}>{tracking.siteAnalysis.overallScore}/100</p>
                                            <p className="text-xs text-muted-foreground mt-1">Google position: {tracking.currentPosition ? `#${tracking.currentPosition}` : "Not Ranked"}</p>
                                        </div>
                                        <div className="glass rounded-2xl p-6">
                                            <p className="text-xs text-muted-foreground mb-2">Competitor — {tracking.competitorAnalysis.domain}</p>
                                            <p className={`text-4xl font-bold ${getScoreClass(tracking.competitorAnalysis.overallScore)}`}>{tracking.competitorAnalysis.overallScore}/100</p>
                                            <p className="text-xs text-muted-foreground mt-1">Google position: #1</p>
                                        </div>
                                    </div>

                                    {/* Category scores side by side */}
                                    <div className="glass rounded-2xl p-6">
                                        <h3 className="text-lg font-semibold text-foreground mb-4">Category Scores</h3>
                                        <div className="space-y-3">
                                            {(["seo", "performance", "accessibility", "bestPractices"] as const).map((cat) => {
                                                const labels: Record<string, string> = { seo: "SEO", performance: "Performance", accessibility: "Accessibility", bestPractices: "Best Practices" };
                                                const you = tracking.siteAnalysis!.categories[cat];
                                                const them = tracking.competitorAnalysis!.categories[cat];
                                                return (
                                                    <div key={cat} className="p-3 bg-muted/30 border border-border rounded-xl">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-sm text-muted-foreground">{labels[cat]}</span>
                                                            <span className="text-xs text-muted-foreground">
                                                                You: <span className={`font-semibold ${getScoreClass(you)}`}>{you}</span> vs Them: <span className={`font-semibold ${getScoreClass(them)}`}>{them}</span>
                                                            </span>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                                                                <div className="h-full rounded-full bg-primary" style={{ width: `${you}%` }} />
                                                            </div>
                                                            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                                                                <div className="h-full rounded-full bg-accent" style={{ width: `${them}%` }} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Full stat comparison table */}
                                    <div className="glass rounded-2xl p-6">
                                        <h3 className="text-lg font-semibold text-foreground mb-4">Head-to-Head Stats</h3>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="text-left text-xs text-muted-foreground border-b border-border">
                                                        <th className="pb-2 font-medium">Metric</th>
                                                        <th className="pb-2 font-medium text-right">You</th>
                                                        <th className="pb-2 font-medium text-right">Them</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border/50">
                                                    {[
                                                        { label: "H1 Tag", you: tracking.siteAnalysis.headings.h1 === 1 ? "✓ Present" : tracking.siteAnalysis.headings.h1 === 0 ? "✗ Missing" : `${tracking.siteAnalysis.headings.h1} (multiple)`, them: tracking.competitorAnalysis.headings.h1 === 1 ? "✓ Present" : tracking.competitorAnalysis.headings.h1 === 0 ? "✗ Missing" : `${tracking.competitorAnalysis.headings.h1} (multiple)` },
                                                        { label: "Title Length", you: `${tracking.siteAnalysis.metaData.title.length} chars`, them: `${tracking.competitorAnalysis.metaData.title.length} chars` },
                                                        { label: "Meta Description", you: tracking.siteAnalysis.metaData.description ? `${tracking.siteAnalysis.metaData.description.length} chars` : "✗ Missing", them: tracking.competitorAnalysis.metaData.description ? `${tracking.competitorAnalysis.metaData.description.length} chars` : "✗ Missing" },
                                                        { label: "Load Time", you: `${(tracking.siteAnalysis.loadTime / 1000).toFixed(2)}s`, them: `${(tracking.competitorAnalysis.loadTime / 1000).toFixed(2)}s` },
                                                        { label: "Word Count", you: `${tracking.siteAnalysis.wordCount.toLocaleString()}`, them: `${tracking.competitorAnalysis.wordCount.toLocaleString()}` },
                                                        { label: "Internal Links", you: `${tracking.siteAnalysis.links.internal}`, them: `${tracking.competitorAnalysis.links.internal}` },
                                                        { label: "External Links", you: `${tracking.siteAnalysis.links.external}`, them: `${tracking.competitorAnalysis.links.external}` },
                                                        { label: "Images w/ Alt Text", you: `${tracking.siteAnalysis.images.withAlt}/${tracking.siteAnalysis.images.total}`, them: `${tracking.competitorAnalysis.images.withAlt}/${tracking.competitorAnalysis.images.total}` },
                                                        { label: "Page Size", you: `${Math.round(tracking.siteAnalysis.pageSize / 1024)}KB`, them: `${Math.round(tracking.competitorAnalysis.pageSize / 1024)}KB` },
                                                    ].map((row) => (
                                                        <tr key={row.label}>
                                                            <td className="py-2.5 text-muted-foreground">{row.label}</td>
                                                            <td className="py-2.5 text-right font-medium text-foreground">{row.you}</td>
                                                            <td className="py-2.5 text-right font-medium text-foreground">{row.them}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Issues side by side */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        <div className="glass rounded-2xl p-6">
                                            <h3 className="text-base font-semibold text-foreground mb-3">Your Top Issues</h3>
                                            <div className="space-y-2">
                                                {tracking.siteAnalysis.issues.slice(0, 5).map((issue, i) => (
                                                    <div key={i} className="p-3 bg-muted/30 border border-border rounded-xl">
                                                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold mr-2 ${issue.severity === "critical" ? "severity-critical" : issue.severity === "warning" ? "severity-warning" : "severity-info"}`}>{issue.severity}</span>
                                                        <span className="text-sm text-foreground">{issue.message}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="glass rounded-2xl p-6">
                                            <h3 className="text-base font-semibold text-foreground mb-3">Their Top Issues</h3>
                                            <div className="space-y-2">
                                                {tracking.competitorAnalysis.issues.slice(0, 5).map((issue, i) => (
                                                    <div key={i} className="p-3 bg-muted/30 border border-border rounded-xl">
                                                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold mr-2 ${issue.severity === "critical" ? "severity-critical" : issue.severity === "warning" ? "severity-warning" : "severity-info"}`}>{issue.severity}</span>
                                                        <span className="text-sm text-foreground">{issue.message}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "history" && (
                        <div className="glass rounded-2xl p-6">
                            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                                <Clock size={20} className="text-accent" />
                                Ranking History
                            </h3>
                            {tracking.rankHistory.length > 0 ? (
                                <div className="space-y-2">
                                    {[...tracking.rankHistory]
                                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                        .map((entry, i) => (
                                            <div key={i} className="glass rounded-xl p-4 flex items-center gap-4 hover:bg-muted/50 transition-all">
                                                <div
                                                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                                                        entry.position === null
                                                            ? "bg-muted text-muted-foreground border border-border"
                                                            : entry.position <= 3
                                                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                                              : entry.position <= 10
                                                                ? "bg-primary/15 text-primary border border-primary/30"
                                                                : entry.position <= 20
                                                                  ? "bg-accent/15 text-accent border border-accent/30"
                                                                  : "bg-danger/15 text-danger border border-danger/30"
                                                    }`}
                                                >
                                                    {entry.position ? `#${entry.position}` : "—"}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-foreground">
                                                        {new Date(entry.date).toLocaleDateString("en-US", {
                                                            weekday: "short",
                                                            year: "numeric",
                                                            month: "short",
                                                            day: "numeric",
                                                        })}
                                                    </p>
                                                    <div className="flex items-center gap-3 mt-0.5">
                                                        {entry.page && <span className="text-xs text-muted-foreground">Page {entry.page}</span>}
                                                        {entry.title && <span className="text-xs text-muted-foreground truncate">{entry.title}</span>}
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className={`text-lg font-bold ${getPositionColor(entry.position)}`}>{entry.position || "N/R"}</p>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Calendar size={32} className="mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No history data yet. Data will appear after the first rank check.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
