/**
 * API service for interacting with the backend.
 */
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

// Helper function to get the JWT token from localStorage.
const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const googleLogin = async (token) => {
  try {
    const formData = new FormData();
    formData.append('token', token);
    
    const response = await axios.post(`${API_BASE_URL}/google-login`, formData);
    localStorage.setItem('access_token', response.data.access_token);
    return response.data;
  } catch (error) {
    console.error('Error with Google login:', error);
    throw error;
  }
};

// Add forgot password function
export const forgotPassword = async (email) => {
  try {
    const formData = new FormData();
    formData.append('email', email);
    
    const response = await axios.post(`${API_BASE_URL}/forgot-password`, formData);
    return response.data;
  } catch (error) {
    console.error('Error with forgot password:', error);
    throw error;
  }
};

export const getUserAssignments = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/user/assignments`, {
      headers: { ...getAuthHeaders() }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching user assignments:', error);
    throw error;
  }
};

export const createAssignment = async (assignmentInput) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/create-assignment`,
      { assignment_input: assignmentInput },
      { headers: { "Content-Type": "application/json", ...getAuthHeaders() } }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating assignment:', error);
    throw error;
  }
};

export const getAssignment = async (assignmentId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/assignments/${assignmentId}`, {
      headers: { ...getAuthHeaders() }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching assignment:', error);
    throw error;
  }
};

export const testGpt = async (assignmentInput) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/test-gpt`,
      { assignment_input: assignmentInput },
      { headers: { "Content-Type": "application/json" } }
    );
    return response.data;
  } catch (error) {
    console.error('Error testing GPT:', error);
    throw error;
  }
};

// Node-related API functions
export const updateNodePosition = async (nodeId, x, y) => {
  try {
    await axios.put(`${API_BASE_URL}/steps/${nodeId}/position`, 
      { position_x: x, position_y: y },
      { headers: getAuthHeaders() }
    );
  } catch (error) {
    console.error('Error updating node position:', error);
    throw error;
  }
};

export const deleteNode = async (nodeId) => {
  try {
    await axios.delete(`${API_BASE_URL}/steps/${nodeId}`, { headers: getAuthHeaders() });
  } catch (error) {
    console.error('Error deleting node:', error);
    throw error;
  }
};

export const updateNodeCompletion = async (nodeId, completed) => {
  try {
    await axios.patch(`${API_BASE_URL}/steps/${nodeId}/completion`, 
      { completed },
      { headers: getAuthHeaders() }
    );
  } catch (error) {
    console.error('Error updating node completion:', error);
    throw error;
  }
};

export const updateAssignmentCompletion = async (assignmentId, completed) => {
  try {
    console.log(`Attempting to update assignment ${assignmentId} completion to ${completed}`);
    const response = await axios.patch(
      `${API_BASE_URL}/assignments/${assignmentId}/completion`,
      { completed },
      { headers: { "Content-Type": "application/json", ...getAuthHeaders() } }
    );
    console.log("Assignment completion update response:", response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating assignment completion:', error);
    console.error('Error details:', error.response?.data);
    throw error;
  }
};

export const getAssignmentCompletionStatus = async (assignmentId) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/assignments/${assignmentId}/completion-status`,
      { headers: { ...getAuthHeaders() } }
    );
    return response.data;
  } catch (error) {
    console.error('Error checking assignment completion status:', error);
    throw error;
  }
};

export const checkAndUpdateAssignmentCompletion = async (assignmentId) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/assignments/${assignmentId}/check-completion`,
      {},  // Empty body since we're just triggering the check
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Error checking assignment completion:', error);
    throw error;
  }
};

export const addNewNode = async (assignmentId, content, referenceNodeId, x, y, insertionType = null) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/steps`,
      {
        assignment_id: assignmentId,
        content,
        reference_node_id: referenceNodeId, // pass the reference node id here
        position_x: x,
        position_y: y,
        insertion_type: insertionType
      },
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Error adding new node:', error);
    throw error;
  }
};

export const updateNodeContent = async (nodeId, content) => {
  try {
    await axios.patch(`${API_BASE_URL}/steps/${nodeId}`, 
      { content },
      { headers: getAuthHeaders() }
    );
  } catch (error) {
    console.error('Error updating node content:', error);
    throw error;
  }
};

// New function to add a connection between nodes
export const addConnection = async (assignmentId, fromNodeId, toNodeId) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/connections`,
      {
        assignment_id: assignmentId,
        from_step: fromNodeId,
        to_step: toNodeId
      },
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Error adding connection:', error);
    throw error;
  }
};

export const getAssignmentChat = async (assignmentId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/chat/assignment/${assignmentId}`, {
      headers: { ...getAuthHeaders() }
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching assignment chat:", error);
    throw error;
  }
};

export const getNodeChat = async (nodeId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/chat/node/${nodeId}`, {
      headers: { ...getAuthHeaders() }
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching node chat:", error);
    throw error;
  }
};

export const postChatMessage = async (payload) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/chat`, payload, {
      headers: { "Content-Type": "application/json", ...getAuthHeaders() }
    });
    return response.data;
  } catch (error) {
    console.error("Error posting chat message:", error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  const response = await axios.get(`${API_BASE_URL}/me`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
  });
  return response.data;
};

export const createAssignmentWithFiles = async (formData) => {
  try {
    // Log what's in the FormData for debugging
    console.log("FormData contents:");
    for (let pair of formData.entries()) {
      console.log(pair[0], pair[1] instanceof File ? `File: ${pair[1].name}` : pair[1]);
    }
    
    const response = await axios.post(
      `${API_BASE_URL}/create-assignment-with-files`,
      formData,
      { 
        headers: { 
          ...getAuthHeaders(),
          // Let the browser set the Content-Type with boundary parameter automatically
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          // Use a callback to update the upload progress
          if (window.updateUploadProgress) {
            window.updateUploadProgress(percentCompleted);
          }
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating assignment with files:', error);
    console.error('Response:', error.response?.data);
    throw error;
  }
};

export const testPdfExtraction = async (files) => {
  try {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`files`, file);
    });
    
    const response = await axios.post(
      `${API_BASE_URL}/test-pdf-extraction`,
      formData,
      { 
        headers: { 
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data' 
        } 
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error testing PDF extraction:', error);
    throw error;
  }
};

axios.interceptors.response.use(
  response => response,
  error => {
    // Check if error is due to unauthorized (401)
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Clear localStorage
      localStorage.removeItem('access_token');
      localStorage.removeItem('selectedAssignment');
      localStorage.removeItem('assignmentId');
      localStorage.removeItem('chatState');
      
      // Redirect to login (you may need to use a different approach depending on your router)
      window.location.href = '/'; // Or wherever your login page is
    }
    
    return Promise.reject(error);
  }
);
