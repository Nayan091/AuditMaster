import { SearchIcon, ArrowRightIcon, ZapIcon } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Hero() {
    const [url, setUrl] = useState("");
    const navigate = useNavigate();

    const handleQuickAnalyze = (e: React.SubmitEvent) => {
        e.preventDefault();
        navigate(`/analyze?url=${encodeURIComponent(url)}`);
    };

    return (
        <section className="relative min-h-screen flex flex-col overflow-x-hidden">
            {/* Gradient background - full viewport width */}
            <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-screen h-full -z-10"
                style={{ background: "var(--hero-gradient)", backgroundAttachment: "fixed" }}
            />

            <div className="flex flex-col items-center mt-40 flex-1 w-full max-w-4xl mx-auto px-4 text-center">
                {/* AI Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-card/60 backdrop-blur-md border border-primary/20 rounded-full text-xs font-medium mb-6 text-primary-dark">
                    <ZapIcon size={13} />
                    AI-Powered Website Intelligence
                </div>

                {/* Headline */}
                <h1 className="dm-serif text-5xl md:text-7xl leading-tight mb-8 tracking-tight max-w-2xl" style={{ color: "var(--primary-dark)" }}>
                    Audit, Fix, and Elevate Your Website.
                </h1>

                {/* Search/Input Area */}
                <form onSubmit={handleQuickAnalyze} className="w-full max-w-xl relative mb-11">
                    <div className="bg-card/90 backdrop-blur-md rounded-full p-1.5 flex items-center shadow-lg border border-primary/20 focus-within:ring-2 transition-all" style={{ boxShadow: "0 10px 30px rgba(44,75,58,0.08)" }}>
                        <div className="pl-3.5 text-muted-foreground">
                            <SearchIcon size={18} />
                        </div>
                        <input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://example.com"
                            required
                            className="flex-grow bg-transparent border-none text-sm text-white/85 placeholder-muted-foreground px-3 py-2.5 outline-none"
                            id="hero-url-input"
                        />
                        <button
                            type="submit"
                            className="bg-primary text-white px-5 py-2.5 rounded-full text-sm font-medium transition-all hover:brightness-80 flex items-center gap-2 whitespace-nowrap shrink-0"
                            id="hero-analyze-btn"
                        >
                            Run Full Audit
                            <ArrowRightIcon size={14} />
                        </button>
                    </div>
                </form>

                {/* Subheadline */}
                <p className="text-sm md:text-base text-muted-foreground mb-8 max-w-xl leading-relaxed">
                    Instantly uncover hidden SEO issues, performance bottlenecks, and accessibility errors—then let AI tell you exactly how to fix them.
                </p>


                {/* Guarantee Text */}
                {/* <div className="flex items-center gap-2 text-xs font-medium text-foreground" >
                    <span className="flex items-center gap-1">
                        <CheckIcon size={14} className="text-primary" />
                        Free
                    </span>
                    <span>•</span>
                    <span>No credit card required</span>
                </div> */}



            </div>

        </section>
    );
}