import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'APMS AI Detector — Durga Puja Photography Competition',
  description: 'Multi-Model AI Image Authenticity & Photography Competition Management System',
  icons: {
    icon: '/images/apms-emblem.jpg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <div className="w-6 h-6 rounded-full overflow-hidden border border-amber-400 p-0.5 bg-white">
              <img src="/images/apms-emblem.jpg" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-semibold text-slate-700">APMS Durga Puja Photography Competition 2026</span>
          </div>
          <p>© 2026 APMS. Internal AI Authenticity Screening & Competition Management System.</p>
        </footer>
      </body>
    </html>
  );
}
