// src/components/LandingPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowRight, FiChevronRight, FiUpload, FiAward, FiMessageCircle, FiMove, FiCode, FiGithub, FiZap, FiLayout } from 'react-icons/fi';
import '../styles/LandingPage.css';

const LandingPage = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  // Track scroll for sticky navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="landing-page">
      {/* Header Navigation */}
      <header className={`landing-nav ${isScrolled ? 'nav-scrolled' : ''}`}>
        <div className="nav-container">
          <div className="nav-logo">
            <Link to="/" style={{ textDecoration: 'none' }}>
              <h1 className="flowde-logo">flowde</h1>
            </Link>
          </div>
          
          <div className="nav-links">
            <a href="#features" className="nav-link">Features</a>
            <a href="#how-it-works" className="nav-link">How It Works</a>
            <a href="#tech-stack" className="nav-link">Tech Stack</a>
            <Link to="/login" className="nav-link">Sign In</Link>
            <Link to="/signup" className="nav-button">Get Started</Link>
          </div>
        </div>
      </header>

      {/* Hero Section - Improved */}
      <section className="hero-section">
        <div className="hero-content">
          <span className="hero-eyebrow">AI-POWERED PROJECT PLANNING</span>
          <h1 className="hero-title">Transform Ideas Into Visual Roadmaps</h1>
          <p className="hero-subtitle">
            Flowde helps students break down complex assignments into clear, actionable steps using AI-generated 
            flowcharts with intuitive editing and intelligent step-by-step assistance.
          </p>
          <div className="hero-cta">
            <Link to="/signup" className="primary-button">
              Try Flowde Free <FiArrowRight size={18} />
            </Link>
            <a 
              href="#how-it-works" 
              className="secondary-button"
              onClick={(e) => {
                e.preventDefault();
                document.querySelector('#how-it-works').scrollIntoView({ behavior: 'smooth' });
              }}
            >
              See How It Works <FiChevronRight size={18} />
            </a>
          </div>
        </div>
        <div className="hero-image">
          <img 
            src="/assets/hero-screenshot.png" 
            alt="Flowde app interface showing a project flowchart" 
            className="hero-screenshot"
          />
          <div className="hero-backdrop"></div>
        </div>
      </section>

      {/* Features Section - Redesigned */}
      <section id="features" className="features-section">
        <div className="section-header">
          <span className="section-eyebrow">KEY FEATURES</span>
          <h2 className="section-title">Smart Features for Better Project Planning</h2>
          <p className="section-subtitle">
            Flowde combines AI-powered analysis with intuitive interfaces to transform how you approach complex assignments
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <FiLayout size={24} />
            </div>
            <h3 className="feature-title">AI-Generated Flowcharts</h3>
            <p className="feature-description">
              Upload an assignment and watch as our AI breaks it down into a structured visual workflow with clear dependencies and milestones.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <FiMessageCircle size={24} />
            </div>
            <h3 className="feature-title">Context-Aware Deep Dive</h3>
            <p className="feature-description">
              Ask follow-up questions about specific steps and get intelligent responses based on RAG technology and UMD course material integration.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <FiMove size={24} />
            </div>
            <h3 className="feature-title">Interactive Editor</h3>
            <p className="feature-description">
              Customize your workflow with an intuitive drag-and-drop interface that automatically maintains logical step dependencies.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <FiZap size={24} />
            </div>
            <h3 className="feature-title">Smart Suggestions</h3>
            <p className="feature-description">
              Receive intelligent recommendations for task breakdowns, resource allocation, and time management based on your project's requirements.
            </p>
          </div>
        </div>
      </section>

      {/* Tech Stack Section - New! */}
      <section id="tech-stack" className="tech-stack-section">
        <div className="section-header">
          <span className="section-eyebrow">TECH STACK</span>
          <h2 className="section-title">Built With Modern Technology</h2>
          <p className="section-subtitle">
          Flowde is built with a modern full-stack tech stack, integrating AI and machine learning to streamline project planning and task management.
          </p>
        </div>

        <div className="tech-cards">
          <div className="tech-card">
            <h3 className="tech-card-title">Frontend</h3>
            <ul className="tech-list">
              <li className="tech-item">React with functional components & hooks</li>
              <li className="tech-item">React Router for navigation</li>
              <li className="tech-item">Responsive design with CSS variables</li>
              <li className="tech-item">React-Flow for interactive flowcharts</li>
            </ul>
          </div>

          <div className="tech-card">
            <h3 className="tech-card-title">Backend</h3>
            <ul className="tech-list">
              <li className="tech-item">FastAPI Python framework</li>
              <li className="tech-item">PostgreSQL with SQLAlchemy ORM</li>
              <li className="tech-item">JWT authentication system</li>
              <li className="tech-item">RESTful API architecture</li>
            </ul>
          </div>

          <div className="tech-card">
            <h3 className="tech-card-title">AI/ML</h3>
            <ul className="tech-list">
              <li className="tech-item">ChatGPT API Integration</li>
              <li className="tech-item">RAG (Retrieval-Augmented Generation)</li>
              <li className="tech-item">Vector embeddings for semantic search</li>
              <li className="tech-item">Custom prompt engineering</li>
              <li className="tech-item">UMD course material integration</li>
            </ul>
          </div>
        </div>

        <div className="tech-links">
          <a href="https://github.com/aryandaga7/assignment-workflow" className="tech-link" target="_blank" rel="noopener noreferrer">
            <FiGithub size={20} />
            View on GitHub
          </a>
          <a href="https://viewer.diagrams.net/?tags=%7B%7D&lightbox=1&highlight=0000ff&layers=1&nav=1&title=Flowde%20High-Level%20System%20Architecture.drawio&dark=auto#Uhttps%3A%2F%2Fdrive.google.com%2Fuc%3Fid%3D1ZsBbIAxWJ_3kQZmSJZhQE17JVoYne4Nd%26export%3Ddownload" className="tech-link" target="_blank" rel="noopener noreferrer">
            <FiCode size={20} />
            View Full Architecture
          </a>
        </div>
      </section>

      {/* How It Works Section - Enhanced */}
      <section id="how-it-works" className="how-it-works-section">
        <div className="section-header">
          <span className="section-eyebrow">WORKFLOW</span>
          <h2 className="section-title">How Flowde Works</h2>
          <p className="section-subtitle">
            From assignment description to actionable plan in three simple steps
          </p>
        </div>

        <div className="steps-container">
          <div className="step-card">
            <div className="step-number">1</div>
            <div className="step-icon">
              <FiUpload size={28} />
            </div>
            <h3 className="step-title">Upload Your Assignment</h3>
            <p className="step-description">
              Paste your assignment prompt or upload PDF/DOCX files. Our AI parses requirements, constraints, and deliverables.
            </p>
            <div className="step-image-placeholder">
              <img src="/assets/upload-screen.png" alt="Assignment upload interface" />
            </div>
          </div>

          <div className="step-card">
            <div className="step-number">2</div>
            <div className="step-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="8" y1="12" x2="16" y2="12"></line>
                <line x1="12" y1="16" x2="12" y2="16"></line>
                <line x1="12" y1="8" x2="12" y2="8"></line>
              </svg>
            </div>
            <h3 className="step-title">AI Creates Your Flowchart</h3>
            <p className="step-description">
              Within seconds, our AI generates a comprehensive visual workflow breaking down the assignment into main steps and substeps with proper relationships.
            </p>
            <div className="step-image-placeholder">
              <img src="/assets/flowchart-demo.png" alt="AI-generated flowchart" />
            </div>
          </div>

          <div className="step-card">
            <div className="step-number">3</div>
            <div className="step-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
            </div>
            <h3 className="step-title">Refine & Explore</h3>
            <p className="step-description">
              Customize your workflow by adding new nodes, restructuring steps, and using the deep dive chat to get detailed explanations for any step.
            </p>
            <div className="step-image-placeholder">
              <img src="/assets/deepdive-chat.png" alt="Deep-dive chat interface" />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="section-header">
          <span className="section-eyebrow">FEEDBACK</span>
          <h2 className="section-title">What Students Say</h2>
          <p className="section-subtitle">
            Early users are finding value in Flowde's approach to project planning
          </p>
        </div>

        <div className="testimonials-container">
          <div className="testimonial-card">
            <div className="testimonial-content">
              <p>"This helped me actually understand what my CS assignment was asking for. I could visualize each step and finish the project on my own—unlike ChatGPT where I just get the code. It’s a way better learning experience."</p>
            </div>
            <div className="testimonial-author">
              <div className="author-avatar">K</div>
              <div className="author-info">
                <h4>Karan A.</h4>
                <p>Computer Science Major</p>
              </div>
            </div>
          </div>

          <div className="testimonial-card">
            <div className="testimonial-content">
              <p>"Flowde helped me plan my final project for Environmental Science. I was able to break down the assignment into clear steps and fulfill the requirements on time without feeling overwhelmed."</p>
            </div>
            <div className="testimonial-author">
              <div className="author-avatar">M</div>
              <div className="author-info">
                <h4>Emily L.</h4>
                <p>Environmental Science Major</p>
              </div>
            </div>
          </div>

          <div className="testimonial-card">
            <div className="testimonial-content">
              <p>"As a Physics grad student, structuring my thesis research was really hard. Flowde gave me a clear workflow and timeline to follow—it’s been a lifesaver for staying organized."</p>
            </div>
            <div className="testimonial-author">
              <div className="author-avatar">S</div>
              <div className="author-info">
                <h4>Tannishtha S.</h4>
                <p>Graduate Student, Physics</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Enhanced */}
      <section className="cta-section">
        <div className="cta-container">
          <span className="cta-eyebrow">GET STARTED</span>
          <h2 className="cta-title">Ready to Transform Your Workflow?</h2>
          <p className="cta-description">
            Join students who are completing assignments more efficiently with Flowde's AI-powered planning tools.
          </p>
          <div className="cta-buttons">
            <Link to="/signup" className="cta-button">
              Create Free Account <FiArrowRight size={18} />
            </Link>
            <a href="https://github.com/aryandaga7/assignment-workflow" className="cta-secondary" target="_blank" rel="noopener noreferrer">
              <FiGithub size={18} />
              View Source Code
            </a>
          </div>
        </div>
      </section>

      {/* Footer - Enhanced */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-branding">
            <Link to="/" style={{ textDecoration: 'none' }}>
              <h2 className="flowde-logo">flowde</h2>
            </Link>
            <p className="footer-tagline">Transform assignments into visual workflows</p>
            <div className="footer-social">
              <a href="https://github.com/aryandaga7/assignment-workflow" target="_blank" rel="noopener noreferrer" className="social-icon">
                <FiGithub size={20} />
              </a>
              <a href="https://viewer.diagrams.net/?tags=%7B%7D&lightbox=1&highlight=0000ff&layers=1&nav=1&title=Flowde%20High-Level%20System%20Architecture.drawio&dark=auto#Uhttps%3A%2F%2Fdrive.google.com%2Fuc%3Fid%3D1ZsBbIAxWJ_3kQZmSJZhQE17JVoYne4Nd%26export%3Ddownload" target="_blank" rel="noopener noreferrer" className="social-icon">
                <FiCode size={20} />
              </a>
            </div>
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <h4>Product</h4>
              <ul>
                <li><a href="#features">Features</a></li>
                <li><Link to="/login">Dashboard</Link></li>
                <li><a href="#tech-stack">Technology</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <h4>Resources</h4>
              <ul>
                <li><a href="#how-it-works">How It Works</a></li>
                <li><a href="mailto:aryandaga7@gmail.com">Contact</a></li>
                <li><a href="https://github.com/aryandaga7/flowde" target="_blank" rel="noopener noreferrer">GitHub</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <h4>Legal</h4>
              <ul>
                <li>
                  <Link to="/terms">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to="/privacy">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Flowde | Created by Aryan Daga</p>
          <p className="portfolio-link">
            <a href="https://www.linkedin.com/in/aryandaga/" target="_blank" rel="noopener noreferrer">
              View Portfolio
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;