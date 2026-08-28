import Link from 'next/link';
import { Camera, ShieldAlert, Upload, Copy, Download, Home } from 'lucide-react';

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="bg-amber-600 p-2 rounded-lg text-white shadow">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <Link href="/" className="font-bold text-lg text-white tracking-tight hover:text-amber-400 transition">
                APMS Durga Puja Photography
              </Link>
              <div className="text-xs text-slate-400">AI Authenticity & Competition Portal (Max ~300 Entries)</div>
            </div>
          </div>

          <nav className="flex items-center space-x-2">
            <Link
              href="/"
              className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-slate-200 hover:text-white hover:bg-slate-800 transition"
            >
              <Home className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/upload"
              className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium bg-amber-600 text-white hover:bg-amber-500 transition shadow"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Photos</span>
            </Link>
            <Link
              href="/duplicates"
              className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-slate-200 hover:text-white hover:bg-slate-800 transition"
            >
              <Copy className="w-4 h-4" />
              <span>Duplicates</span>
            </Link>
            <a
              href="/api/export?format=csv"
              download
              className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-slate-200 hover:text-white hover:bg-slate-800 transition border border-slate-700"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}
