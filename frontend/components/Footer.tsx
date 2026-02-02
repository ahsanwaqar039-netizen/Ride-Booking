'use client';

import { Phone, Mail, MapPin, Facebook, Instagram, Linkedin, Twitter } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="footer-section">
            <div className="footer-content" suppressHydrationWarning>
                <div className="footer-brand" suppressHydrationWarning>
                    <h2 className="text-primary">Terasols</h2>
                    <p>Moving you forward with technology and trust.</p>
                </div>

                <div className="footer-contact" suppressHydrationWarning>
                    <h3>Contact Us</h3>
                    <div className="contact-item">
                        <Phone size={18} color="var(--primary)" />
                        <span>0321_7363000</span>
                    </div>
                    <div className="contact-item">
                        <Mail size={18} color="var(--primary)" />
                        <span>mashanwaqar776@gmail.com</span>
                    </div>
                    <div className="contact-item">
                        <MapPin size={18} color="var(--primary)" />
                        <span>Lahore Johar Town</span>
                    </div>
                </div>

                <div className="footer-social" suppressHydrationWarning>
                    <h3>Follow Us</h3>
                    <div className="social-icons">
                        <Link href="#" className="social-icon"><Facebook size={20} /></Link>
                        <Link href="#" className="social-icon"><Instagram size={20} /></Link>
                        <Link href="#" className="social-icon"><Linkedin size={20} /></Link>
                        <Link href="#" className="social-icon"><Twitter size={20} /></Link>
                    </div>
                </div>
            </div>

            <div className="footer-bottom">
                <p suppressHydrationWarning>&copy; {new Date().getFullYear()} Terasols. All rights reserved.</p>
            </div>

            <style jsx>{`
                .footer-section {
                    background: #000000;
                    border-top: 1px solid var(--glass-border);
                    padding: 80px 5% 40px;
                    color: white;
                }
                .footer-content {
                    max-width: 1200px;
                    margin: 0 auto;
                    display: grid;
                    grid-template-columns: 2fr 1fr 1fr;
                    gap: 60px;
                    padding-bottom: 60px;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                }
                .text-primary { color: var(--primary); margin-bottom: 16px; }
                .footer-brand p { color: var(--muted); line-height: 1.6; max-width: 300px; }
                
                .footer-contact h3, .footer-social h3 {
                    font-size: 1.2rem;
                    margin-bottom: 24px;
                    font-weight: 600;
                }
                .contact-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 16px;
                    color: var(--muted);
                    font-size: 0.95rem;
                }
                
                .social-icons { display: flex; gap: 16px; }
                .social-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.05);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s ease;
                    color: var(--muted);
                }
                .social-icon:hover {
                    background: var(--primary);
                    color: black;
                    transform: translateY(-3px);
                }

                .footer-bottom {
                    text-align: center;
                    padding-top: 40px;
                    color: var(--muted);
                    font-size: 0.9rem;
                }

                @media (max-width: 900px) {
                    .footer-content {
                        grid-template-columns: 1fr;
                        gap: 40px;
                        text-align: center;
                    }
                    .contact-item { justify-content: center; }
                    .social-icons { justify-content: center; }
                    .footer-brand p { margin: 0 auto; }
                }
            `}</style>
        </footer>
    );
}
