'use client';

import { motion } from 'framer-motion';
import { Car, MapPin, Shield, Zap, ArrowRight, Star } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="home-container">
      <nav className="navbar glass">
        <div className="nav-content">
          <div className="logo">
            <Car size={28} className="text-primary" />
            <span>DriveFlow</span>
          </div>
          <div className="nav-links">
            <Link href="/auth/login" className="nav-link">Login</Link>
            <Link href="/auth/register" className="premium-button small">Get Started</Link>
          </div>
        </div>
      </nav>

      <main className="hero">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="hero-content"
        >
          <span className="badge">AI-Powered Ride Booking</span>
          <h1>Move Smarter, <span className="text-primary">Drive Better.</span></h1>
          <p>
            Experience the next generation of ride-sharing. Set your own fare,
            get AI suggested prices, and travel with vetted professional drivers.
          </p>
          <div className="hero-ctas">
            <Link href="/auth/register" className="premium-button large">
              Book a Ride <ArrowRight size={20} />
            </Link>
            <Link href="/about" className="secondary-button large">
              How it works
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 1 }}
          className="hero-visual"
        >
          <div className="floating-card glass" suppressHydrationWarning>
            <div className="card-icon grad-primary" suppressHydrationWarning>
              <Zap size={24} color="#000" />
            </div>
            <div className="card-info" suppressHydrationWarning>
              <h4>Fast Matching</h4>
              <p>Under 2 mins</p>
            </div>
          </div>
          <div className="floating-card glass second" suppressHydrationWarning>
            <div className="card-icon grad-primary" suppressHydrationWarning>
              <Star size={24} color="#000" />
            </div>
            <div className="card-info" suppressHydrationWarning>
              <h4>Top Rated</h4>
              <p>4.9/5 Average</p>
            </div>
          </div>

          <div className="hero-mockup grad-dark" suppressHydrationWarning>
            <Car size={120} color="var(--primary)" opacity={0.2} />
          </div>
        </motion.div>
      </main>

      <section className="features">
        <div className="feature-grid" suppressHydrationWarning>
          <div className="feature-card glass" suppressHydrationWarning>
            <div className="feature-icon"><MapPin size={24} color="var(--primary)" /></div>
            <h3>Live Tracking</h3>
            <p>Real-time location sharing with friends and family.</p>
          </div>
          <div className="feature-card glass" suppressHydrationWarning>
            <div className="feature-icon"><Shield size={24} color="var(--primary)" /></div>
            <h3>Secure Rides</h3>
            <p>Fully vetted drivers and 24/7 support assistance.</p>
          </div>
          <div className="feature-card glass" suppressHydrationWarning>
            <div className="feature-icon"><Zap size={24} color="var(--primary)" /></div>
            <h3>AI Fare</h3>
            <p>Smart fare suggestions based on traffic and demand.</p>
          </div>
        </div>
      </section>


      <style jsx>{`
        .home-container {
          min-height: 100vh;
          background: radial-gradient(circle at 0% 0%, #1a1a1a 0%, #050505 100%);
        }
        .navbar {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          width: 90%;
          max-width: 1200px;
          padding: 12px 24px;
          z-index: 100;
          display: flex;
          justify-content: center;
        }
        .nav-content {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 1.4rem;
          font-weight: 700;
        }
        .nav-links {
          display: flex;
          align-items: center;
          gap: 32px;
        }
        .nav-link {
          font-weight: 500;
          color: var(--muted);
        }
        .nav-link:hover {
          color: white;
        }
        .hero {
          padding: 180px 5% 100px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          max-width: 1200px;
          margin: 0 auto;
          align-items: center;
        }
        .hero-content h1 {
          font-size: 4rem;
          line-height: 1.1;
          margin-bottom: 24px;
        }
        .hero-content p {
          font-size: 1.2rem;
          color: var(--muted);
          margin-bottom: 40px;
          max-width: 500px;
          line-height: 1.6;
        }
        .badge {
          background: rgba(193, 255, 0, 0.1);
          color: var(--primary);
          padding: 6px 16px;
          border-radius: 100px;
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: 20px;
          display: inline-block;
        }
        .text-primary {
          color: var(--primary);
        }
        .hero-ctas {
          display: flex;
          gap: 20px;
        }
        .hero-visual {
          position: relative;
        }
        .hero-mockup {
          width: 100%;
          aspect-ratio: 16/10;
          border-radius: 40px;
          border: 1px solid var(--glass-border);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 40px 100px rgba(0,0,0,0.5);
        }
        .floating-card {
          position: absolute;
          padding: 16px 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          z-index: 10;
          box-shadow: var(--shadow-premium);
        }
        .floating-card h4 { margin: 0; font-size: 1rem; }
        .floating-card p { margin: 0; font-size: 0.8rem; color: var(--muted); }
        .card-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .first { top: -20px; left: -30px; }
        .second { bottom: 40px; right: -20px; }
        
        .features {
          padding: 100px 5%;
          max-width: 1200px;
          margin: 0 auto;
        }
        .feature-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 30px;
        }
        .feature-card {
          padding: 40px;
          transition: all 0.3s ease;
        }
        .feature-card:hover {
          transform: translateY(-10px);
          border-color: var(--primary);
        }
        .feature-icon {
          margin-bottom: 24px;
        }
        .feature-card h3 { margin-bottom: 12px; }
        .feature-card p { color: var(--muted); line-height: 1.5; }

        .secondary-button {
          background: transparent;
          border: 1px solid var(--glass-border);
          color: white;
          padding: 14px 28px;
          border-radius: 14px;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .secondary-button:hover {
          background: rgba(255,255,255,0.05);
        }

        @media (max-width: 900px) {
          .hero { grid-template-columns: 1fr; text-align: center; }
          .hero-content p { margin: 0 auto 40px; }
          .hero-ctas { justify-content: center; }
          .feature-grid { grid-template-columns: 1fr; }
          .hero-content h1 { font-size: 3rem; }
        }
      `}</style>
    </div>
  );
}

