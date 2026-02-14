"use client";

import Link from "next/link";
import { LogIn, UserPlus } from "lucide-react";
import { motion } from "framer-motion";
import { Background } from "@/components/ui/background";

export default function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0, filter: "blur(10px)" },
    visible: {
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1] as const,
      },
    },
  };

  const titleVariants = {
    hidden: { letterSpacing: "-0.05em", opacity: 0 },
    visible: {
      letterSpacing: "-0.02em",
      opacity: 1,
      transition: {
        duration: 1.2,
        ease: [0.22, 1, 0.36, 1] as const,
      },
    },
  };

  return (
    <div className="relative min-h-screen w-full selection:bg-indigo-100 font-sans text-slate-900 overflow-hidden flex flex-col items-center justify-center">
      <Background />

      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-5xl px-6 md:px-8 flex flex-col items-center"
      >
        {/* Logo Section */}
        <motion.div variants={itemVariants} className="mb-8 md:mb-12 flex flex-col items-center">
          <div className="relative group">
            <div className="absolute -inset-4 rounded-full blur-xl transition-all duration-500 bg-indigo-50/50" />
            <div className="relative w-24 h-24 md:w-32 md:h-32 flex items-center justify-center">
              <img
                src="/images/logo.png"
                alt="MLB Logo"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <div className="mt-6 w-px h-12 bg-gradient-to-b from-indigo-500 to-transparent opacity-30" />
        </motion.div>

        {/* Title Section */}
        <motion.h1
          variants={titleVariants}
          className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 text-center mb-12 md:mb-16 leading-[1.1] tracking-tight"
        >
          Portfolio Tracker
        </motion.h1>

        {/* Action Buttons */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6 w-full max-w-2xl mx-auto"
        >
          <Link
            href="/login"
            className="group px-10 py-4 text-sm tracking-[0.15em] font-bold transition-all duration-300 rounded-xl text-white flex items-center justify-center gap-3 uppercase w-full sm:w-[220px] bg-indigo-600 hover:bg-slate-900 hover:shadow-xl hover:-translate-y-1 active:scale-95"
          >
            Sign In
            <LogIn size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <Link
            href="/signup"
            className="group px-10 py-4 text-sm tracking-[0.15em] font-bold transition-all duration-300 rounded-xl text-indigo-600 flex items-center justify-center gap-3 uppercase w-full sm:w-[220px] bg-white border border-slate-200 hover:border-indigo-600 hover:bg-indigo-50/50 hover:shadow-lg hover:-translate-y-1 active:scale-95 shadow-sm"
          >
            Sign Up
            <UserPlus size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </motion.main>

      {/* Decorative Footer Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="fixed bottom-8 md:bottom-12 left-0 w-full flex flex-col items-center pointer-events-none"
      >
        <span className="text-[10px] tracking-[0.6em] uppercase mb-4 font-bold text-slate-400">
          Personal Wealth Management
        </span>
        <div className="w-px h-12 md:h-16 bg-slate-200" />
      </motion.div>

      {/* Corner Labels (Visible on Desktop) */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1, duration: 1 }}
        className="fixed top-12 left-12 pointer-events-none hidden lg:block"
      >
        <div className="text-[10px] tracking-[0.4em] uppercase font-bold text-slate-400">
          Established 2026
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.2, duration: 1 }}
        className="fixed top-12 right-12 pointer-events-none hidden lg:block"
      >
        <div className="text-[10px] tracking-[0.4em] uppercase font-bold text-slate-400">
          Private Access
        </div>
      </motion.div>
    </div>
  );
}