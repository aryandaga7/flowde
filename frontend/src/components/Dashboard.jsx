import React, { useState, useEffect } from 'react';
import { getUserAssignments } from '../services/api';
import { FiPlus, FiCheckSquare, FiCalendar } from 'react-icons/fi';

const Dashboard = ({ onSelectAssignment, onNewAssignment }) => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getUserAssignments();
        setAssignments(data);
      } catch (err) {
        setError('Failed to load assignments');
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>CSPathFinder</h1>
        <button onClick={onNewAssignment} style={styles.newButton}>
          <FiPlus size={18} />
          New Project
        </button>
      </div>

      {loading ? (
        <div style={styles.loadingState}>
          <div style={styles.loadingSpinner} />
          Loading Projects...
        </div>
      ) : error ? (
        <div style={styles.errorState}>⚠️ {error}</div>
      ) : (
        <div style={styles.projectsGrid}>
          {assignments.map((assignment) => (
            <div 
              key={assignment.id} 
              onClick={() => onSelectAssignment(assignment)}
              style={styles.projectCard}
            >
              <div style={styles.cardHeader}>
                <div style={styles.statusBadge}>
                  <FiCheckSquare size={14} />
                  {assignment.status || 'In Progress'}
                </div>
                {assignment.deadline && (
                  <div style={styles.deadlineBadge}>
                    <FiCalendar size={14} />
                    {new Date(assignment.deadline).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                )}
              </div>
              <h3 style={styles.projectTitle}>{assignment.title}</h3>
              <p style={styles.projectDescription}>
                {assignment.description || 'No description provided'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    width: '320px',
    height: '100vh',
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRight: '1px solid #f0f4f9',
    overflowY: 'auto'
  },
  header: {
    marginBottom: '32px',
    paddingBottom: '24px',
    borderBottom: '1px solid #f0f4f9'
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#0f172a',
    margin: '0 0 24px 0',
    fontFamily: "'Inter', sans-serif"
  },
  newButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
    padding: '14px 20px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#2563eb',
      transform: 'translateY(-1px)'
    }
  },
  projectsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '16px'
  },
  projectCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '20px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: '1px solid #e2e8f0',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
    }
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '16px'
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#e0f2fe',
    color: '#0369a1',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 500
  },
  deadlineBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#64748b',
    fontSize: '12px'
  },
  projectTitle: {
    fontSize: '16px',
    color: '#0f172a',
    margin: '0 0 12px 0',
    fontFamily: "'Inter', sans-serif"
  },
  projectDescription: {
    fontSize: '14px',
    color: '#64748b',
    lineHeight: 1.5,
    margin: 0
  },
  loadingState: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    color: '#64748b'
  },
  loadingSpinner: {
    width: '24px',
    height: '24px',
    border: '3px solid #e2e8f0',
    borderTopColor: '#3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  errorState: {
    padding: '16px',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  }
};

export default Dashboard;