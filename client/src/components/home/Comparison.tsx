import { CheckIcon, XIcon } from "lucide-react";
import { homeComparisonData } from "../../assets/assets";

export default function Comparison() {
    return (
        <section className="relative max-w-5xl mx-auto px-4 py-24">
            <div className="text-center mb-14">
                <h2 className="text-3xl sm:text-4xl font-semibold mb-6 text-foreground">
                    Skip the <span className="gradient-text">Manual Work</span>
                </h2>
                <p className="text-muted-foreground max-w-xl mx-auto">What used to take hours of manual checking now takes seconds — with more accuracy and less guesswork.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Manual Process */}
                <div className="bg-card border border-border rounded-2xl p-8">
                    <h3 className="text-lg font-semibold mb-6 text-muted-foreground">Manual Process</h3>
                    <div className="space-y-4">
                        {homeComparisonData.map((item) => (
                            <div key={item.label} className="flex items-start gap-3">
                                <XIcon size={18} className="text-danger shrink-0 mt-0.5" />
                                <p className="text-sm text-muted-foreground">{item.manual}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* AuditPro AI */}
                <div className="bg-card border-2 border-primary/30 rounded-2xl p-8 relative">
                    <div className="absolute -top-3 left-8 px-3 py-1 rounded-full bg-primary text-xs font-medium" style={{ color: "var(--background)" }}>
                        AuditPro AI
                    </div>
                    <h3 className="text-lg font-semibold mb-6 text-foreground">With AuditPro AI</h3>
                    <div className="space-y-4">
                        {homeComparisonData.map((item) => (
                            <div key={item.label} className="flex items-start gap-3">
                                <CheckIcon size={18} className="text-primary shrink-0 mt-0.5" />
                                <p className="text-sm text-foreground">{item.automated}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}