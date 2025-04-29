import React from 'react';

const Privacy = ({ onBack }) => {
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <button 
          onClick={onBack} 
          style={styles.backButton}
        >
          &larr; Back
        </button>
        <h1 style={styles.title}>Privacy Policy</h1>
        <p style={styles.date}>Last updated: April 28, 2025</p>
        
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>1. Information We Collect</h2>
          <p style={styles.text}>
            We collect basic information required for account creation (email, name) and
            project data you create while using Flowde. If you use Google authentication,
            we receive information from your Google account as permitted by your Google settings.
          </p>
        </section>
        
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>2. How We Use Information</h2>
          <p style={styles.text}>
            We use your information solely to provide and improve the Flowde service,
            including authenticating you, storing your projects, and enabling collaboration features.
          </p>
        </section>
        
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>3. Data Security</h2>
          <p style={styles.text}>
            We implement reasonable security measures to protect your personal information,
            but no method of transmission over the Internet or electronic storage is 100% secure.
          </p>
        </section>
        
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>4. Third-Party Services</h2>
          <p style={styles.text}>
            We use Google authentication services. Your interaction with these services
            is subject to Google's privacy policies. We do not share your data with any
            other third parties except as required by law.
          </p>
        </section>
        
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>5. Data Retention</h2>
          <p style={styles.text}>
            We store your account information and project data for as long as your account
            is active. You may request deletion of your account and associated data at any time.
          </p>
        </section>
        
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>6. Contact</h2>
          <p style={styles.text}>
            If you have any questions about this Privacy Policy, please contact us at: 
            <a href="mailto:support@flowde.app" style={styles.link}>support@flowde.app</a>
          </p>
        </section>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'var(--neutral-50, #F9FAFB)',
    display: 'flex',
    justifyContent: 'center',
    fontFamily: 'var(--font-family, "Inter", sans-serif)',
    padding: '40px 20px',
  },
  backButton: {
    background: 'none',
    border: 'none',
    color: 'var(--primary-600, #0070F3)',
    padding: '8px 0',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    marginBottom: '16px',
  },
  content: {
    maxWidth: '800px',
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 'var(--border-radius-lg, 12px)',
    padding: '40px',
    boxShadow: 'var(--shadow-md, 0 4px 6px rgba(0, 0, 0, 0.1))',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: 'var(--neutral-900, #111827)',
    marginBottom: '8px',
    background: 'linear-gradient(90deg, var(--primary-600, #0070F3) 0%, var(--accent-500, #38B2AC) 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  date: {
    fontSize: '14px',
    color: 'var(--neutral-500, #6B7280)',
    marginBottom: '32px',
  },
  section: {
    marginBottom: '32px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: 'var(--neutral-800, #1F2937)',
    marginBottom: '16px',
  },
  text: {
    fontSize: '16px',
    lineHeight: '1.6',
    color: 'var(--neutral-700, #374151)',
  },
  link: {
    color: 'var(--primary-600, #0070F3)',
    textDecoration: 'none',
    fontWeight: '500',
    marginLeft: '4px',
  },
};

export default Privacy;