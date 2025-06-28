import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../styles/LegalPages.css';
import { FiArrowLeft } from 'react-icons/fi';

const Privacy = ({ onBack }) => {
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
        <h1 className="legal-title">Privacy Policy</h1>
      </div>
      
      <div className="legal-content">
        <div className="legal-section">
          <h2>1. Introduction</h2>
          <p>
            At Flowde, we value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and disclose information about you when you use our website, services, and applications (collectively, the "Service").
          </p>
          <p>
            By using the Service, you agree to the collection and use of information in accordance with this Privacy Policy.
          </p>
        </div>
        
        <div className="legal-section">
          <h2>2. Information We Collect</h2>
          <p>
            We collect several types of information from and about users of our Service, including:
          </p>
          <ul>
            <li>
              <strong>Personal Information:</strong> This includes email address, name, and any other information you provide when registering for an account or using our Service.
            </li>
            <li>
              <strong>Usage Data:</strong> We collect information about how you use the Service, including the pages you visit, the time and date of your visit, and other analytics data.
            </li>
            <li>
              <strong>Device Information:</strong> We collect information about your device, including your IP address, browser type, and operating system.
            </li>
          </ul>
        </div>
        
        <div className="legal-section">
          <h2>3. How We Use Your Information</h2>
          <p>
            We use your information for various purposes, including:
          </p>
          <ul>
            <li>To provide and maintain our Service</li>
            <li>To notify you about changes to our Service</li>
            <li>To provide customer support</li>
            <li>To monitor the usage of our Service</li>
            <li>To detect, prevent, and address technical issues</li>
          </ul>
        </div>
        
        <div className="legal-section">
          <h2>4. Data Retention</h2>
          <p>
            We will retain your personal information only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use your information to the extent necessary to comply with our legal obligations, resolve disputes, and enforce our policies.
          </p>
        </div>
        
        <div className="legal-section">
          <h2>5. Data Security</h2>
          <p>
            The security of your data is important to us, but please remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security.
          </p>
        </div>
        
        <div className="legal-section">
          <h2>6. Your Data Protection Rights</h2>
          <p>
            Depending on your location, you may have certain rights regarding your personal information, such as:
          </p>
          <ul>
            <li>The right to access your personal information</li>
            <li>The right to rectify inaccurate personal information</li>
            <li>The right to request the deletion of your personal information</li>
            <li>The right to object to the processing of your personal information</li>
            <li>The right to data portability</li>
          </ul>
        </div>
        
        <div className="legal-section">
          <h2>7. Changes to This Privacy Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
          </p>
          <p>
            You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
          </p>
        </div>
        
        <div className="legal-section">
          <h2>8. Contact Information</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at: 
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

export default Privacy;