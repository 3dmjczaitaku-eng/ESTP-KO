import HeroSection from '@/components/corporate/HeroSection'
import WorksGallery from '@/components/corporate/WorksGallery'
import ServicesSection from '@/components/corporate/ServicesSection'
import StaffSection from '@/components/corporate/StaffSection'
import VoiceSection from '@/components/corporate/VoiceSection'
import DayFlowSection from '@/components/corporate/DayFlowSection'
import PricingSection from '@/components/corporate/PricingSection'
import FaqSection from '@/components/corporate/FaqSection'
import ContactSection from '@/components/corporate/ContactSection'

export default function CorporatePage() {
  return (
    <>
      <HeroSection />
      <WorksGallery />
      <ServicesSection />
      <StaffSection />
      <VoiceSection />
      <DayFlowSection />
      <PricingSection />
      <FaqSection />
      <ContactSection />
    </>
  )
}
