import type { Metadata, Viewport } from 'next';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#082f6b',
};
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AppProvider } from '../context/AppContext';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'AR Career Point | Online Test Platform - Bihar Board, Railway, SSC, BPSC Mock Tests',
  description:
    'AR Career Point Official Online Test Platform. Free Practice Sets, Chapter-wise Quizzes, Model Papers, and Previous Year Questions with instant results and detailed Hindi explanations.',
  keywords: [
    'AR Career Point',
    'Online Test',
    'Bihar Board Class 10th Test',
    'Bihar Board Class 12th Test',
    'Railway NTPC Mock Test',
    'SSC GD Online Test',
    'Free Practice Set',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="hi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
