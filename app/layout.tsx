import type { Metadata } from 'next';
import { Inter, Manrope } from 'next/font/google';
import { Header } from '@/components/shared/header';
import { Footer } from '@/components/shared/footer';
import { AiAssistantWidget } from '@/components/ai/ai-assistant-widget';
import { PageTransitionProvider } from '@/components/shared/page-transition';
import { AuthProvider } from '@/lib/auth/auth-context';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://nrcarhire.com.au'),
  title: {
    default: 'NR Car Hire — Premium Car Rental in Australia',
    template: '%s | NR Car Hire',
  },
  description:
    'Premium car hire across Australia. Quality vehicles, transparent pricing, and reliable service. Browse our fleet and book online.',
  keywords: [
    'car hire',
    'car rental',
    'Australia',
    'premium car hire',
    'vehicle rental',
    'Sydney car hire',
    'Melbourne car hire',
    'Brisbane car hire',
  ],
  authors: [{ name: 'NR Car Hire' }],
  openGraph: {
    type: 'website',
    locale: 'en_AU',
    siteName: 'NR Car Hire',
    title: 'NR Car Hire — Premium Car Rental in Australia',
    description:
      'Premium car hire across Australia. Quality vehicles, transparent pricing, and reliable service.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NR Car Hire — Premium Car Rental in Australia',
    description:
      'Premium car hire across Australia. Quality vehicles, transparent pricing, and reliable service.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable}`}>
      <body className="min-h-dvh font-sans">
        <AuthProvider>
          <PageTransitionProvider>
            <Header />
            {children}
            <Footer />
            <AiAssistantWidget />
          </PageTransitionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
