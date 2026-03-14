/**
 * @file layout.tsx
 * @description The root layout component of the application, defining the basic HTML structure, fonts, and global metadata.
 */

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "MLB Portfolio Tracker",
    description: "Wealth Management Dashboard",
    icons: {
        icon: "/images/logo_2.png",
    },
};

/**
 * The root layout component for the entire application.
 * @param {Object} props - Component props.
 * @param {React.ReactNode} props.children - Child components to render.
 */
export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={inter.className}>{children}</body>
        </html>
    );
}