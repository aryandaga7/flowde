// src/components/LandingPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiChevronRight, FiUpload, FiAward, FiMessageCircle, FiMove } from 'react-icons/fi';
import '../styles/LandingPage.css'; // Using existing styles for consistency

const LandingPage = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  
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
            <Link to="/login" className="nav-link">Sign In</Link>
            <Link to="/signup" className="nav-button">Get Started</Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Turn Assignments Into Actionable Workflows</h1>
          <p className="hero-subtitle">
            Flowde helps students break down projects into manageable tasks using AI-generated 
            flowcharts, deep-dive chat assistance, and intuitive node editing.
          </p>
          <div className="hero-cta">
            <Link to="/signup" className="primary-button">
              Get Started <FiArrowRight size={18} />
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
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-header">
          <h2 className="section-title">Smart Features for Better Planning</h2>
          <p className="section-subtitle">
            Everything you need to transform assignment descriptions into organized, actionable plans.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <FiAward size={24} />
            </div>
            <h3 className="feature-title">Visual Flowcharts</h3>
            <p className="feature-description">
              Get clear step-by-step breakdowns generated from your assignment prompts, making complex projects easy to understand.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <FiMessageCircle size={24} />
            </div>
            <h3 className="feature-title">Deep Dive Chat</h3>
            <p className="feature-description">
              Ask follow-up questions about each step and get contextual help exactly when you need it.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <FiMove size={24} />
            </div>
            <h3 className="feature-title">Drag & Drop Interface</h3>
            <p className="feature-description">
              Customize your workflow visually with an intuitive editor that lets you reorganize your plan with ease.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-it-works-section">
        <div className="section-header">
          <h2 className="section-title">How It Works</h2>
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
              Simply paste your assignment description or upload a document, and our AI will analyze the requirements.
            </p>
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
            <h3 className="step-title">AI Creates a Flow</h3>
            <p className="step-description">
              Our AI breaks down the assignment into a visual flowchart with clear steps, deadlines, and dependencies.
            </p>
          </div>

          <div className="step-card">
            <div className="step-number">3</div>
            <div className="step-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
            </div>
            <h3 className="step-title">Explore and Customize</h3>
            <p className="step-description">
              Ask follow-up questions, rearrange steps, and customize your workflow to match your personal approach.
            </p>
          </div>
        </div>
      </section>

      {/* Screenshots Gallery */}
      <section className="screenshots-section">
        <div className="section-header">
          <h2 className="section-title">See It In Action</h2>
          <p className="section-subtitle">
            Experience how Flowde transforms complex assignments into clear visual plans
          </p>
        </div>

        <div className="screenshots-container">
          <div className="screenshot-item">
            <img 
              src="/assets/flowchart-demo.png" 
              alt="AI-generated flowchart diagram showing a project breakdown" 
              className="screenshot-image"
            />
            <div className="screenshot-caption">
              <h4>Intelligent Flowcharts</h4>
              <p>AI-generated visual breakdowns of your assignments</p>
            </div>
          </div>

          <div className="screenshot-item">
            <img 
              src="/assets/deepdive-chat.png" 
              alt="Deep dive chat interface showing contextual AI assistance" 
              className="screenshot-image"
            />
            <div className="screenshot-caption">
              <h4>Deep Dive Chat</h4>
              <p>Get detailed explanations for any step in your project</p>
            </div>
          </div>

          <div className="screenshot-item">
            <img 
              src="/assets/node-editor.png" 
              alt="Node editing interface showing drag and drop functionality" 
              className="screenshot-image"
            />
            <div className="screenshot-caption">
              <h4>Intuitive Editor</h4>
              <p>Easily customize and rearrange your workflow</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      {/* <section className="testimonials-section">
        <div className="section-header">
          <h2 className="section-title">What Students Say</h2>
          <p className="section-subtitle">
            Join hundreds of students who have transformed their workflow with Flowde
          </p>
        </div>

        <div className="testimonials-container">
          <div className="testimonial-card">
            <div className="testimonial-content">
              <p>"Flowde helped me break down my thesis into manageable chunks. The visual workflow made a huge difference in how I approached my research."</p>
            </div>
            <div className="testimonial-author">
              <div className="author-avatar">J</div>
              <div className="author-info">
                <h4>Jamie L.</h4>
                <p>Graduate Student</p>
              </div>
            </div>
          </div>

          <div className="testimonial-card">
            <div className="testimonial-content">
              <p>"The deep dive feature is like having a tutor for each step of my project. It helped me understand complex requirements and stay on track."</p>
            </div>
            <div className="testimonial-author">
              <div className="author-avatar">M</div>
              <div className="author-info">
                <h4>Marcus T.</h4>
                <p>Computer Science Major</p>
              </div>
            </div>
          </div>

          <div className="testimonial-card">
            <div className="testimonial-content">
              <p>"I struggled with organizing group projects until we started using Flowde. Now we all have clarity on who's doing what and when."</p>
            </div>
            <div className="testimonial-author">
              <div className="author-avatar">S</div>
              <div className="author-info">
                <h4>Sophia R.</h4>
                <p>Business Student</p>
              </div>
            </div>
          </div>
        </div>
      </section> */}

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <h2 className="cta-title">Ready to Transform How You Work?</h2>
          <p className="cta-description">
            Join students who are completing assignments more efficiently with Flowde's AI-powered planning tools.
          </p>
          <Link to="/signup" className="cta-button">
            Get Started Free <FiArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-branding">
            <Link to="/" style={{ textDecoration: 'none' }}>
              <h2 className="flowde-logo">flowde</h2>
            </Link>
            <p className="footer-tagline">Floowwwwddddddeee...</p>
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <h4>Product</h4>
              <ul>
                <li><a href="#features-section" onClick={(e) => {
                  e.preventDefault();
                  document.querySelector('.features-section').scrollIntoView({ behavior: 'smooth' });
                }}>Features</a></li>
                <li><Link to="/login">Dashboard</Link></li>
                <li><a href="mailto:hello@getflowde.com">Request Demo</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <h4>Company</h4>
              <ul>
                <li><a href="#how-it-works" onClick={(e) => {
                  e.preventDefault();
                  document.querySelector('#how-it-works').scrollIntoView({ behavior: 'smooth' });
                }}>How It Works</a></li>
                <li><a href="mailto:aryandaga7@gmail.com">Contact</a></li>
                <li><a href="https://github.com/aryandaga7/assignment-workflow" target="_blank" rel="noopener noreferrer">GitHub</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <h4>Legal</h4>
              <ul>
                <li>
                  <Link 
                    to="/terms" 
                    state={{ from: window.location.pathname }}
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/privacy" 
                    state={{ from: window.location.pathname }}
                  >
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Flowde. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;