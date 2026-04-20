import { useEffect } from 'react'
import AboutHero from '../components/about/AboutHero'
import AboutCTA from '../components/about/AboutCTA'
import Values from '../components/about/Values'
import VisionMission from '../components/about/VisionMission'

const About = () => {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll('.reveal'))
    if (elements.length === 0) return

    if (!('IntersectionObserver' in window)) {
      elements.forEach((el) => el.classList.add('visible'))
      return
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            obs.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <AboutHero />
      <VisionMission />
      <Values />
      
      <AboutCTA />
    </>
  )
}

export default About
