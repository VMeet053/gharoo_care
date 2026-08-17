import React from 'react'
import './CompletedProjects.css'
import Reveal from './Reveal'
import { projects as defaultProjects } from '../constants/images'

const defaultCompletedProjects = {
  label: 'LATEST PROJECTS',
  title: 'Our Completed Projects',
  projects: defaultProjects
}

export default function CompletedProjects({ settings }) {
  const data = settings?.completedProjects || defaultCompletedProjects
  const projects = data.projects?.length > 0 ? data.projects : defaultProjects

  return (
    <section className="completed-projects-section">
      <Reveal direction="up">
        <div className="completed-projects-header">
          <div className="section-label">{data.label}</div>
          <h2>{data.title}</h2>
        </div>
      </Reveal>

      <div className="completed-projects-slider">
        <div className="completed-projects-track">
          {[...projects, ...projects].map((project, index) => (
            <div key={index} className="completed-project-card">
              <img src={project.image} alt={project.title} loading="lazy" decoding="async" />
              <div className="project-overlay">
                <h4>{project.title}</h4>
                <p>{project.subtitle}</p>
                <span className="project-view">View Project →</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
