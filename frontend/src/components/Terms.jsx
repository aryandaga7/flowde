import React from 'react';

const Terms = ({ onBack }) => {
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <button 
          onClick={onBack} 
          style={styles.backButton}
        >
          &larr; Back
        </button>
        <h1 style={styles.title}>Terms of Service</h1>
        <p style={styles.date}>Last updated: April 28, 2025</p>
        
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>1. Introduction</h2>
          <p style={styles.text}>
            Welcome to Flowde ("we," "our," or "us"). This is a project created for educational and demonstration purposes.
            By accessing or using our service, you agree to be bound by these Terms of Service.
          </p>
        </section>
        
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>2. Service Description</h2>
          <p style={styles.text}>
            Flowde is a visual project planning tool that allows users to create flowcharts and organize tasks.
            The service is provided as-is with no guarantees of uptime or continued availability.
          </p>
        </section>
        
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>3. User Accounts</h2>
          <p style={styles.text}>
            You are responsible for safeguarding your password and for all activities that occur under your account.
            We reserve the right to suspend or terminate accounts that violate these terms or engage in harmful behavior.
          </p>
        </section>
        
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>4. Data Storage</h2>
          <p style={styles.text}>
            Your project data is stored in our database. We make reasonable efforts to protect your data
            but cannot guarantee absolute security.
          </p>
        </section>
        
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>5. Limitation of Liability</h2>
          <p style={styles.text}>
            To the maximum extent permitted by law, Flowde will not be liable for any indirect, incidental,
            special, consequential, or punitive damages resulting from your use of or inability to use the service.
          </p>
        </section>
        
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>6. Changes to Terms</h2>
          <p style={styles.text}>
            We may modify these terms at any time. Continued use of Flowde after any modification
            constitutes acceptance of the new terms.
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
};

export default Terms;