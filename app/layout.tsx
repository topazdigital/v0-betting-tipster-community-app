import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { UserSettingsProvider } from '@/contexts/user-settings-context'
import { AuthProvider } from '@/contexts/auth-context'
import { AIChatButton } from '@/components/ai/ai-chat-button'
import { InstallPrompt } from '@/components/install-prompt'
import './globals.css'

const geist = Geist({ 
  subsets: ["latin"],
  variable: '--font-geist-sans',
});
const geistMono = Geist_Mono({ 
  subsets: ["latin"],
  variable: '--font-geist-mono',
});

export const metadata: Metadata = {
  title: {
    default: 'Betcheza - Betting Tips Community',
    template: '%s | Betcheza',
  },
  description: 'Your trusted betting tips community. Get expert predictions, track your performance, and compete with other tipsters.',
  keywords: ['betting tips', 'sports predictions', 'tipster', 'football tips', 'betting community', 'odds comparison'],
  authors: [{ name: 'Betcheza' }],
  creator: 'Betcheza',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://betcheza.co.ke'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://betcheza.co.ke',
    siteName: 'Betcheza',
    title: 'Betcheza - Betting Tips Community',
    description: 'Your trusted betting tips community. Get expert predictions, track your performance, and compete with other tipsters.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Betcheza - Betting Tips Community',
    description: 'Your trusted betting tips community.',
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <UserSettingsProvider>
              {children}
              <AIChatButton />
              <InstallPrompt />
            </UserSettingsProvider>
          </AuthProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
