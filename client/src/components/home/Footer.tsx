/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { homefooterLinks } from "../../assets/assets";
import { SiGithub } from "react-icons/si";
import { Mail } from "lucide-react";

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
                        <div className="flex flex-col gap-3">
                            <h4 className="text-white text-sm font-medium mb-1">Connect</h4>
                            <a 
                                href="https://github.com/Nayan091/AuditMaster" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="flex items-center gap-2 text-white/70 hover:text-white hover:underline underline-offset-4 transition-colors w-fit"
                            >
                                <SiGithub size={18} />
                                <span className="text-sm">See on GitHub</span>
                            </a>
                            <a 
                                href="https://mail.google.com/mail/?view=cm&fs=1&to=nayanprajapati138@gmail.com" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="flex items-center gap-2 text-white/70 hover:text-white hover:underline underline-offset-4 transition-colors w-fit"
                            >
                                <Mail size={18} />
                                <span className="text-sm">nayanprajapati138@gmail.com</span>
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