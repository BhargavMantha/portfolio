import { BrowserRouter } from 'react-router-dom';

import {
  About,
  Earth,
  Experience,
  Feedbacks,
  Hero,
  Navbar,
  Tech,
  Works,
  StarsCanvas,
} from './components';
const App = () => {
  return (
    <BrowserRouter>
      <div className='relative z-0 bg-primary'>
        <div className='bg-hero-pattern bg-cover bg-no-repeat bg-center'>
          <Navbar></Navbar>
          <Hero></Hero>
        </div>
        <About></About>
        <Experience></Experience>
        <Tech></Tech>
        <Works></Works>
        <div className='relative z-0'>
          <StarsCanvas />
          <Earth />
        </div>
      </div>
    </BrowserRouter>
  );
};

export default App;
