import { Scene } from './components/canvas/Scene';
import { Navbar } from './components/ui/Navbar';
import { ContentPanel } from './components/ui/ContentPanel';

function App() {
  return (
    <div className="relative w-full h-screen bg-primary overflow-hidden">
      <Navbar />
      <Scene />
      <ContentPanel />
    </div>
  );
}

export default App;
