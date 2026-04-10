import type { Metadata } from 'next'
import CorporateNav from '@/components/corporate/CorporateNav'

export const metadata: Metadata = {
  title: '3D&MUSIC JAM | クリエイティブ就労継続支援B型',
  description:
    '3Dアートと音楽を軸にしたクリエイティブな就労継続支援B型事業所。あなたの表現をカタチにする場所。',
  openGraph: {
    title: '3D&MUSIC JAM',
    description: 'クリエイティブな就労継続支援B型事業所',
    locale: 'ja_JP',
    type: 'website',
  },
}

export default function CorporateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // font-body / font-display は globals.css の CSS 変数で定義済み
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <CorporateNav />
      <main id="main-content">{children}</main>
      <footer className="border-t border-[var(--color-border)] py-10 text-center text-sm text-[var(--color-text-muted)]">
        <p>&copy; {new Date().getFullYear()} 3D&MUSIC JAM. All rights reserved.</p>
      </footer>
    </div>
  )
}
