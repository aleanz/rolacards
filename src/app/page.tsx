import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/home/HeroSection';
import FeaturesSection from '@/components/home/FeaturesSection';
import EventsSection from '@/components/home/EventsSection';
import CTASection from '@/components/home/CTASection';

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
        <EventsSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
// Deployment test 1768410858
