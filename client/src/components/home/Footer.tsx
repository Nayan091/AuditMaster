/* eslint-disable @typescript-eslint/no-explicit-any */
import { homefooterLinks } from "../../assets/assets";
import { SiX, SiInstagram, SiFacebook, SiTwitch } from "@icons-pack/react-simple-icons";

export default function Footer() {
    return (
        <footer className="border-t border-border py-12 bg-[var(--footer-bg)] text-white">
            <div className="max-w-7xl mx-auto px-4">
                <div className="grid grid-cols-2 md:grid-cols-6 gap-12 mb-12">
                    <div className="col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <img src="/AuditMaster_logo_transparent.png" alt="AuditMaster logo" className="h-8 w-8 object-contain" />
                            <span className="text-xl text-white">AuditMaster</span>
                        </div>
                        <p className="text-sm text-white/70 mb-6 w-5/6">Audit your website, track your Google rankings, and see exactly how you stack up against the competition — powered by AuditMaster AI.</p>
                        <div className="flex items-center gap-4">
                            <a href="#" className="text-white/70 hover:text-white transition-colors">
                                <SiX size={20} />
                            </a>
                            <a href="#" className="text-white/70 hover:text-white transition-colors">
                                <SiInstagram size={20} />
                            </a>
                            <a href="#" className="text-white/70 hover:text-white transition-colors">
                                <SiFacebook size={20} />
                            </a>
                            <a href="#" className="text-white/70 hover:text-white transition-colors">
                                <SiTwitch size={20} />
                            </a>
                        </div>
                    </div>

                    {homefooterLinks.map((section: any) => (
                        <div key={section.title}>
                            <h3 className="mb-4 text-white">{section.title}</h3>
                            <ul className="space-y-1">
                                {section.links.map((link: any) => (
                                    <li key={link}>
                                        <a href="#" className="text-sm text-white/70 hover:text-white transition-colors">
                                            {link}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="pt-8 border-t border-white/15 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-white/70">© {new Date().getFullYear()} AuditMaster AI. All rights reserved.</p>
                    <div className="flex items-center gap-6">
                        <span className="text-xs text-white/70">Status: All Systems Operational</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}