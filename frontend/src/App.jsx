// src/App.jsx
import React, { useState, useEffect } from 'react';
import Signup from './components/Signup';
import Login from './components/Login';
import AssignmentForm from './components/AssignmentForm';
import FlowchartView from './components/FlowchartView';
import Dashboard from './components/Dashboard';
import './App.css';
import './Dashboard.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('access_token') || null);
  const [view, setView] = useState('login'); // Only track view state for auth pages
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [assignmentId, setAssignmentId] = useState(null);

  // Persist the token in localStorage on change.
  useEffect(() => {
    if (token) {
      localStorage.setItem('access_token', token);
    } else {
      localStorage.removeItem('access_token');
    }
  }, [token]);

  const handleAuthSuccess = (authData) => {
    if (authData && authData.access_token) {
      setToken(authData.access_token);
    }
  };

  const handleLogout = () => {
    // Clear the token and reset the view to login.
    localStorage.removeItem('access_token');
    setToken(null);
    setView('login');
    setSelectedAssignment(null);
    setAssignmentId(null);
  };

  const handleAssignmentCreated = (result) => {
    if (result.assignment_id) {
      setAssignmentId(result.assignment_id);
      setSelectedAssignment({ 
        id: result.assignment_id,
        title: "New Assignment",
        description: "Assignment created successfully"
      });
    }
  };

  const handleAssignmentSelect = (assignment) => {
    setSelectedAssignment(assignment);
    setAssignmentId(assignment.id);
  };

  const handleNewAssignment = () => {
    setSelectedAssignment(null);
    setAssignmentId(null);
  };


  // Main dashboard view for authenticated users.
  if (token) {
    return (
      <div className="dashboard-container">
        <Dashboard
          onSelectAssignment={handleAssignmentSelect}
          onNewAssignment={handleNewAssignment}
        />
        <div className="dashboard-content">
          <header className="minimal-header">
            {/* The header is set up as a flex container with the logout button pushed to the right */}
            <div className="header-title">CSPathFinder</div>
            <button onClick={handleLogout} className="logout-button">Logout</button>
          </header>
          {assignmentId ? (
            <FlowchartView assignmentId={assignmentId} />
          ) : (
            <div className="assignment-form-wrapper">
              <AssignmentForm onAssignmentCreated={handleAssignmentCreated} />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {view === 'login' ? (
        <Login 
          onAuthSuccess={handleAuthSuccess}
          switchToSignup={() => setView('signup')}
        />
      ) : (
        <Signup 
          onAuthSuccess={handleAuthSuccess}
          switchToLogin={() => setView('login')}
        />
      )}
    </div>
  );
}

export default App;
