import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import 'react-toastify/dist/ReactToastify.css';
import { ToastProvider } from '@/components/ui/ToastProvider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata = {
  title: 'Remote Soil Monitoring Dashboard',
  description: 'Real-time IoT soil monitoring system with live sensor data',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body
        className="antialiased bg-slate-50 text-slate-950 min-h-screen"
        suppressHydrationWarning
      >
        <ToastProvider />
        {children}
      </body>
    </html>
  );
}
