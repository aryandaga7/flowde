// src/components/FlowchartView.jsx
import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap,
  useNodesState, 
  useEdgesState,
  MarkerType
} from 'react-flow-renderer';
import 'react-flow-renderer/dist/style.css';
import axios from 'axios';
import NodeEditorModal from './NodeEditorModal';
import AddNodeModal from './AddNodeModal';
import ChatWindow from './ChatWindow'; // NEW: Chat window component
import { 
  updateNodePosition, 
  deleteNode, 
  updateNodeCompletion, 
  addNewNode,
  updateNodeContent
} from '../services/api';
import { FiPlus, FiMessageSquare, FiCheck } from 'react-icons/fi';

const nodeStyles = (completed) => ({
  background: completed ? '#f8fafc' : '#ffffff',
  border: `2px solid ${completed ? '#34d399' : '#3b82f6'}`,
  color: completed ? '#94a3b8' : '#0f172a',
  borderRadius: '12px',
  padding: '20px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  width: '240px',
  opacity: completed ? 0.8 : 1,
  transition: 'all 0.3s ease',
});

function FlowchartView({ assignmentId }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states for editing and adding nodes.
  const [editorModalOpen, setEditorModalOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [additionContext, setAdditionContext] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalPosition, setAddModalPosition] = useState({ x: 0, y: 0 });

  // Chat window visibility state (assignment-level chat)
  const [chatVisible, setChatVisible] = useState(false);
  const [nodeChatOpen, setNodeChatOpen] = useState(false);
  const [chatNodeId, setChatNodeId] = useState(null);

  // Fetch assignment data from backend.
  const fetchAssignmentData = useCallback(async () => {
    if (!assignmentId) return;
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:8000/assignments/${assignmentId}`);
      setAssignment(response.data);
      processFlowchartData(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching assignment data:", err);
      setError("Failed to load assignment data");
      setNodes([]);
      setEdges([]);
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  // Process data into nodes and edges using stored positions.
  const processFlowchartData = useCallback((data) => {
    if (!data || !data.steps) return;
    const flowNodes = data.steps.map(step => ({
      id: `step-${step.id}`,
      type: 'default',
      position: { x: step.position_x, y: step.position_y },
      data: { 
        ...step,
        label: (
          <div style={styles.nodeContent}>
            <div style={{ 
              textDecoration: step.completed ? 'line-through' : 'none',
              opacity: step.completed ? 0.7 : 1
            }}>
              {step.content}
            </div>
            {step.deadline && (
              <div style={styles.deadline}>
                <FiCalendar size={12} />
                {new Date(step.deadline).toLocaleDateString()}
              </div>
            )}
            {step.completed && (
              <div style={styles.completedBadge}>
                <FiCheck size={16} />
              </div>
            )}
          </div>
        )
      },
      style: nodeStyles(step.completed)
    }));
    
    const flowEdges = data.connections.map(conn => ({
      id: `edge-${conn.from_step}-${conn.to_step}`,
      source: `step-${conn.from_step}`,
      target: `step-${conn.to_step}`,
      type: 'smoothstep',
      animated: true,
      style: {
        stroke: '#cbd5e1',
        strokeWidth: 2,
        opacity: 0.6
      },
      markerEnd: { 
        type: MarkerType.ArrowClosed,
        color: '#94a3b8'
      }
    }));
    
    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [setNodes, setEdges]);


  useEffect(() => {
    fetchAssignmentData();
  }, [fetchAssignmentData, assignmentId]);

  const onNodeDragStop = useCallback((event, node) => {
    const id = parseInt(node.id.replace("step-", ""), 10);
    updateNodePosition(id, node.position.x, node.position.y)
      .then(() => console.log(`Updated position for node ${node.id}`))
      .catch(err => console.error("Failed to update node position", err));
  }, []);

  const onNodeDoubleClick = useCallback((event, node) => {
    setSelectedNode(node);
    setEditorModalOpen(true);
  }, []);

  const onPaneDoubleClick = useCallback((event) => {
    event.preventDefault();
    // Get pane coordinates reliably from the ReactFlow instance.
    const bounds = event.target.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    setAddModalPosition({ x, y });
    setAdditionContext({ insertionType: "random", referenceNodeId: null });
    setAddModalOpen(true);
  }, []);

  const handleAddNodeButton = () => {
    setAddModalPosition({ x: 200, y: 200 });
    setAdditionContext({ insertionType: "random", referenceNodeId: null });
    setAddModalOpen(true);
  };

  const handleEditorClose = () => {
    setEditorModalOpen(false);
    setSelectedNode(null);
  };

  const handleUpdateContent = async (newContent) => {
    if (!selectedNode) return;
    const id = parseInt(selectedNode.id.replace("step-", ""), 10);
    try {
      await updateNodeContent(id, newContent);
      handleEditorClose();
      fetchAssignmentData();
    } catch (err) {
      console.error("Error updating node content", err);
    }
  };

  const handleDeleteNode = async () => {
    if (!selectedNode) return;
    const id = parseInt(selectedNode.id.replace("step-", ""), 10);
    try {
      await deleteNode(id);
      handleEditorClose();
      fetchAssignmentData();
    } catch (err) {
      console.error("Error deleting node", err);
    }
  };

  const handleToggleComplete = async () => {
    if (!selectedNode) return;
    const id = parseInt(selectedNode.id.replace("step-", ""), 10);
    try {
      const newStatus = !selectedNode.data.completed;
      await updateNodeCompletion(id, newStatus);
      handleEditorClose();
      fetchAssignmentData();
    } catch (err) {
      console.error("Error toggling node completion", err);
    }
  };

  // Function to set addition context based on the mode and open the AddNodeModal.
  const initiateAddition = (mode) => {
    if (!selectedNode) return;
    const refId = selectedNode.id.replace("step-", "");
    let pos = { x: selectedNode.position.x, y: selectedNode.position.y };
    if (mode === "new_step") {
      // For main step insertion: new main step to the right.
      pos = { x: selectedNode.position.x + 150, y: selectedNode.position.y };
      setAdditionContext({ insertionType: "new_step", referenceNodeId: refId });
    } else if (mode === "after") {
      // For "after": if current node is a parent, treat as adding a substep (first in list); otherwise, sibling.
      if (selectedNode.data.parent_id === null) {
        pos = { x: selectedNode.position.x, y: selectedNode.position.y + 50 };
        setAdditionContext({ insertionType: "after", referenceNodeId: refId });
      } else {
        pos = { x: selectedNode.position.x, y: selectedNode.position.y + 50 };
        setAdditionContext({ insertionType: "after", referenceNodeId: refId });
      }
    } else if (mode === "substep") {
      // For child insertion.
      pos = { x: selectedNode.position.x + 150, y: selectedNode.position.y };
      setAdditionContext({ insertionType: "substep", referenceNodeId: refId });
    }
    setEditorModalOpen(false);
    setAddModalPosition(pos);
    setAddModalOpen(true);
  };

  const handleAddNodeFromModal = async ({ content, position }) => {
    try {
      await addNewNode(
        assignmentId,
        content,
        additionContext.referenceNodeId,
        position.x,
        position.y,
        additionContext.insertionType
      );
      setAddModalOpen(false);
      setAdditionContext(null);
      fetchAssignmentData();
    } catch (err) {
      console.error("Error adding node from modal", err);
    }
  };

  // Toggle chat window visibility (assignment-level chat)
  const toggleChatWindow = () => {
    setChatVisible((prev) => !prev);
  };

  const handleOpenNodeChat = () => {
    // Open the node-specific chat for the currently selected node.
    if (selectedNode) {
      setChatNodeId(selectedNode.id.replace("step-", ""));
      setNodeChatOpen(true);
      // Optionally close the editor modal.
      setEditorModalOpen(false);
    }
  };

  const closeNodeChat = () => {
    setNodeChatOpen(false);
    setChatNodeId(null);
  };

  if (loading) return <div className="loading">Loading assignment flowchart...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!assignment) return <div className="no-data">No assignment data available</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.titleGroup}>
          <h1 style={styles.title}>{assignment?.title}</h1>
          {assignment?.deadline && (
            <div style={styles.assignmentDeadline}>
              <FiCalendar size={16} />
              Due: {new Date(assignment.deadline).toLocaleDateString()}
            </div>
          )}
        </div>
        
        <div style={styles.controls}>
          <button style={styles.controlButton} onClick={toggleChatWindow}>
            <FiMessageSquare size={18} />
            Chat
          </button>
          <button style={styles.controlButton} onClick={handleAddNodeButton}>
            <FiPlus size={18} />
            Add Step
          </button>
        </div>
      </div>
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onNodeDoubleClick={onNodeDoubleClick}
        onPaneDoubleClick={onPaneDoubleClick}
        fitView
        zoomOnDoubleClick={false}
      >
        <Background 
          color="#e2e8f0" 
          gap={60}
          variant="dots"
          style={{ backgroundColor: '#f8fafc' }}
        />
        <Controls style={{ bottom: 40, right: 20 }} />
        <MiniMap 
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}
          nodeColor={(n) => n.style?.background || '#fff'}
        />
      </ReactFlow>
      
      {/* Editor Modal for node editing */}
      {editorModalOpen && selectedNode && (
        <NodeEditorModal 
          isOpen={editorModalOpen}
          nodeData={selectedNode.data}
          onClose={handleEditorClose}
          onDelete={handleDeleteNode}
          onToggleComplete={handleToggleComplete}
          onAddAfter={() => initiateAddition("after")}
          onAddNewStep={() => initiateAddition("new_step")}
          onAddSubstep={() => initiateAddition("substep")}
          onUpdateContent={handleUpdateContent}
          onOpenChat={handleOpenNodeChat}
        />
      )}
      
      {/* Add Node Modal */}
      {addModalOpen && (
        <AddNodeModal 
          isOpen={addModalOpen}
          initialPosition={addModalPosition}
          onClose={() => { setAddModalOpen(false); setAdditionContext(null); }}
          onSubmit={handleAddNodeFromModal}
        />
      )}
      {nodeChatOpen && chatNodeId && (
        <ChatWindow 
          assignmentId={assignmentId}
          stepId={chatNodeId}
          onClose={closeNodeChat}
          onDeepDiveSuccess={fetchAssignmentData}
        />
      )}
      {/* Chat Window for assignment-level chat */}
      {chatVisible && (
        <div style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: '300px', zIndex: 2000 }}>
          {/* ChatWindow component should accept assignmentId and an onClose handler */}
          <ChatWindow 
            assignmentId={assignment.id}
            onClose={toggleChatWindow}
          />
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    flex: 1,
    height: '100vh',
    backgroundColor: '#f8fafc',
    fontFamily: "'Inter', sans-serif"
  },
  header: {
    padding: '24px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
  },
  titleGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  title: {
    margin: 0,
    color: '#0f172a',
    fontSize: '24px',
    fontWeight: 600
  },
  assignmentDeadline: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#64748b',
    fontSize: '14px'
  },
  controls: {
    display: 'flex',
    gap: '12px'
  },
  controlButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#2563eb'
    }
  },
  nodeContent: {
    position: 'relative',
    lineHeight: 1.4,
    fontSize: '14px'
  },
  deadline: {
    marginTop: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#64748b',
    fontSize: '12px'
  },
  completedBadge: {
    position: 'absolute',
    top: '-10px',
    right: '-10px',
    backgroundColor: '#34d399',
    color: 'white',
    borderRadius: '50%',
    padding: '4px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
  }
};

export default FlowchartView;
