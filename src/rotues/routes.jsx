import React from 'react'
import { Route, Routes } from 'react-router-dom'
import { Jobs } from '../pages/Jobs'
import About from '../pages/About'

const routes = () => {
  return (
    <Routes>
      <Route path="/jobs" element={<Jobs />} />
      <Route path="/about" element={<About />} />
    </Routes>
  )
}

export default routes
