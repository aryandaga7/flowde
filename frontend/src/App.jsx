// src/App.jsx - Updated to remove the header and adjust logout handling
import React, { useState, useEffect } from 'react';
import Signup from './components/Signup';
import Login from './components/Login';
import AssignmentForm from './components/AssignmentForm';
import FlowchartView from './components/FlowchartView';
import Dashboard from './components/Dashboard';
import Terms from './components/Terms';
import Privacy from './components/Privacy';
import './App.css';
import './Dashboard.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getCurrentUser } from './services/api';

const queryClient = new QueryClient();

function App({ view: initialView = 'login', authView: initialAuthView = 'login' }) {
  const [token, setToken] = useState(localStorage.getItem('access_token') || null);
  const [view, setView] = useState(initialView);
  const [userData, setUserData] = useState(null);

  const [authView, setAuthView] = useState(initialAuthView);
  
  // Get saved assignment data from localStorage
  const savedAssignment = localStorage.getItem('selectedAssignment');
  const parsedAssignment = savedAssignment ? JSON.parse(savedAssignment) : null;
  
  const [selectedAssignment, setSelectedAssignment] = useState(parsedAssignment);
  const [assignmentId, setAssignmentId] = useState(parsedAssignment?.id || null);

  useEffect(() => {
    const validateToken = async () => {
      const storedToken = localStorage.getItem('access_token');
      
      if (!storedToken) {
        handleLogout();
        return;
      }
      
      try {
        await getCurrentUser();
      } catch (error) {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          console.log("Session expired, logging out");
          handleLogout();
        }
      }
    };
    
    validateToken();
    
    const tokenCheckInterval = setInterval(validateToken, 5 * 60 * 1000);
    
    return () => clearInterval(tokenCheckInterval);
  }, []);

  // Fetch user data when token is available
  useEffect(() => {
    if (token) {
      const fetchUserData = async () => {
        try {
          const user = await getCurrentUser();
          setUserData(user);
        } catch (error) {
          console.error("Failed to fetch user data:", error);
          // If the error is related to authentication, log the user out
          if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            handleLogout();
          }
        }
      };
      
      fetchUserData();
    }
  }, [token]);

  // Persist the token in localStorage on change.
  useEffect(() => {
    if (token) {
      localStorage.setItem('access_token', token);
    } else {
      localStorage.removeItem('access_token');
      // Clear assignment data when logging out
      localStorage.removeItem('selectedAssignment');
      localStorage.removeItem('chatState');
    }
  }, [token]);

  // Persist selected assignment in localStorage
  useEffect(() => {
    if (selectedAssignment) {
      localStorage.setItem('selectedAssignment', JSON.stringify(selectedAssignment));
    }
  }, [selectedAssignment]);

  // Persist assignment ID in localStorage
  useEffect(() => {
    if (assignmentId) {
      localStorage.setItem('assignmentId', assignmentId.toString());
    } else {
      localStorage.removeItem('assignmentId');
    }
  }, [assignmentId]);

  const handleAuthSuccess = async (authData) => {
    if (authData && authData.access_token) {
      setToken(authData.access_token);
      
      // Immediately fetch user data after successful authentication
      try {
        const user = await getCurrentUser();
        setUserData(user);
      } catch (error) {
        console.error("Failed to fetch user data after authentication:", error);
      }
    }
  };

  const handleLogout = () => {
    // Clear the token and reset the view to login.
    localStorage.removeItem('access_token');
    localStorage.removeItem('selectedAssignment');
    localStorage.removeItem('assignmentId');
    localStorage.removeItem('chatState');
    setToken(null);
    setView('login');
    setSelectedAssignment(null);
    setAssignmentId(null);
    setUserData(null);
  };

  const handleAssignmentCreated = (result) => {
    if (!result) {
      console.error("No result received from assignment creation");
      return;
    }
    
    // Use either assignment_id or id, depending on what's available
    const id = result.assignment_id || result.id;
    
    if (id) {
      const newAssignment = { 
        id: id,
        title: result.title || "New Assignment",
        description: result.description || "Assignment created successfully"
      };
      setAssignmentId(id);
      setSelectedAssignment(newAssignment);
      
      // Save to localStorage
      localStorage.setItem('selectedAssignment', JSON.stringify(newAssignment));
      localStorage.setItem('assignmentId', id.toString());
    } else {
      console.error("Invalid assignment result:", result);
    }
  };

  const handleAssignmentSelect = (assignment) => {
    setSelectedAssignment(assignment);
    setAssignmentId(assignment.id);
  };

  const handleNewAssignment = () => {
    localStorage.removeItem('selectedAssignment');
    localStorage.removeItem('assignmentId');
    localStorage.removeItem('chatState');
    setSelectedAssignment(null);
    setAssignmentId(null);
  };

  if (token) {
    return (
      <QueryClientProvider client={queryClient}>
        <div className="dashboard-container">
          <Dashboard
            onSelectAssignment={handleAssignmentSelect}
            onNewAssignment={handleNewAssignment}
            selectedAssignmentId={assignmentId}
            onLogout={handleLogout}
            userData={userData}
          />
          <div className="dashboard-content">
            {/* Header removed as requested */}
            {assignmentId ? (
              <FlowchartView 
                assignmentId={assignmentId}
                key={assignmentId} // Force remount when ID changes 
              />
            ) : (
              <div className="assignment-form-wrapper">
                <AssignmentForm onAssignmentCreated={handleAssignmentCreated} />
              </div>
            )}
          </div>
        </div>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="app-container">
        {authView === 'login' && (
          <Login 
            onAuthSuccess={handleAuthSuccess}
            switchToSignup={() => setAuthView('signup')}
          />
        )}
        {authView === 'signup' && (
          <Signup 
          onAuthSuccess={handleAuthSuccess}
          switchToLogin={() => setAuthView('login')}
          viewTerms={() => setAuthView('terms')}
          viewPrivacy={() => setAuthView('privacy')}
        />
        )}
        {authView === 'terms' && (
          <Terms onBack={() => setAuthView('signup')} />
        )}
        {authView === 'privacy' && (
          <Privacy onBack={() => setAuthView('signup')} />
        )}
      </div>
    </QueryClientProvider>
  );
}

export default App;