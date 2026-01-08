import { IronManScroll } from './components/scrollytelling/IronManScroll';
import { CustomCursor } from './components/ui/CustomCursor';

function App() {
  return (
    <div className="relative w-full min-h-screen bg-primary cursor-none">
      <CustomCursor />
      <IronManScroll />
    </div>
  );
}

export default App;
