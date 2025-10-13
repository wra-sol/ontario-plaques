import React from 'react';
import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom';
import Root from './root';
import Index, { loader as indexLoader } from '../app/routes/_index';
import Plaques, { loader as plaquesLoader } from '../app/routes/plaques';
import PlaqueDetail, { loader as plaqueLoader } from '../app/routes/plaques.$id';
import About from '../app/routes/about';

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Root />}>
      <Route index element={<Index />} loader={indexLoader} />
      <Route path="plaques" element={<Plaques />} loader={plaquesLoader} />
      <Route path="plaques/:id" element={<PlaqueDetail />} loader={plaqueLoader} />
      <Route path="about" element={<About />} />
    </Route>
  )
);
