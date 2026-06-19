import type { Metadata } from 'next';
import './globals.css';
import { ToastContainer } from '@/components/ui/Toast';

export const metadata: Metadata = {
  title: 'THE JOURNAL | THANAL JSK — World Cup 2026 Prediction',
  description: 'Official FIFA World Cup 2026 Prediction Competition — THE JOURNAL | THANAL JSK',
  keywords: ['World Cup 2026', 'Football Prediction', 'The Journal', 'Thanal JSK'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans bg-slate-950 text-white antialiased">
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
