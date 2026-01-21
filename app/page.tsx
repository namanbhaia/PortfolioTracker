"use client";

import Link from 'next/link';
import Image from 'next/image';

export default function LandingPage() {
  return (
    <>
      {/* The font link should ideally be in the root layout, but adding it here for simplicity. */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400;500;600&display=swap');
      `}</style>
      <div className="selection:bg-black/10 min-h-screen bg-light-gray overflow-hidden font-sans-ui text-deep-charcoal">
        <div
          className="grain-texture"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: 0.03,
            pointerEvents: 'none',
            zIndex: 2,
            backgroundImage: 'url(https://lh3.googleusercontent.com/aida-public/AB6AXuAoM35XUvo9naQOEVqVStMxzRqipLEKZig90xOaFDw1U2EywDYWaAoIVJlnpFzjrOt6qDJyf8Q48QoR0gj8mIV9zhoDqEbdmB2Cg0_l3Nr-vLddgPqYmq7KdvT9y-e1h4XDSgC9moNiLG2izU4N5F3Q8oBCaApKR8d9GCw1PK4SiBgYQrXv7jWz6ZU5eY31Fe2U5LU52O8oVpIDWX33tUf20xEF5jmkIVD9oA6OlkoNOg2uTcnRUu2bupi-oMeMYA6KvQ76bOOrV_I)',
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
            maxWidth: '800px',
            maxHeight: '800px',
            background: 'radial-gradient(circle, rgba(0, 0, 0, 0.08) 0%, rgba(0, 0, 0, 0) 70%)',
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1,
            pointerEvents: 'none',
            filter: 'blur(60px)',
          }}
        />

        <main className="relative z-10 w-full min-h-screen flex flex-col items-center justify-start">
          <div className="mt-[25vh] w-full max-w-5xl px-8 flex flex-col items-center">
            <h1 className="font-serif-elegant text-6xl md:text-8xl lg:text-9xl text-deep-charcoal text-center mb-16 tracking-tight leading-none">
              Portfolio Tracker
            </h1>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full max-w-2xl mx-auto">
              <Link
                href="/login"
                className="px-12 py-4 text-sm tracking-[0.15em] font-semibold transition-all duration-300 rounded-lg text-white flex items-center justify-center uppercase w-full sm:w-[200px] bg-deep-charcoal hover:opacity-90 hover:transform hover:-translate-y-0.5 hover:bg-soft-charcoal hover:shadow-[0_12px_24px_-10px_rgba(0,0,0,0.4)]"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-12 py-4 text-sm tracking-[0.15em] font-semibold transition-all duration-300 rounded-lg text-white flex items-center justify-center uppercase w-full sm:w-[200px] bg-deep-charcoal hover:opacity-90 hover:transform hover:-translate-y-0.5 hover:bg-soft-charcoal hover:shadow-[0_12px_24px_-10px_rgba(0,0,0,0.4)]"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </main>

        <div className="fixed bottom-12 left-0 w-full flex flex-col items-center pointer-events-none opacity-40">
          <span className="text-[10px] tracking-[0.6em] uppercase mb-4 font-medium text-deep-charcoal">
            Intuitive Wealth Management
          </span>
          <div className="w-px h-16 bg-deep-charcoal/40"></div>
        </div>

        <div className="fixed top-12 left-12 pointer-events-none opacity-30 hidden md:block">
          <div className="text-[10px] tracking-[0.4em] uppercase font-medium">Established MMXXIV</div>
        </div>

        <div className="fixed top-12 right-12 pointer-events-none opacity-30 hidden md:block">
          <div className="text-[10px] tracking-[0.4em] uppercase font-medium">Global Access</div>
        </div>
      </div>
    </>
  );
}
