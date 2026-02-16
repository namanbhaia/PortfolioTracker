"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Background } from "@/components/ui/background";

export default function Screensaver({ idleTimeout = 300000 }) {
    const [isActive, setIsActive] = useState(false);

    const deactivate = () => setIsActive(false);
    const activate = useCallback(() => setIsActive(true), []);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        const resetTimer = () => {
            deactivate();
            clearTimeout(timer);
            timer = setTimeout(activate, idleTimeout);
        };

        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        events.forEach(event => document.addEventListener(event, resetTimer));

        // Listen for manual activation trigger
        window.addEventListener('activate-screensaver', activate);

        timer = setTimeout(activate, idleTimeout);

        return () => {
            events.forEach(event => document.removeEventListener(event, resetTimer));
            window.removeEventListener('activate-screensaver', activate);
            clearTimeout(timer);
        };
    }, [activate, idleTimeout]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
                duration: 1
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
                duration: 1.2,
                ease: [0.22, 1, 0.36, 1] as const
            },
        },
    };

    return (
        <AnimatePresence>
            {isActive && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                    onClick={deactivate}
                    className="fixed inset-0 z-[9999] cursor-pointer bg-white flex flex-col items-center justify-center overflow-hidden"
                >
                    <Background />

                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="relative z-10 w-full max-w-4xl px-6 flex flex-col items-center pointer-events-none"
                    >
                        {/* Logo Section */}
                        <motion.div variants={itemVariants} className="mb-10">
                            <div className="relative group">
                                <div className="absolute -inset-4 rounded-full blur-xl transition-all duration-500 bg-indigo-50/50" />
                                <div className="relative w-24 h-24 flex items-center justify-center">
                                    <img
                                        src="/images/logo.png"
                                        alt="Logo"
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                            </div>
                            <div className="mt-6 mx-auto w-px h-12 bg-gradient-to-b from-indigo-500 to-transparent opacity-30" />
                        </motion.div>

                        {/* Title Section */}
                        <motion.h1
                            variants={itemVariants}
                            className="text-6xl md:text-8xl font-black text-slate-900 text-center tracking-tight leading-tight"
                        >
                            <span className="opacity-80">Portfolio</span>
                            <br />
                            <span className="bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">
                                Tracker
                            </span>
                        </motion.h1>

                        <motion.div
                            variants={itemVariants}
                            className="mt-12 text-[10px] tracking-[0.6em] uppercase font-bold text-slate-400"
                        >
                            Personal Wealth Management
                        </motion.div>
                    </motion.div>

                    {/* Corner Labels (Visible on Desktop) */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 0.4, x: 0 }}
                        transition={{ delay: 2, duration: 1 }}
                        className="fixed top-12 left-12 pointer-events-none hidden lg:block"
                    >
                        <div className="text-[10px] tracking-[0.4em] uppercase font-bold text-slate-400">
                            Established 2026
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 0.4, x: 0 }}
                        transition={{ delay: 2.2, duration: 1 }}
                        className="fixed top-12 right-12 pointer-events-none hidden lg:block"
                    >
                        <div className="text-[10px] tracking-[0.4em] uppercase font-bold text-slate-400">
                            Private Access
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}