import Navigation from '@/components/Navigation'
import Hero from '@/components/Hero'
import ProductGallery from '@/components/ProductGallery'
import TechSpecs from '@/components/TechSpecs'

/**
 * Home Page
 * Root landing page for Claude Code adoption demo
 * Displays iPhone 17 Pro product site recreation
 */

export default function Home() {
  return (
    <div className="w-full bg-white">
      <Navigation />

      <main className="w-full">
        <Hero />
        <ProductGallery />
        <TechSpecs />
      </main>

      <footer className="bg-black text-white py-12 text-center">
        <p className="text-sm text-gray-400">
          Claude Code Adoption Demo | iPhone 17 Pro Recreation
        </p>
      </footer>
    </div>
  )
}
