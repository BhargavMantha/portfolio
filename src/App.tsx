import { Scene } from './components/canvas/Scene';
import { Navbar } from './components/ui/Navbar';
import { ContentPanel } from './components/ui/ContentPanel';
import { MobileFallback } from './components/ui/MobileFallback';
import { useResponsive } from './hooks/useResponsive';

function App() {
  const { isMobile } = useResponsive();

  if (isMobile) {
    return <MobileFallback />;
  }

  return (
    <div className="relative w-full h-screen bg-primary overflow-hidden">
      <Navbar />
      <Scene />
      <ContentPanel />
    </div>
  );
}

export default App;
