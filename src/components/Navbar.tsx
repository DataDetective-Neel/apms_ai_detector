import Link from 'next/link';
import { ShieldAlert, Upload, Copy, Download, Home } from 'lucide-react';

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-full bg-white p-0.5 shadow-md border-2 border-amber-500 overflow-hidden shrink-0 flex items-center justify-center">
              <img
                src="/images/apms-emblem.jpg"
                alt="APMS Durga Puja Emblem"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="font-extrabold text-base sm:text-lg text-white tracking-tight group-hover:text-amber-400 transition">
                APMS Durga Puja Photography
              </div>
              <div className="text-[11px] text-amber-400/90 font-medium">
                AI Authenticity & Competition Portal (2026 Edition)
              </div>
            </div>
          </Link>

          <nav className="flex items-center space-x-1.5 sm:space-x-2">
            <Link
              href="/"
              className="flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-slate-200 hover:text-white hover:bg-slate-800 transition"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>

            <Link
              href="/upload"
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold bg-amber-600 text-white hover:bg-amber-500 transition shadow"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Photos</span>
            </Link>

            <Link
              href="/duplicates"
              className="flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-slate-200 hover:text-white hover:bg-slate-800 transition"
            >
              <Copy className="w-4 h-4" />
              <span className="hidden sm:inline">Duplicates</span>
            </Link>

            <a
              href="/api/export?format=csv"
              download
              className="flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-slate-200 hover:text-white hover:bg-slate-800 transition border border-slate-700"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}
