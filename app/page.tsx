
import Link from 'next/link';
import Image from 'next/image';

export default function LandingPage() {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src="https://source.unsplash.com/random/1920x1080/?stocks"
          alt="Stock Market Background"
          fill
          style={{ objectFit: 'cover' }}
          quality={100}
        />
        <div className="absolute inset-0 bg-black opacity-75"></div>
      </div>
      <div className="relative z-20 text-center">
        <h1 className="text-6xl font-extrabold mb-4 animate-fade-in-down">
          Welcome to Portfolio Tracker
        </h1>
        <p className="text-lg text-gray-300 mb-8 animate-fade-in-up">
          Your all-in-one solution for managing your stock portfolio.
        </p>
      </div>
      <div className="relative z-20 flex space-x-6">
        <Link href="/login" legacyBehavior>
          <a className="px-8 py-3 bg-blue-600 rounded-lg font-semibold hover:bg-blue-700 transition-transform transform hover:scale-105">
            Sign In
          </a>
        </Link>
        <Link href="/signup" legacyBehavior>
          <a className="px-8 py-3 bg-gray-700 rounded-lg font-semibold hover:bg-gray-800 transition-transform transform hover:scale-105">
            Sign Up
          </a>
        </Link>
      </div>
    </div>
  );
}
