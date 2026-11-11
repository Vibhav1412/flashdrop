import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'FlashDrop ⚡ High-Concurrency Limited Commerce',
  description: 'Limited-edition drop commerce engine powered by MySQL 8 and Redis 7',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-950 text-zinc-100 min-h-screen flex flex-col">
        {/* Global Navigation Bar */}
        <header className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center space-x-2 font-black text-xl tracking-tight text-white hover:opacity-90">
                <span className="text-rose-500 text-2xl">⚡</span>
                <span>FLASH<span className="text-rose-500">DROP</span></span>
              </Link>
              <nav className="hidden md:flex space-x-6 text-sm font-medium">
                <Link href="/" className="text-zinc-300 hover:text-white transition">Live Drops</Link>
                <Link href="/wallet" className="text-zinc-300 hover:text-white transition">Wallet & Ledger</Link>
                <Link href="/referrals" className="text-zinc-300 hover:text-white transition">Referrals</Link>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <Link 
                href="/admin/dashboard" 
                className="text-xs font-semibold px-3 py-1.5 rounded-md bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700 transition"
              >
                Admin Telemetry
              </Link>
              <Link 
                href="/admin/chaos" 
                className="text-xs font-bold px-3 py-1.5 rounded-md bg-rose-600/20 text-rose-400 border border-rose-500/30 hover:bg-rose-600/30 transition flex items-center space-x-1"
              >
                <span>🔥</span>
                <span>Chaos Mode</span>
              </Link>
              <div className="hidden sm:flex items-center space-x-2 border-l border-zinc-800 pl-4 text-xs text-zinc-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>MySQL + Redis Live</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-zinc-800 py-6 text-center text-xs text-zinc-400">
          <p>FlashDrop ⚡ Polyglot Persistence Architecture (MySQL 8.0 + Redis 7.2) | PES University DBMS Level 3 MiniProject</p>
        </footer>
      </body>
    </html>
  );
}

