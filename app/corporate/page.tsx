import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '3D&MUSIC JAM | 就労継続支援B型 × クリエイティブ制作',
  description:
    '千葉市のクリエイティブな就労継続支援B型事業所。3Dアート・音楽・映像制作を通じて、障害のある方が「好き」を軸に働き・学ぶ場所です。受給者証をお持ちの方は自己負担0円でご利用いただけます。',
  openGraph: {
    title: '3D&MUSIC JAM — クリエイティブを、生きる力に。',
    description:
      '3Dアート・音楽・映像を軸とした就労継続支援B型事業所。千葉市。未経験歓迎・自己負担0円。',
    url: 'https://eager-varahamihira.vercel.app/corporate',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: '3D&MUSIC JAM — クリエイティブな就労継続支援B型事業所',
      },
    ],
  },
  alternates: {
    canonical: 'https://eager-varahamihira.vercel.app/corporate',
  },
}

import HeroSection from '@/components/corporate/HeroSection'
import AboutSection from '@/components/corporate/AboutSection'
import WorksGallery from '@/components/corporate/WorksGallery'
import ServicesSection from '@/components/corporate/ServicesSection'
import FacilitySection from '@/components/corporate/FacilitySection'
import StaffSection from '@/components/corporate/StaffSection'
import InfoHubSection from '@/components/corporate/InfoHubSection'
import ContactSection from '@/components/corporate/ContactSection'

export default function CorporatePage() {
  return (
    <>
      <HeroSection />
      <AboutSection />
      <WorksGallery />
      <ServicesSection />
      <FacilitySection />
      <StaffSection />
      <InfoHubSection />
      <ContactSection />
    </>
  )
}
