"use client";

import React, { useEffect, useMemo } from "react";
import { motion, useMotionValue, useSpring, useTransform, MotionValue } from "framer-motion";

// Snappy, liquid orb component
const LiquidOrb = ({
    size,
    color,
    mouseX,
    mouseY,
    factor,
    delay = 0
}: {
    size: number,
    color: string,
    mouseX: MotionValue<number>,
    mouseY: MotionValue<number>,
    factor: number,
    delay?: number
}) => {
    const x = useTransform(mouseX, (v) => v * factor);
    const y = useTransform(mouseY, (v) => v * factor);

    return (
        <motion.div
            style={{
                x,
                y,
                width: size,
                height: size,
                marginLeft: -(size / 2),
                marginTop: -(size / 2),
            }}
            animate={{
                scale: [1, 1.05, 1],
            }}
            transition={{
                duration: 8 + Math.random() * 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay,
            }}
            className={`absolute left-1/2 top-1/2 rounded-full blur-[120px] opacity-40 ${color}`}
        />
    );
};

// Tiny floating particle component
const TinyParticle = ({
    p,
    mouseX,
    mouseY
}: {
    p: any,
    mouseX: MotionValue<number>,
    mouseY: MotionValue<number>
}) => {
    const x = useTransform(mouseX, (v) => v * p.factor);
    const y = useTransform(mouseY, (v) => v * p.factor);

    return (
        <motion.div
            style={{
                left: p.x,
                top: p.y,
                x,
                y,
                width: p.size,
                height: p.size,
            }}
            className={`absolute ${p.color} rounded-full opacity-30`}
            animate={{
                y: [0, -15, 0],
            }}
            transition={{
                duration: 4 + Math.random() * 4,
                repeat: Infinity,
                ease: "easeInOut",
            }}
        />
    );
};

export const Background = () => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // High-response spring configuration (snappy & fluid)
    const springConfig = { damping: 30, stiffness: 350 };
    const smoothX = useSpring(mouseX, springConfig);
    const smoothY = useSpring(mouseY, springConfig);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            // Center relative tracking for orbs/particles
            mouseX.set(e.clientX - window.innerWidth / 2);
            mouseY.set(e.clientY - window.innerHeight / 2);
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [mouseX, mouseY]);

    // Define the liquid orbs
    const orbs = useMemo(() => [
        { size: 850, color: "bg-indigo-300", factor: 0.3, delay: 0 },
        { size: 650, color: "bg-blue-300", factor: 0.5, delay: 2 },
        { size: 500, color: "bg-purple-200", factor: 0.2, delay: 4 },
    ], []);

    // Generate 50 tiny particles
    const particles = useMemo(() => {
        return Array.from({ length: 50 }).map((_, i) => ({
            id: i,
            size: Math.random() * 3 + 2, // Tiny particles (2-5px)
            x: Math.random() * 100 + "%",
            y: Math.random() * 100 + "%",
            color: ["bg-indigo-400", "bg-blue-400", "bg-purple-300"][
                Math.floor(Math.random() * 3)
            ],
            factor: (Math.random() * 0.15 + 0.05) * (Math.random() > 0.5 ? 1 : -1),
        }));
    }, []);

    return (
        <div className="fixed inset-0 -z-10 overflow-hidden bg-white">
            {/* Liquid Orbs Layer */}
            {orbs.map((orb, i) => (
                <LiquidOrb
                    key={`orb-${i}`}
                    size={orb.size}
                    color={orb.color}
                    mouseX={smoothX}
                    mouseY={smoothY}
                    factor={orb.factor}
                    delay={orb.delay}
                />
            ))}

            {/* Tiny Particles Layer */}
            {particles.map((p) => (
                <TinyParticle key={`particle-${p.id}`} p={p} mouseX={smoothX} mouseY={smoothY} />
            ))}

            {/* Background Polish */}
            <div
                className="absolute inset-0 opacity-[0.012] pointer-events-none"
                style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/p6-static.png")' }}
            />
            <div
                className="absolute inset-0 opacity-[0.015]"
                style={{
                    backgroundImage: `linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(90deg, #4f46e5 1px, transparent 1px)`,
                    backgroundSize: "64px 64px",
                }}
            />
        </div>
    );
};
