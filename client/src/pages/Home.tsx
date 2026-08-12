import Hero from "../components/home/Hero";
import Features from "../components/home/Features";
import HowItWorks from "../components/home/HowItWorks";
import Footer from "../components/home/Footer";
import Comparison from "../components/home/Comparison";


export default function Home() {
    return (
        <div className="min-h-screen">
            <Hero />
            <Features />
            <HowItWorks />
            <Comparison/>
            <Footer />
        </div>
    );
}
