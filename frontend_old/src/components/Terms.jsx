import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../styles/LegalPages.css';
import { FiArrowLeft } from 'react-icons/fi';

const Terms = ({ onBack }) => {
  const navigate = useNavigate();
  
  const handleBack = () => {
    if (onBack) {
      // If onBack exists (from signup flow), use it
      onBack();
    } else {
      // Navigate back in history or to landing page
      navigate(-1);
    }
  };
  
  return (
    <div className="legal-page">
      <div className="legal-header">
        <button 
          onClick={handleBack} 
          className="back-link"
        >
          <FiArrowLeft size={20} />
          Back
        </button>
        <h1 className="legal-title">Terms of Service</h1>
      </div>
      
      <div className="legal-content">
        <div className="legal-section">
          <h2>1. Introduction</h2>
          <p>
            Welcome to Flowde ("we," "our," or "us"). These Terms of Service ("Terms") govern your access to and use of our website, services, and applications (collectively, the "Service").
          </p>
          <p>
            By accessing or using the Service, you agree to be bound by these Terms. If you do not agree to these Terms, you may not access or use the Service.
          </p>
        </div>
        
        <div className="legal-section">
          <h2>2. Account Registration</h2>
          <p>
            To use certain features of the Service, you may be required to register for an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.
          </p>
          <p>
            You are responsible for safeguarding your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
          </p>
        </div>
        
        <div className="legal-section">
          <h2>3. User Conduct</h2>
          <p>
            You agree not to use the Service to:
          </p>
          <ul>
            <li>Violate any applicable law or regulation</li>
            <li>Infringe the intellectual property rights of others</li>
            <li>Harass, abuse, or harm another person</li>
            <li>Transmit any malware or viruses</li>
            <li>Interfere with or disrupt the Service</li>
            <li>Attempt to gain unauthorized access to the Service</li>
          </ul>
        </div>
        
        <div className="legal-section">
          <h2>4. Intellectual Property</h2>
          <p>
            The Service and its content, features, and functionality are owned by Flowde and are protected by copyright, trademark, and other intellectual property laws.
          </p>
          <p>
            You may not copy, modify, distribute, sell, or lease any part of the Service without our prior written consent.
          </p>
        </div>
        
        <div className="legal-section">
          <h2>5. Termination</h2>
          <p>
            We may terminate or suspend your access to all or part of the Service, without prior notice or liability, for any reason, including if you breach these Terms.
          </p>
        </div>
        
        <div className="legal-section">
          <h2>6. Disclaimer of Warranties</h2>
          <p>
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
          </p>
        </div>
        
        <div className="legal-section">
          <h2>7. Limitation of Liability</h2>
          <p>
            IN NO EVENT SHALL FLOWDE BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE.
          </p>
        </div>
        
        <div className="legal-section">
          <h2>8. Changes to Terms</h2>
          <p>
            We may modify these Terms at any time. If we make material changes to these Terms, we will notify you by email or by posting a notice on our website.
          </p>
        </div>
        
        <div className="legal-section">
          <h2>9. Contact Information</h2>
          <p>
            If you have any questions about these Terms, please contact us at: 
            <a href="mailto:aryandaga7@gmail.com">aryandaga7@gmail.com</a>
          </p>
        </div>
      </div>
      
      <div className="legal-footer">
        <p>Last updated: May 3, 2025</p>
        <Link to="/" className="footer-link">Back to Home</Link>
      </div>
    </div>
  );
};


export default Terms;