import './globals.css';
import Navbar from '@/components/Navbar';

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
        {/* Dynamic RBAC Global Navigation Bar */}
        <Navbar />

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        {/* Global Footer */}
        <footer className="border-t border-zinc-800 bg-zinc-900/40 py-6 text-center text-xs text-zinc-500 font-mono">
          <p>
            FlashDrop ⚡ Polyglot Persistence Architecture (MySQL 8.0 + Redis 7.2) | PES University DBMS Level 3 MiniProject
          </p>
        </footer>
      </body>
    </html>
  );
}
