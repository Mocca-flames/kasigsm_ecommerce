import Banner from '../components/Banner/Banner';
import Hero from '../components/Hero/Hero';
import Scanner from '../components/Scanner/Scanner';
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
      <Banner />
      <Hero />
      <Scanner />
      <TrustBar />
      <ValueProps />
      <ImeiChecker />
      <ToolSpotlight />
      <Blog />
      <Footer />
    </div>
  );
}
