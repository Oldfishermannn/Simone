import type { Metadata } from 'next';
import './globals.css';
import SWRegister from './components/SWRegister';

export const metadata: Metadata = {
  title: 'Simone - AI Music Companion',
  description: '你的音乐陪伴，随时随地',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Simone',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1a1a2e',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body>
        <SWRegister />
        {children}
      </body>
    </html>
  );
}
