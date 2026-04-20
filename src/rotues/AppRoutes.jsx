import React from "react";
import { Route, Routes } from "react-router-dom";
import Jobs from "../pages/Jobs";
import About from "../pages/About";
import Home from "../pages/Home";
import Blog from "../pages/Blog";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/jobs" element={<Jobs />} />
      <Route path="/about" element={<About />} />
      <Route path="/blog" element={<Blog />} />
    </Routes>
  );
};

export default AppRoutes;
