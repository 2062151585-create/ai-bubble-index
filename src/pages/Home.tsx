import HeroSection from '@/components/HeroSection'
import MetricsMarquee from '@/components/MetricsMarquee'
import DimensionGrid from '@/components/DimensionGrid'
import ScenarioPreview from '@/components/ScenarioPreview'
import AdvisoryCTA from '@/components/AdvisoryCTA'

export default function Home() {
  return (
    <div className="bg-deep-navy">
      <HeroSection />
      <MetricsMarquee />
      <DimensionGrid />
      <ScenarioPreview />
      <AdvisoryCTA />
    </div>
  )
}
