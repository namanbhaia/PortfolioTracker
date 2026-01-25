"use client";

import Link from 'next/link';
import { LogIn, UserPlus } from 'lucide-react';

export default function LandingPage() {
  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        
        @keyframes reveal {
          from { opacity: 0; transform: translateY(20px); filter: blur(5px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }

        @keyframes track-expand {
          from { letter-spacing: -0.05em; opacity: 0; }
          to { letter-spacing: -0.02em; opacity: 1; }
        }

        .animate-reveal {
          animation: reveal 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        .animate-title {
          animation: track-expand 1.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
      `}</style>

      <div className="selection:bg-indigo-100 min-h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
        
        {/* Artistic Background Elements */}
        <div
          className="grain-texture"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: 0.04,
            pointerEvents: 'none',
            zIndex: 2,
            backgroundImage: 'url("https://www.transparenttextures.com/patterns/p6-static.png")',
          }}
        />
        <div
          className="shadow-orb"
          style={{
            position: 'fixed',
            top: '45%',
            left: '50%',
            width: '70vw',
            height: '70vw',
            background: 'radial-gradient(circle, rgba(79, 70, 229, 0.1) 0%, rgba(0, 0, 0, 0) 70%)',
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1,
            pointerEvents: 'none',
            filter: 'blur(80px)',
          }}
        />

        <main className="relative z-10 w-full min-h-screen flex flex-col items-center justify-start">
          <div className="mt-[25vh] w-full max-w-5xl px-8 flex flex-col items-center">

           <div className="mb-10 opacity-0 animate-reveal [animation-delay:400ms] flex flex-col items-center">
              <div className="relative group">
                <div className="absolute -inset-4 rounded-full blur-xl transition-all duration-500" />
                <div className="relative w-24 h-24 md:w-32 md:h-32 flex items-center justify-center">
                  <img 
                    src="/images/logo.png" 
                    alt="MLB Logo" 
                    className="w-full h-full object-contain" 
                  />
                </div>
              </div>
              
              {/* Optional: Subtle divider line to bridge the logo and title */}
              <div className="mt-6 w-px h-12 bg-gradient-to-b from-indigo-500 to-transparent opacity-50" />
            </div>
            
            {/* Title with tracking expansion and blur-reveal */}
            <h1 className="animate-title text-6xl md:text-8xl lg:text-9xl font-extrabold text-slate-900 text-center mb-16 leading-none opacity-0">
              Portfolio Tracker
            </h1>
            
            {/* Staggered Reveal for Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full max-w-2xl mx-auto opacity-0 animate-reveal [animation-delay:600ms]">
              <Link
                href="/login"
                className="group px-10 py-4 text-sm tracking-[0.15em] font-bold transition-all duration-300 rounded-lg text-white flex items-center justify-center gap-3 uppercase w-full sm:w-[220px] bg-indigo-600 hover:opacity-95 hover:transform hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-[0_12px_24px_-10px_rgba(79,70,229,0.5)]"
              >
                Sign In
                <LogIn size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <Link
                href="/signup"
                className="group px-10 py-4 text-sm tracking-[0.15em] font-bold transition-all duration-300 rounded-lg text-white flex items-center justify-center gap-3 uppercase w-full sm:w-[220px] bg-indigo-600 hover:opacity-95 hover:transform hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-[0_12px_24_px_-10px_rgba(79,70,229,0.5)]"
              >
                Sign Up
                <UserPlus size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </main>

        {/* Decorative Elements */}
        <div className="fixed bottom-12 left-0 w-full flex flex-col items-center pointer-events-none opacity-0 animate-reveal [animation-delay:1200ms]">
          <span className="text-[10px] tracking-[0.6em] uppercase mb-4 font-bold text-slate-500">
            Personal Wealth Management
          </span>
          <div className="w-px h-16 bg-slate-400 origin-top animate-reveal [animation-delay:1500ms]"></div>
        </div>

        <div className="fixed top-12 left-12 pointer-events-none opacity-0 animate-reveal [animation-delay:800ms] hidden md:block">
          <div className="text-[10px] tracking-[0.4em] uppercase font-bold text-slate-400">Established 2026</div>
        </div>

        <div className="fixed top-12 right-12 pointer-events-none opacity-0 animate-reveal [animation-delay:1000ms] hidden md:block">
          <div className="text-[10px] tracking-[0.4em] uppercase font-bold text-slate-400">Private Access</div>
        </div>
      </div>
    </>
  );
}