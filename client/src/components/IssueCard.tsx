import { useState } from "react";
import { ChevronDown, ChevronUp, AlertTriangle, AlertCircle, Info, Copy, Check } from "lucide-react";

interface Issue {
    severity: string;
    category: string;
    message: string;
    recommendation: string;
    priority?: string;
    effort?: string;
    suggestedFix?: string;
}

export default function IssueCard({ issue }: { issue: Issue }) {
    const [expanded, setExpanded] = useState(false);
    const [copied, setCopied] = useState(false);

    const severityConfig: Record<string, { icon: React.ReactNode; class: string; label: string }> = {
        critical: {
            icon: <AlertCircle size={16} />,
            class: "severity-critical",
            label: "Critical",
        },
        warning: {
            icon: <AlertTriangle size={16} />,
            class: "severity-warning",
            label: "Warning",
        },
        info: {
            icon: <Info size={16} />,
            class: "severity-info",
            label: "Info",
        },
    };

    const priorityConfig: Record<string, string> = {
        "Fix First": "severity-critical",
        "Fix Soon": "severity-warning",
        "Nice to Have": "severity-info",
    };

    const config = severityConfig[issue.severity] || severityConfig.info;

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!issue.suggestedFix) return;
        navigator.clipboard.writeText(issue.suggestedFix);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <div className="glass rounded-xl overflow-hidden transition-all hover:border-primary/20 cursor-pointer" onClick={() => setExpanded(!expanded)}>
            <div className="flex items-start gap-3 p-4">
                <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${config.class}`}>
                    {config.icon}
                    {config.label}
                </span>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{issue.message}</p>
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                        <p className="text-xs text-muted-foreground">{issue.category}</p>
                        {issue.priority && <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${priorityConfig[issue.priority] || "severity-info"}`}>{issue.priority}</span>}
                        {issue.effort && <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted/50 text-muted-foreground border border-border">{issue.effort}</span>}
                    </div>
                </div>
                <div className="text-muted-foreground shrink-0 mt-0.5">{expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</div>
            </div>
            {expanded && (
                <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
                    <div className="flex items-start gap-2">
                        <span className="text-primary text-sm mt-0.5">💡</span>
                        <p className="text-sm text-muted-foreground leading-relaxed">{issue.recommendation}</p>
                    </div>

                    {issue.suggestedFix && (
                        <div className="bg-muted/30 border border-border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs font-semibold text-foreground">Suggested Fix</span>
                                <button onClick={handleCopy} className="flex items-center gap-1 text-xs text-primary hover:underline">
                                    {copied ? (
                                        <>
                                            <Check size={12} /> Copied
                                        </>
                                    ) : (
                                        <>
                                            <Copy size={12} /> Copy
                                        </>
                                    )}
                                </button>
                            </div>
                            <p className="text-xs text-muted-foreground font-mono break-words">{issue.suggestedFix}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}