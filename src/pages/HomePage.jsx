import Banner from '../components/Banner/Banner';
import Hero from '../components/Hero/Hero';
import { ScannerProvider } from '../components/Scanner/ScannerContext';
import ScannerResults from '../components/Scanner/ScannerResults';
import TrustBar from '../components/TrustBar/TrustBar';
import ValueProps from '../components/ValueProps/ValueProps';
import ImeiChecker from '../components/ImeiChecker/ImeiChecker';
import ToolSpotlight from '../components/ToolSpotlight/ToolSpotlight';
import Blog from '../components/Blog/Blog';
import Footer from '../components/Footer/Footer';

import '../styles/home.css';

export default function HomePage() {
  return (
    <div className="home-page">
      <ScannerProvider>
        <Banner />
        <Hero />
        <ScannerResults />
        <TrustBar />
        <ValueProps />
        <ImeiChecker />
        <ToolSpotlight />
        <Blog />
        <Footer />
      </ScannerProvider>
    </div>
  );
}
