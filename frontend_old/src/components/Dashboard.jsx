// Updated Dashboard.jsx with improved profile section and user details modal
import React, { useState } from 'react';
import { getUserAssignments } from '../services/api';
import { FiPlus, FiCheckSquare, FiCalendar, FiUser, FiLogOut, FiSearch, FiMail, FiX } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';

const Dashboard = ({ onSelectAssignment, onNewAssignment, selectedAssignmentId, onLogout, userData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  
  const { 
    data: assignments, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['assignments'],
    queryFn: getUserAssignments,
    staleTime: 1000 * 60 * 5 // 5 minutes cache
  });

  // Filter assignments based on search term
  const filteredAssignments = assignments?.filter(
    assignment => assignment.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get user initial for avatar
  const getUserInitial = () => {
    if (userData?.first_name) {
      return userData.first_name.charAt(0).toUpperCase();
    }
    return 'U';
  };

  // Get display name for profile
  const getDisplayName = () => {
    if (userData?.first_name) {
      return userData.first_name;
    }
    return 'User';
  };

  // Handle profile click
  const handleProfileClick = () => {
    setShowUserModal(true);
    setShowProfileMenu(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
      <div>
        <h1 style={styles.appLogo}>flowde</h1>
      </div>
        
        <div style={styles.searchContainer}>
          <FiSearch style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        
        <button onClick={onNewAssignment} style={styles.newButton}>
          <FiPlus size={18} />
          New Project
        </button>
      </div>

      {isLoading ? (
        <div style={styles.loadingState}>
          <div style={styles.loadingSpinner} />
          Loading Projects...
        </div>
      ) : error ? (
        // Check if it's a 404 error (no assignments) and show a friendly message
        error.response && error.response.status === 404 ? (
          <div style={styles.emptyProjectsState}>
            <div style={styles.emptyStateIcon}>📝</div>
            <h3 style={styles.emptyStateTitle}>No Projects Yet</h3>
            <p style={styles.emptyStateText}>
              You haven't created any projects yet. Click the "New Project" button to get started!
            </p>
          </div>
        ) : (
          // For other errors, show the error message
          <div style={styles.errorState}>⚠️ {error.message}</div>
        )
      ) : (
        <div style={styles.projectsContainer}>
          <h2 style={styles.sectionTitle}>Your Projects</h2>
          
          {filteredAssignments?.length === 0 ? (
            <div style={styles.emptyState}>
              No projects found. Try a different search term or create a new project.
            </div>
          ) : (
            <div style={styles.projectsGrid}>
              {filteredAssignments?.map((assignment) => {
                // Create a custom style object by merging projectCard with conditional styling
                const cardStyle = {
                  ...styles.projectCard,
                  border: assignment.id === parseInt(selectedAssignmentId) 
                    ? '2px solid #3b82f6' 
                    : '1px solid #e2e8f0',
                  boxShadow: assignment.id === parseInt(selectedAssignmentId)
                    ? '0 0 0 2px rgba(59, 130, 246, 0.3)'
                    : 'none'
                };
                
                return (
                  <div 
                    key={assignment.id} 
                    onClick={() => onSelectAssignment(assignment)}
                    style={cardStyle}
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
                );
              })}
            </div>
          )}
        </div>
      )}
      
      {/* Profile section at bottom */}
      <div style={styles.profileSection}>
        <div 
          style={styles.profileButton}
          onClick={() => setShowProfileMenu(!showProfileMenu)}
        >
          <div style={styles.profileAvatar}>
            {getUserInitial()}
          </div>
          <div style={styles.profileName}>{getDisplayName()}</div>
        </div>
        
        {showProfileMenu && (
          <div style={styles.profileMenu}>
            <div 
              style={styles.profileMenuItem}
              onClick={handleProfileClick}
            >
              <FiUser size={16} />
              My Profile
            </div>
            <div 
              style={styles.profileMenuItem}
              onClick={onLogout}
            >
              <FiLogOut size={16} />
              Log Out
            </div>
          </div>
        )}
      </div>

      {/* User Profile Modal */}
      {showUserModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>User Profile</h3>
              <button 
                style={styles.modalCloseButton}
                onClick={() => setShowUserModal(false)}
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div style={styles.modalBody}>
              <div style={styles.profileDetail}>
                <div style={styles.profileLargeAvatar}>
                  {getUserInitial()}
                </div>
                
                <div style={styles.profileInfo}>
                  <div style={styles.profileInfoItem}>
                    <FiUser size={16} style={styles.profileInfoIcon} />
                    <div>
                      <div style={styles.profileInfoLabel}>Name</div>
                      <div style={styles.profileInfoValue}>
                        {userData?.first_name && userData?.last_name 
                          ? `${userData.first_name} ${userData.last_name}`
                          : 'Not provided'}
                      </div>
                    </div>
                  </div>
                  
                  <div style={styles.profileInfoItem}>
                    <FiMail size={16} style={styles.profileInfoIcon} />
                    <div>
                      <div style={styles.profileInfoLabel}>Email</div>
                      <div style={styles.profileInfoValue}>
                        {userData?.email || 'Not provided'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <button 
                style={styles.logoutButton}
                onClick={onLogout}
              >
                <FiLogOut size={16} />
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Updated styles object for Dashboard.jsx
const styles = {
  container: {
    position: 'relative',
    width: '320px',
    height: '100vh',
    backgroundColor: 'var(--neutral-50)',
    padding: '24px 20px',
    borderRight: '1px solid var(--neutral-200)',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: 'var(--shadow-sm)'
  },
  appLogo: {
    fontFamily: 'var(--font-family-logo)',
    fontSize: '26px',
    fontWeight: 700,
    background: 'linear-gradient(90deg, var(--primary-600) 0%, var(--accent-500) 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    textFillColor: 'transparent',
    letterSpacing: '-0.5px',
    margin: 0,
    padding: 0,
  },
  
  subtitle: {
    fontSize: '13px',
    color: 'var(--neutral-500)',
    marginTop: '2px',
    fontWeight: 400,
  },
  emptyProjectsState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    textAlign: 'center',
    gap: '16px'
  },
  emptyStateIcon: {
    fontSize: '48px',
    marginBottom: '8px'
  },
  emptyStateTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: 'var(--neutral-700)',
    margin: '0'
  },
  emptyStateText: {
    fontSize: '14px',
    color: 'var(--neutral-500)',
    maxWidth: '240px',
    lineHeight: '1.5'
  },

  // Update header to include space for subtitle
  header: {
    marginBottom: '24px',
    paddingBottom: '20px',
    borderBottom: '1px solid var(--neutral-200)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    color: 'var(--neutral-900)',
    margin: 5,
    fontFamily: 'var(--font-family)'
  },
  searchContainer: {
    position: 'relative',
    width: '100%'
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--neutral-400)'
  },
  searchInput: {
    width: '100%',
    padding: '10px 12px 10px 36px',
    borderRadius: 'var(--border-radius-md)',
    border: '1px solid var(--neutral-200)',
    fontSize: '14px',
    backgroundColor: 'var(--neutral-50)',
    outline: 'none',
    transition: 'all 0.2s ease',
    fontFamily: 'var(--font-family)',
    '&:focus': {
      borderColor: 'var(--primary-400)',
      boxShadow: '0 0 0 2px var(--primary-100)'
    }
  },
  newButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    padding: '12px 16px',
    backgroundColor: 'var(--primary-600)',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--border-radius-md)',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'var(--font-family)',
    '&:hover': {
      backgroundColor: 'var(--primary-700)'
    }
  },
  projectsContainer: {
    flex: 1,
    overflowY: 'auto',
    paddingRight: '4px'
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: 'var(--neutral-500)',
    margin: '0 0 16px 0'
  },
  projectsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '16px'
  },
  projectCard: {
    backgroundColor: 'white',
    borderRadius: 'var(--border-radius-lg)',
    padding: '20px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: '1px solid var(--neutral-200)',
    boxShadow: 'var(--shadow-sm)',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: 'var(--shadow-md)'
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
    backgroundColor: 'var(--primary-100)',
    color: 'var(--primary-700)',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 500
  },
  deadlineBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: 'var(--neutral-500)',
    fontSize: '12px'
  },
  projectTitle: {
    fontSize: '16px',
    color: 'var(--neutral-900)',
    margin: '0 0 12px 0',
    fontWeight: 500,
    fontFamily: 'var(--font-family)'
  },
  projectDescription: {
    fontSize: '14px',
    color: 'var(--neutral-500)',
    lineHeight: 1.5,
    margin: 0,
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  loadingState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    color: 'var(--neutral-500)',
    padding: '40px 0'
  },
  loadingSpinner: {
    width: '24px',
    height: '24px',
    border: '3px solid var(--neutral-200)',
    borderTopColor: 'var(--primary-600)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  errorState: {
    padding: '16px',
    backgroundColor: 'var(--error-100, #FEE2E2)',
    color: 'var(--error)',
    borderRadius: 'var(--border-radius-md)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
    color: 'var(--neutral-500)',
    fontSize: '14px',
    fontStyle: 'italic'
  },
  profileSection: {
    marginTop: 'auto',
    paddingTop: '16px',
    borderTop: '1px solid var(--neutral-200)',
    position: 'relative'
  },
  profileButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 12px',
    borderRadius: 'var(--border-radius-md)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: 'var(--neutral-100)'
    }
  },
  profileAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: 'var(--primary-600)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '16px'
  },
  profileName: {
    fontSize: '14px',
    fontWeight: '500',
    color: 'var(--neutral-700)'
  },
  profileMenu: {
    position: 'absolute',
    bottom: '65px',
    left: '0',
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 'var(--border-radius-md)',
    boxShadow: 'var(--shadow-md)',
    border: '1px solid var(--neutral-200)',
    overflow: 'hidden',
    zIndex: 10,
    animation: 'fadeIn 0.2s ease'
  },
  profileMenuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    color: 'var(--neutral-700)',
    fontSize: '14px',
    '&:hover': {
      backgroundColor: 'var(--neutral-100)'
    }
  },
  
  // Modal styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(2px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    animation: 'fadeIn 0.2s ease'
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 'var(--border-radius-lg)',
    width: '90%',
    maxWidth: '400px',
    boxShadow: 'var(--shadow-lg)',
    overflow: 'hidden',
    animation: 'slideInUp 0.3s ease'
  },
  modalHeader: {
    padding: '20px',
    borderBottom: '1px solid var(--neutral-200)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  modalTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
    color: 'var(--neutral-900)'
  },
  modalCloseButton: {
    background: 'none',
    border: 'none',
    color: 'var(--neutral-500)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px',
    borderRadius: 'var(--border-radius-sm)',
    '&:hover': {
      backgroundColor: 'var(--neutral-100)'
    }
  },
  modalBody: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  profileDetail: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px'
  },
  profileLargeAvatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: 'var(--primary-600)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '32px'
  },
  profileInfo: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  profileInfoItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    padding: '12px',
    backgroundColor: 'var(--neutral-50)',
    borderRadius: 'var(--border-radius-md)',
    border: '1px solid var(--neutral-200)'
  },
  profileInfoIcon: {
    color: 'var(--neutral-500)',
    marginTop: '2px'
  },
  profileInfoLabel: {
    fontSize: '12px',
    color: 'var(--neutral-500)',
    marginBottom: '4px'
  },
  profileInfoValue: {
    fontSize: '14px',
    color: 'var(--neutral-900)',
    fontWeight: '500'
  },
  logoutButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px',
    backgroundColor: 'var(--error)',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--border-radius-md)',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    marginTop: '12px',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#E43535'
    }
  }
};

// Add keyframe for spinner animation
const spinKeyframe = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const style = document.createElement('style');
style.innerHTML = spinKeyframe;
document.head.appendChild(style);

export default Dashboard;