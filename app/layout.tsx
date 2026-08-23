import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

/**
 * Absolute base for canonical and Open Graph URLs.
 *
 * Set NEXT_PUBLIC_SITE_URL for a custom domain. Otherwise Vercel's own
 * production URL is used, so a preview or a fresh deploy still emits correct
 * absolute URLs without any configuration.
 */
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000')

const title = 'Rust Base Builder'
const description =
  'Plan and design a base for the survival game Rust in 3D — foundations, walls and floors on the game’s 3 m building grid, with a running resource cost.'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${title} — plan your Rust base in 3D`,
    template: `%s — ${title}`,
  },
  description,
  applicationName: title,
  keywords: ['Rust', 'base builder', 'base design', 'three.js', 'react three fiber'],
  openGraph: {
    type: 'website',
    url: siteUrl,
    title,
    description,
    siteName: title,
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: '#111827',
  colorScheme: 'dark',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
