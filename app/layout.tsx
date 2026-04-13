import type { Metadata } from 'next'
import { Playfair_Display, Inter } from 'next/font/google'
import './globals.css'

// next/font/google: fonts are optimized at build time, no CSS @import needed
const playfair = Playfair_Display({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  display: 'swap',
})

const inter = Inter({
  variable: '--font-body',
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: '3D&MUSIC JAM | 就労継続支援B型 × クリエイティブ制作',
    template: '%s | 3D&MUSIC JAM',
  },
  description:
    '千葉市のクリエイティブな就労継続支援B型事業所。3Dアート・音楽・映像制作を通じて、障害のある方が「好き」を軸に働き・学ぶ場所です。受給者証をお持ちの方は自己負担0円でご利用いただけます。',
  keywords: [
    '就労継続支援B型',
    '千葉市',
    '3Dアート',
    '音楽制作',
    'DTM',
    'クリエイティブ',
    '障害者支援',
    '就労支援',
  ],
  authors: [{ name: '3D&MUSIC JAM' }],
  creator: '3D&MUSIC JAM',
  metadataBase: new URL('https://eager-varahamihira.vercel.app'),
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    siteName: '3D&MUSIC JAM',
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ja"
      className={`${playfair.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
