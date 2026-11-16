import type { Metadata, Viewport } from 'next'
import { Archivo, Big_Shoulders, Big_Shoulders_Stencil } from 'next/font/google'
import './globals.css'

/** Body and interface text. */
const archivo = Archivo({
  subsets: ['latin'],
  display: 'swap',
  axes: ['wdth'],
  variable: '--font-archivo',
})

/** Condensed industrial display face for names, numbers and the hotbar. */
const shoulders = Big_Shoulders({
  subsets: ['latin'],
  display: 'swap',
  axes: ['opsz'],
  variable: '--font-shoulders',
})

/** Stencil cut, used for the wordmark and hotbar key numbers only. */
const shouldersStencil = Big_Shoulders_Stencil({
  subsets: ['latin'],
  display: 'swap',
  weight: ['700', '800'],
  variable: '--font-shoulders-stencil',
})

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
  'Plan a base for the survival game Rust in 3D. Pieces snap to sockets the way they do in the game, with structural stability, real material textures and a running resource cost.'

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
  themeColor: '#1e201b',
  colorScheme: 'dark',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${archivo.variable} ${shoulders.variable} ${shouldersStencil.variable}`}>
        {children}
      </body>
    </html>
  )
}
