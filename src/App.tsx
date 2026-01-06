import { IronManScroll } from './components/scrollytelling/IronManScroll';
import { MobileFallback } from './components/ui/MobileFallback';
import { useResponsive } from './hooks/useResponsive';

function App() {
  const { isMobile } = useResponsive();

  if (isMobile) {
    return <MobileFallback />;
  }

  return (
    <div className="relative w-full min-h-screen bg-primary">
      <IronManScroll />
    </div>
  );
}

export default App;
