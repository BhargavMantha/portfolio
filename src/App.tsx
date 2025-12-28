import { Scene } from './components/canvas/Scene';
import { Navbar } from './components/ui/Navbar';

function App() {
  return (
    <div className="relative w-full h-screen bg-primary overflow-hidden">
      <Navbar />
      <Scene />
    </div>
  );
}

export default App;
