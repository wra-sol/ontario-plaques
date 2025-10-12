import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom';
import { RootLayout } from './ui/RootLayout';
import { Home } from './ui/pages/Home';
import { Plaques } from './ui/pages/Plaques';
import { PlaqueDetail } from './ui/pages/PlaqueDetail';
import { About } from './ui/pages/About';

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<RootLayout />}> 
      <Route index element={<Home />} />
      <Route path="plaques" element={<Plaques />} />
      <Route path="plaques/:id" element={<PlaqueDetail />} />
      <Route path="about" element={<About />} />
      <Route path="*" element={<Home />} />
    </Route>
  )
);
