import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
    title: 'WealthTrack | Portfolio Manager',
    description: 'Multi-client family investment tracker',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                {/* This is where your Sidebar + Page Content will render */}
                {children}
            </body>
        </html>
    )
}