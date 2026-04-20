import React from 'react'
import AboutHero from '../components/about/AboutHero'
import AboutCTA from '../components/about/AboutCTA'
import Values from '../components/about/Values'
import VisionMission from '../components/about/VisionMission'

const About = () => {
  return (
    <>
      <AboutHero />
      <VisionMission  />
      <Values />
      
      <AboutCTA />
    </>
  )
}

export default About
