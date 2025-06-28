// src/components/FlowchartView.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap,
  useNodesState, 
  useEdgesState,
  MarkerType,
  addEdge
} from 'react-flow-renderer';
import dagre from 'dagre';
import 'react-flow-renderer/dist/style.css';
import axios from 'axios';
import NodeEditorModal from './NodeEditorModal';
import AddNodeModal from './AddNodeModal';
import ChatWindow from './ChatWindow';
import { 
  updateNodePosition, 
  deleteNode, 
  updateNodeCompletion, 
  addNewNode,
  updateNodeContent,
  addConnection
} from '../services/api';
import { 
  FiPlus, 
  FiMessageSquare, 
  FiCheck, 
  FiCalendar, 
  FiRefreshCw,
  FiInfo,
  FiX,
  FiMousePointer,
  FiMove
} from 'react-icons/fi';

// Define node dimensions for layout
const NODE_WIDTH = 240;
const NODE_HEIGHT = 100;


// Define the keyframe animation for spinning
const spinKeyframe = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

// Insert the keyframe into the document
const style = document.createElement('style');
style.innerHTML = spinKeyframe;
document.head.appendChild(style);

function FlowchartView({ assignmentId }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [assignment, setAssignment] = useState(null);
  
  
  // Modal states for editing and adding nodes
  const [editorModalOpen, setEditorModalOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [additionContext, setAdditionContext] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalPosition, setAddModalPosition] = useState({ x: 0, y: 0 });

  // Chat window visibility state
  const [chatVisible, setChatVisible] = useState(false);
  const [nodeChatOpen, setNodeChatOpen] = useState(false);
  const [chatNodeId, setChatNodeId] = useState(null);
  
  // New states for enhanced functionality
  const [isResetting, setIsResetting] = useState(false);
  const [legendVisible, setLegendVisible] = useState(false);

  // Use React Query to fetch assignment data
  const { 
    data: assignmentData, 
    isLoading, 
    isError, 
    error, 
    refetch: refetchAssignment 
  } = useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: async () => {
      if (!assignmentId) return null;
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/assignments/${assignmentId}`);
      return response.data;
    },
    enabled: !!assignmentId,
  });

  // When assignmentData changes, update the assignment state
  useEffect(() => {
    if (assignmentData) {
      setAssignment(assignmentData);
      processFlowchartData(assignmentData);
    }
  }, [assignmentData]);

  useEffect(() => {
    // Check if there was an active chat when the page was last visited
    const activeChatStr = localStorage.getItem('activeChat');
    if (activeChatStr) {
      try {
        const activeChat = JSON.parse(activeChatStr);
        
        // Only restore chats for the current assignment
        if (activeChat.assignmentId === assignmentId) {
          if (activeChat.type === 'node' && activeChat.stepId) {
            // Restore node-specific chat
            setChatNodeId(activeChat.stepId);
            setNodeChatOpen(true);
            
            // Get the node data from local storage if available
            // If not, we'll look for it in the nodes after they're loaded
            const nodeDataStr = localStorage.getItem('activeChatNodeData');
            if (nodeDataStr) {
              try {
                const nodeData = JSON.parse(nodeDataStr);
                // We'll pass this to ChatWindow later
              } catch (error) {
                console.error("Error parsing node data from localStorage:", error);
              }
            }
          } else if (activeChat.type === 'assignment') {
            // Restore assignment-level chat
            setChatVisible(true);
          }
        }
      } catch (error) {
        console.error("Error parsing activeChat from localStorage:", error);
        localStorage.removeItem('activeChat');
      }
    }
  }, [assignmentId]);
  
  // Node styling function based on node type and completion status
  const nodeStyles = useCallback((node) => {
    const isMainStep = node.parent_id === null;
    const isCompleted = node.completed;
    
    // Base styles
    const baseStyle = {
      borderRadius: 'var(--border-radius-lg)',
      padding: '20px',
      boxShadow: 'var(--shadow-sm)',
      width: '240px',
      transition: 'all 0.3s ease',
      fontFamily: 'var(--font-family)'
    };
    
    // Styling based on node type and completion status
    if (isMainStep) {
      if (isCompleted) {
        // Completed main step
        return {
          ...baseStyle,
          background: 'var(--accent-100)',
          border: '2px solid var(--success)',
          color: 'var(--neutral-800)',
          opacity: 0.9,
        };
      } else {
        // Incomplete main step
        return {
          ...baseStyle,
          background: 'white',
          border: '2px solid var(--primary-600)',
          color: 'var(--neutral-900)',
        };
      }
    } else {
      if (isCompleted) {
        // Completed substep
        return {
          ...baseStyle,
          background: 'var(--accent-100)',
          border: '2px solid var(--success)',
          color: 'var(--neutral-800)',
          opacity: 0.9,
        };
      } else {
        // Incomplete substep
        return {
          ...baseStyle,
          background: '#F5F3FF', // Light purple
          border: '2px solid #8B5CF6', // Purple
          color: '#4C1D95', // Dark purple
        };
      }
    }
  }, []);

  // Edge styling function based on connection type
  const getEdgeStyle = useCallback((params) => {
    const sourceId = params.source;
    const targetId = params.target;
    
    // Find source and target nodes from current nodes state
    const sourceNode = nodes.find(n => n.id === sourceId)?.data;
    const targetNode = nodes.find(n => n.id === targetId)?.data;
    
    if (!sourceNode || !targetNode) {
      return {
        stroke: 'var(--neutral-300)',
        strokeWidth: 2,
        opacity: 0.6
      };
    }
    
    const fromId = parseInt(sourceId.replace("step-", ""), 10);
    
    if (sourceNode.parent_id === null && targetNode.parent_id === null) {
      // Main step to main step - thicker, darker line
      return {
        stroke: 'var(--neutral-700)', // Darker neutral color
        strokeWidth: 3,
        opacity: 0.8
      };
    } else if (sourceNode.parent_id === null && targetNode.parent_id === fromId) {
      // Main step to its substep - MUCH more visible purple
      return {
        stroke: '#7C3AED', // Vivid purple (Indigo-600)
        strokeWidth: 2.5,  // Slightly thicker
        opacity: 0.9,      // More opaque
        strokeDasharray: '0'  // Solid line
      };
    } else if (sourceNode.parent_id !== null && targetNode.parent_id !== null) {
      // Substep to substep - distinctive dashed lighter purple
      return {
        stroke: '#A78BFA', // Light purple
        strokeWidth: 2,
        opacity: 0.7,
        strokeDasharray: '5, 5' // Dashed line pattern
      };
    }
    
    // Default
    return {
      stroke: 'var(--neutral-300)',
      strokeWidth: 2,
      opacity: 0.6
    };
  }, [nodes]);

  // Process data into nodes and edges with enhanced styling
  const processFlowchartData = useCallback(data => {
    if (!data?.steps) return;
    
    // 1. Create nodes first with proper content/label
    const flowNodes = data.steps.map(step => ({
      id: `step-${step.id}`,
      type: 'default',
      position: { x: step.position_x, y: step.position_y },
      data: { 
        ...step,
        // Include the label here
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
      style: nodeStyles(step)
    }));
  
    // 2. Create a nodeMap for quick reference when styling edges
    const nodeMap = {};
    data.steps.forEach(step => {
      nodeMap[`step-${step.id}`] = step;
    });
  
    // 3. Create edges with enhanced styling based on nodeMap
    const flowEdges = data.connections.map(conn => {
      const edgeId = `edge-${conn.from_step}-${conn.to_step}`;
      const sourceId = `step-${conn.from_step}`;
      const targetId = `step-${conn.to_step}`;
      
      // Get source and target node data directly from our map
      const sourceNode = nodeMap[sourceId];
      const targetNode = nodeMap[targetId];
      
      // Determine edge style based on node relationship
      let edgeStyle = {
        stroke: 'var(--neutral-300)', // Default color
        strokeWidth: 2,
        opacity: 0.6
      };
      
      if (sourceNode && targetNode) {
        const fromId = parseInt(sourceId.replace("step-", ""), 10);
        
        if (sourceNode.parent_id === null && targetNode.parent_id === null) {
          // Main step to main step - thicker, darker line
          edgeStyle = {
            stroke: 'var(--neutral-700)', // Darker neutral color
            strokeWidth: 3,
            opacity: 0.8
          };
        } else if (sourceNode.parent_id === null && targetNode.parent_id === fromId) {
          // Main step to its substep - MUCH more visible purple
          edgeStyle = {
            stroke: '#7C3AED', // Vivid purple (Indigo-600)
            strokeWidth: 2.5,  // Slightly thicker
            opacity: 0.9,      // More opaque
            strokeDasharray: '0'  // Solid line
          };
        } else if (sourceNode.parent_id !== null && targetNode.parent_id !== null) {
          // Substep to substep - distinctive dashed lighter purple
          edgeStyle = {
            stroke: '#A78BFA', // Light purple
            strokeWidth: 2,
            opacity: 0.7,
            strokeDasharray: '5, 5' // Dashed line pattern
          };
        }
      }
      
      return {
        id: edgeId,
        source: sourceId,
        target: targetId,
        type: 'smoothstep',
        animated: sourceNode?.parent_id === null && targetNode?.parent_id === null, // Only animate main-to-main
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edgeStyle.stroke // Match arrow color to line color
        },
        style: edgeStyle
      };
    });
  
    // 4. Set both states at once
    setNodes(flowNodes);
    setEdges(flowEdges);
    
  }, [nodeStyles]);

  // Enhanced reset layout function with improved hierarchy handling
  // Improved Reset Layout Function
  const resetLayout = useCallback(async () => {
    if (!nodes.length) return;
    console.log("Reset layout starting with", nodes.length, "nodes");
  
    setIsResetting(true);
    
    try {
      // Build node maps and hierarchies
      const mainNodeMap = {}; // ID -> node
      const nodesByParentId = {}; // parentId -> [nodes]
      const allNodeMap = {}; // ID -> node (for all nodes)
      
      // Track all node IDs for processing
      nodes.forEach(node => {
        const nodeId = parseInt(node.id.replace("step-", ""), 10);
        allNodeMap[nodeId] = node;
        
        if (node.data.parent_id === null) {
          // Main node
          mainNodeMap[nodeId] = node;
        } else {
          // Substep - group by parent
          const parentId = node.data.parent_id;
          if (!nodesByParentId[parentId]) {
            nodesByParentId[parentId] = [];
          }
          nodesByParentId[parentId].push(node);
        }
      });
      
      // Build connection map
      const outgoingConnections = {}; // nodeId -> [targetIds]
      
      edges.forEach(edge => {
        const sourceId = parseInt(edge.source.replace("step-", ""), 10);
        const targetId = parseInt(edge.target.replace("step-", ""), 10);
        
        if (!outgoingConnections[sourceId]) {
          outgoingConnections[sourceId] = [];
        }
        outgoingConnections[sourceId].push(targetId);
      });
      
      // Position constants - improved spacing
      const MAIN_START_X = 150;            // Increased from 100
      const MAIN_START_Y = 150;            // Increased from 100
      const MAIN_HORIZONTAL_GAP = 400;     // Increased from 300
      const SUBSTEP_VERTICAL_GAP = 200;    // Increased from 150
      const DEEPDIVE_HORIZONTAL_OFFSET = 160; // Increased from 120
      const SUBSTEP_HORIZONTAL_OFFSET = 120;   // Increased from 20
      
      // Calculate positions for all nodes
      const newPositions = {}; // nodeId -> {x, y}
      
      // Sort main nodes left-to-right by position
      const mainNodeIds = Object.keys(mainNodeMap).map(id => parseInt(id, 10));
      mainNodeIds.sort((a, b) => {
        const nodeA = allNodeMap[a];
        const nodeB = allNodeMap[b];
        return nodeA.position.x - nodeB.position.x;
      });
      
      // Position main nodes first
      let currentX = MAIN_START_X;
      
      mainNodeIds.forEach(mainId => {
        const mainNode = allNodeMap[mainId];
        
        // Set main node position
        newPositions[`step-${mainId}`] = { x: currentX, y: MAIN_START_Y };
        
        // Position substeps of this main node
        if (nodesByParentId[mainId] && nodesByParentId[mainId].length > 0) {
          const substeps = nodesByParentId[mainId];
          
          // Sort substeps by their current Y positions
          substeps.sort((a, b) => a.position.y - b.position.y);
          
          // Process each substep
          substeps.forEach((substep, index) => {
            const substepId = parseInt(substep.id.replace("step-", ""), 10);
            
            // Check if this is the first substep and has its own substeps (deep dive check)
            const isFirstSubstep = index === 0;
            const hasOwnSubsteps = nodesByParentId[substepId] && nodesByParentId[substepId].length > 0;
            
            // KEY FIX: For first substeps of main nodes, always position below
            // This ensures regular first substeps stay below parent, not to the right
            if (isFirstSubstep && hasOwnSubsteps && mainNode.data.parent_id !== null) {
              // This is a deep dive node from a substep - position to the right
              // Only move it right if the parent is NOT a main node
              const deepDiveX = currentX + DEEPDIVE_HORIZONTAL_OFFSET;
              const deepDiveY = MAIN_START_Y; // Same Y as parent
              
              newPositions[substep.id] = { x: deepDiveX, y: deepDiveY };
              
              // Recursively position all substeps of this deep dive
              positionSubtreeWithOffset(substepId, deepDiveX, deepDiveY);
            } else {
              // Regular substep - position below
              const substepX = currentX + SUBSTEP_HORIZONTAL_OFFSET;
              const substepY = MAIN_START_Y + NODE_HEIGHT + (index * SUBSTEP_VERTICAL_GAP);
              
              newPositions[substep.id] = { x: substepX, y: substepY };
              
              // Recursively position any substeps of this substep
              positionSubtreeWithOffset(substepId, substepX, substepY);
            }
          });
          
          // If first substep was a deep dive, leave more space for the next main node
          if (substeps.length > 0 && nodesByParentId[parseInt(substeps[0].id.replace("step-", ""), 10)]) {
            currentX += MAIN_HORIZONTAL_GAP + DEEPDIVE_HORIZONTAL_OFFSET/2;
          } else {
            currentX += MAIN_HORIZONTAL_GAP;
          }
        } else {
          // No substeps for this main node
          currentX += MAIN_HORIZONTAL_GAP;
        }
      });
      
      // Recursive function to position a subtree
      function positionSubtreeWithOffset(nodeId, parentX, parentY) {
        const substeps = nodesByParentId[nodeId] || [];
        if (substeps.length === 0) return;
        
        // Sort substeps by Y position
        substeps.sort((a, b) => a.position.y - b.position.y);
        
        // Check if first substep has its own substeps (deep dive)
        const firstSubstep = substeps[0];
        const firstSubstepId = parseInt(firstSubstep.id.replace("step-", ""), 10);
        const hasOwnSubsteps = nodesByParentId[firstSubstepId] && nodesByParentId[firstSubstepId].length > 0;
        
        if (hasOwnSubsteps) {
          // First substep is a deep dive node - position to the right
          const deepDiveX = parentX + DEEPDIVE_HORIZONTAL_OFFSET;
          const deepDiveY = parentY; // Same Y as parent
          
          newPositions[firstSubstep.id] = { x: deepDiveX, y: deepDiveY };
          
          // Process its children recursively
          positionSubtreeWithOffset(firstSubstepId, deepDiveX, deepDiveY);
          
          // Position remaining substeps below parent
          for (let i = 1; i < substeps.length; i++) {
            const substep = substeps[i];
            const substepId = parseInt(substep.id.replace("step-", ""), 10);
            
            newPositions[substep.id] = { 
              x: parentX + SUBSTEP_HORIZONTAL_OFFSET,
              y: parentY + (i * SUBSTEP_VERTICAL_GAP)
            };
            
            // Process any children of this substep
            positionSubtreeWithOffset(substepId, parentX + SUBSTEP_HORIZONTAL_OFFSET, parentY + (i * SUBSTEP_VERTICAL_GAP));
          }
        } else {
          // Regular substeps - all positioned below
          substeps.forEach((substep, index) => {
            const substepId = parseInt(substep.id.replace("step-", ""), 10);
            
            newPositions[substep.id] = { 
              x: parentX + SUBSTEP_HORIZONTAL_OFFSET,
              y: parentY + ((index + 1) * SUBSTEP_VERTICAL_GAP)
            };
            
            // Process any children of this substep
            positionSubtreeWithOffset(substepId, parentX + SUBSTEP_HORIZONTAL_OFFSET, parentY + ((index + 1) * SUBSTEP_VERTICAL_GAP));
          });
        }
      }
      
      // Apply the new positions to nodes
      const updatedNodes = nodes.map(node => ({
        ...node,
        position: newPositions[node.id] || node.position
      }));
      
      setNodes(updatedNodes);
      
      // Save positions to backend
      await Promise.all(
        updatedNodes.map(node => {
          const id = parseInt(node.id.replace("step-", ""), 10);
          const position = newPositions[node.id] || node.position;
          return updateNodePosition(id, position.x, position.y);
        })
      );
      
      console.log("Reset layout completed successfully");
    } catch (err) {
      console.error("Error in reset layout:", err);
    } finally {
      setTimeout(() => setIsResetting(false), 300);
    }
  }, [nodes, edges, setNodes]);
  
  // 3. Helper functions for sorting nodes
  
  // Sort substeps based on connections
  function sortSubsteps(parentId, substeps, connections) {
    // If only one substep, no sorting needed
    if (substeps.length <= 1) return substeps;
    
    // Extract numeric IDs
    const substepIds = substeps.map(node => 
      parseInt(node.id.replace("step-", ""), 10));
    
    // Try to sort based on connections
    const visited = new Set();
    const result = [];
    
    // Start with nodes that have no incoming connections from siblings
    const hasIncoming = new Set();
    
    // Find nodes with incoming connections
    substepIds.forEach(id => {
      Object.entries(connections).forEach(([sourceId, targets]) => {
        sourceId = parseInt(sourceId, 10);
        // Only consider connections from nodes in this group
        if (substepIds.includes(sourceId) && targets.includes(id)) {
          hasIncoming.add(id);
        }
      });
    });
    
    // Start with nodes that have no incoming connections
    const starts = substepIds.filter(id => !hasIncoming.has(id));
    
    // Process nodes in order
    const processNode = (id) => {
      if (visited.has(id)) return;
      visited.add(id);
      
      // Add to result
      result.push(id);
      
      // Process outgoing connections
      const targets = connections[id] || [];
      targets.forEach(targetId => {
        if (substepIds.includes(targetId) && !visited.has(targetId)) {
          processNode(targetId);
        }
      });
    };
    
    // Process all starting nodes
    starts.forEach(processNode);
    
    // Add any remaining nodes (in case of cycles or disconnected nodes)
    substepIds.forEach(id => {
      if (!visited.has(id)) {
        result.push(id);
      }
    });
    
    // Map back to node objects
    return result.map(id => 
      substeps.find(node => parseInt(node.id.replace("step-", ""), 10) === id)
    );
  }
  
  // Topological sort for main nodes
  function topologicalSortNodes(nodeIds, connections) {
    // Track visited nodes
    const visited = new Set();
    const temp = new Set(); // For cycle detection
    const result = [];
    
    // DFS for topological sort
    function dfs(nodeId) {
      if (visited.has(nodeId)) return;
      if (temp.has(nodeId)) return; // Cycle detected
      
      temp.add(nodeId);
      
      // Process outgoing connections
      const targets = connections[nodeId] || [];
      targets.forEach(targetId => {
        if (nodeIds.includes(targetId) && !visited.has(targetId)) {
          dfs(targetId);
        }
      });
      
      // Mark as visited and add to result
      temp.delete(nodeId);
      visited.add(nodeId);
      result.unshift(nodeId); // Add to front for reverse topological order
    }
    
    // Process all nodes
    nodeIds.forEach(nodeId => {
      if (!visited.has(nodeId)) {
        dfs(nodeId);
      }
    });
    
    // If not all nodes were reached (disconnected components), add them at the end
    nodeIds.forEach(nodeId => {
      if (!visited.has(nodeId)) {
        result.unshift(nodeId);
      }
    });
    
    return result;
  }
  

  // Memoize event handlers to prevent unnecessary re-renders
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

  const onPaneDoubleClick = useCallback(event => {
    event.preventDefault();
    const bounds = event.target.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    setAddModalPosition({ x, y });
    setAdditionContext({ insertionType: "random", referenceNodeId: null });
    setAddModalOpen(true);
  }, []);

  const handleAddNodeButton = useCallback(() => {
    setAddModalPosition({ x: 200, y: 200 });
    setAdditionContext({ insertionType: "random", referenceNodeId: null });
    setAddModalOpen(true);
  }, []);

  const handleEditorClose = useCallback(() => {
    setEditorModalOpen(false);
    setSelectedNode(null);
  }, []);

  const handleUpdateContent = useCallback(async (newContent) => {
    if (!selectedNode) return;
    const id = parseInt(selectedNode.id.replace("step-", ""), 10);
    try {
      await updateNodeContent(id, newContent);
      handleEditorClose();
      refetchAssignment();
    } catch (err) {
      console.error("Error updating node content", err);
    }
  }, [selectedNode, handleEditorClose, refetchAssignment]);

  const handleDeleteNode = useCallback(async () => {
    if (!selectedNode) return;
    const id = parseInt(selectedNode.id.replace("step-", ""), 10);
    try {
      await deleteNode(id);
      handleEditorClose();
      refetchAssignment();
    } catch (err) {
      console.error("Error deleting node", err);
    }
  }, [selectedNode, handleEditorClose, refetchAssignment]);

  const handleToggleComplete = useCallback(async () => {
    if (!selectedNode) return;
    const id = parseInt(selectedNode.id.replace("step-", ""), 10);
    try {
      const newStatus = !selectedNode.data.completed;
      await updateNodeCompletion(id, newStatus);
      handleEditorClose();
      refetchAssignment();
    } catch (err) {
      console.error("Error toggling node completion", err);
    }
  }, [selectedNode, handleEditorClose, refetchAssignment]);

  // Function to set addition context based on the mode and open the AddNodeModal
  const initiateAddition = useCallback((mode) => {
    if (!selectedNode) return;
    const refId = selectedNode.id.replace("step-", "");
    let pos = { x: selectedNode.position.x, y: selectedNode.position.y };
    if (mode === "new_step") {
      // For main step insertion: new main step to the right
      pos = { x: selectedNode.position.x + 150, y: selectedNode.position.y };
      setAdditionContext({ insertionType: "new_step", referenceNodeId: refId });
    } else if (mode === "after") {
      // For "after": if current node is a parent, treat as adding a substep (first in list); otherwise, sibling
      if (selectedNode.data.parent_id === null) {
        pos = { x: selectedNode.position.x, y: selectedNode.position.y + 50 };
        setAdditionContext({ insertionType: "after", referenceNodeId: refId });
      } else {
        pos = { x: selectedNode.position.x, y: selectedNode.position.y + 50 };
        setAdditionContext({ insertionType: "after", referenceNodeId: refId });
      }
    } else if (mode === "substep") {
      // For child insertion
      pos = { x: selectedNode.position.x + 150, y: selectedNode.position.y };
      setAdditionContext({ insertionType: "substep", referenceNodeId: refId });
    }
    setEditorModalOpen(false);
    setAddModalPosition(pos);
    setAddModalOpen(true);
  }, [selectedNode]);

  const handleAddNodeFromModal = useCallback(async ({ content, position }) => {
    try {
      await addNewNode(
        assignmentId,
        content,
        additionContext?.referenceNodeId,
        position.x,
        position.y,
        additionContext?.insertionType
      );
      setAddModalOpen(false);
      setAdditionContext(null);
      refetchAssignment();
    } catch (err) {
      console.error("Error adding node from modal", err);
    }
  }, [assignmentId, additionContext, refetchAssignment]);

  // Toggle chat window visibility (assignment-level chat)
  const toggleChatWindow = useCallback(() => {
    const newVisibility = !chatVisible;
    setChatVisible(newVisibility);
    
    if (newVisibility) {
      // If opening the chat, save to localStorage
      localStorage.setItem('activeChat', JSON.stringify({
        type: 'assignment',
        assignmentId
      }));
    } else {
      // If closing the chat, remove from localStorage
      localStorage.removeItem('activeChat');
    }
  }, [chatVisible, assignmentId]);

  const handleOpenNodeChat = useCallback(() => {
    // Open the node-specific chat for the currently selected node
    if (selectedNode) {
      const nodeId = selectedNode.id.replace("step-", "");
      setChatNodeId(nodeId);
      // Store node data for context display
      localStorage.setItem('activeChatNodeData', JSON.stringify(selectedNode.data));
      setNodeChatOpen(true);
      // Optionally close the editor modal
      setEditorModalOpen(false);
    }
  }, [selectedNode]);

  const closeNodeChat = useCallback(() => {
    setNodeChatOpen(false);
    setChatNodeId(null);
    localStorage.removeItem('activeChat');
    localStorage.removeItem('activeChatNodeData');
  }, []);

  // Improved handler for Deep Dive success
  // Improved handler for Deep Dive success with data refresh but no auto-reset
const handleDeepDiveSuccess = useCallback(() => {
  console.log("Deep dive completed, refreshing data...");
  
  // First, show a simple loading indicator if you want
  const loadingToast = document.createElement('div');
  loadingToast.style.position = 'fixed';
  loadingToast.style.bottom = '20px';
  loadingToast.style.right = '20px';
  loadingToast.style.backgroundColor = '#3b82f6';
  loadingToast.style.color = 'white';
  loadingToast.style.padding = '10px 20px';
  loadingToast.style.borderRadius = '4px';
  loadingToast.style.zIndex = '9999';
  loadingToast.textContent = 'Refreshing flowchart data...';
  document.body.appendChild(loadingToast);
  
  // Make direct API call with cache-busting parameter
  axios.get(`${import.meta.env.VITE_BACKEND_URL}/assignments/${assignmentId}?nocache=${Date.now()}`, {
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  })
  .then(response => {
    const freshData = response.data;
    console.log("Retrieved fresh data with", freshData.steps.length, "nodes");
    
    // Important: Force UI update with fresh data without resetting layout
    setAssignment(freshData);
    
    // Process the nodes and edges with this fresh data, but don't reset layout
    processFlowchartData(freshData);
    
    // Show success message
    if (loadingToast) {
      loadingToast.style.backgroundColor = '#10b981';
      loadingToast.textContent = 'Deep dive completed! Use Reset Layout if needed.';
      setTimeout(() => document.body.removeChild(loadingToast), 3000);
    }
  })
  .catch(error => {
    console.error("Error in deep dive fresh data fetch:", error);
    // Fallback to regular refetch
    refetchAssignment();
    
    if (loadingToast) {
      loadingToast.style.backgroundColor = '#ef4444';
      loadingToast.textContent = 'Error refreshing data. Please try again.';
      setTimeout(() => document.body.removeChild(loadingToast), 3000);
    }
  });
}, [assignmentId, processFlowchartData, refetchAssignment]);

  // Handle connecting nodes manually
  const onConnect = useCallback(async (params) => {
    // Extract the node IDs from the source and target
    const sourceId = parseInt(params.source.replace("step-", ""), 10);
    const targetId = parseInt(params.target.replace("step-", ""), 10);
  
    try {
      // Update the backend
      await addConnection(assignmentId, sourceId, targetId);
      
      // Get the edge style
      const edgeStyle = getEdgeStyle(params);
      
      // Update the frontend with proper styling
      setEdges((eds) => 
        addEdge(
          {
            ...params,
            id: `edge-${sourceId}-${targetId}`,
            type: 'smoothstep',
            // Only animate main-to-main connections
            animated: nodes.find(n => n.id === params.source)?.data?.parent_id === null && 
                     nodes.find(n => n.id === params.target)?.data?.parent_id === null,
            style: edgeStyle,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: edgeStyle.stroke // Match arrow color to line color
            }
          }, 
          eds
        )
      );
      
      console.log(`Created connection from ${sourceId} to ${targetId}`);
    } catch (err) {
      console.error("Error creating connection", err);
    }
  }, [assignmentId, setEdges, getEdgeStyle, nodes]);

  // Toggle legend visibility
  const toggleLegendVisibility = useCallback(() => {
    setLegendVisible(prev => !prev);
  }, []);
  
  // FlowchartLegend component
  const FlowchartLegend = () => {
    if (!legendVisible) {
      return (
        <button 
          style={styles.legendToggle}
          onClick={toggleLegendVisibility}
        >
          <FiInfo size={18} />
          Show Legend
        </button>
      );
    }
    
    return (
      <div style={styles.legendContainer}>
        <div style={styles.legendHeader}>
          <h3 style={styles.legendTitle}>Flowchart Legend</h3>
          <button 
            style={styles.legendCloseButton}
            onClick={toggleLegendVisibility}
          >
            <FiX size={16} />
          </button>
        </div>
        
        <div style={styles.legendSection}>
          <h4 style={styles.legendSectionTitle}>Node Types</h4>
          <div style={styles.legendItem}>
            <div style={styles.legendSwatch}>
              <div style={{
                width: 40,
                height: 24, 
                background: '#ffffff',
                border: '2px solid #3b82f6',
                borderRadius: 6
              }}></div>
            </div>
            <span style={styles.legendText}>Main Step</span>
          </div>
          <div style={styles.legendItem}>
            <div style={styles.legendSwatch}>
              <div style={{
                width: 40,
                height: 24, 
                background: '#f5f3ff',
                border: '2px solid #8b5cf6',
                borderRadius: 6
              }}></div>
            </div>
            <span style={styles.legendText}>Substep</span>
          </div>
          <div style={styles.legendItem}>
            <div style={styles.legendSwatch}>
              <div style={{
                width: 40,
                height: 24, 
                background: '#f0fdf4',
                border: '2px solid #34d399',
                borderRadius: 6
              }}></div>
            </div>
            <span style={styles.legendText}>Completed Step</span>
          </div>
        </div>
        
        <div style={styles.legendSection}>
          <h4 style={styles.legendSectionTitle}>Connection Types</h4>
          <div style={styles.legendItem}>
            <div style={styles.legendSwatch}>
              <div style={{
                width: 40,
                height: 3, 
                background: 'var(--neutral-700)',
              }}></div>
            </div>
            <span style={styles.legendText}>Main Step Connection</span>
          </div>
          <div style={styles.legendItem}>
            <div style={styles.legendSwatch}>
              <div style={{
                width: 40,
                height: 2.5, 
                background: '#7C3AED', // Vivid purple
              }}></div>
            </div>
            <span style={styles.legendText}>Parent to Substep</span>
          </div>
          <div style={styles.legendItem}>
            <div style={styles.legendSwatch}>
              <div style={{
                width: 40,
                height: 2, 
                background: '#A78BFA', // Light purple
                borderTop: '1px dashed #A78BFA', // Show dashed style
              }}></div>
            </div>
            <span style={styles.legendText}>Substep Connection</span>
          </div>
        </div>
        
        <div style={styles.legendTips}>
          <p style={styles.legendTip}>
            <FiMousePointer size={14} /> Double-click a node to edit
          </p>
          <p style={styles.legendTip}>
            <FiMove size={14} /> Drag nodes to reposition
          </p>
          <p style={styles.legendTip}>
            <FiPlus size={14} /> Double-click a node to add a new step
          </p>
        </div>
      </div>
    );
  };

  if (isLoading) return <div className="loading">Loading assignment flowchart...</div>;
  if (isError) return <div className="error">{error?.message || 'An error occurred'}</div>;
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
          <button 
            style={{
              ...styles.controlButton,
              opacity: isResetting ? 0.7 : 1,
              cursor: isResetting ? 'wait' : 'pointer'
            }}
            onClick={resetLayout}
            disabled={isResetting}
          >
            <FiRefreshCw 
              size={18} 
              style={{ animation: isResetting ? 'spin 1s linear infinite' : 'none' }} 
            />
            {isResetting ? 'Resetting...' : 'Reset Layout'}
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
        onConnect={onConnect}
        fitView
        zoomOnDoubleClick={false}
        connectionLineStyle={{ stroke: '#3b82f6', strokeWidth: 2 }}
        connectionLineType="smoothstep"
        snapToGrid={true}
        snapGrid={[20, 20]}
      >
        <Background 
          color="#e2e8f0" 
          gap={20}
          size={1}
          variant="dots"
          style={{ backgroundColor: '#f8fafc' }}
        />
        <Controls style={{ bottom: 40, right: 20 }} />
        <MiniMap 
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}
          nodeColor={(n) => {
            const node = nodes.find(node => node.id === n.id);
            if (!node || !node.data) return '#fff';
            
            if (node.data.completed) return '#34d399'; // Green for completed
            if (node.data.parent_id === null) return '#3b82f6'; // Blue for main steps
            return '#8b5cf6'; // Purple for substeps
          }}
          maskColor="rgba(240, 240, 250, 0.4)"
        />
      </ReactFlow>
      
      {/* Legend Component */}
      <FlowchartLegend />
      
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
          style={{ animation: 'slideInUp 0.3s ease' }}
        />
      )}
      
      {/* Add Node Modal */}
      {addModalOpen && (
        <AddNodeModal 
          isOpen={addModalOpen}
          initialPosition={addModalPosition}
          onClose={() => { setAddModalOpen(false); setAdditionContext(null); }}
          onSubmit={handleAddNodeFromModal}
          style={{ animation: 'slideInUp 0.3s ease' }}
        />
      )}

      {/* Node-specific Chat Window */}
      {nodeChatOpen && chatNodeId && (
        <ChatWindow 
          assignmentId={assignmentId}
          stepId={chatNodeId}
          onClose={closeNodeChat}
          onDeepDiveSuccess={handleDeepDiveSuccess}
          nodeData={
            // Try to find current node data first
            nodes.find(node => node.id === `step-${chatNodeId}`)?.data ||
            // Fall back to stored data if node not found yet
            JSON.parse(localStorage.getItem('activeChatNodeData') || 'null')
          }
        />
      )}

      {/* Assignment-level Chat Window */}
      {chatVisible && (
        <div style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: '300px', zIndex: 2000 }}>
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
    backgroundColor: 'var(--neutral-50)',
    fontFamily: 'var(--font-family)'
  },
  header: {
    padding: '24px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    boxShadow: 'var(--shadow-sm)'
  },
  titleGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  title: {
    margin: 0,
    color: 'var(--neutral-900)',
    fontSize: '24px',
    fontWeight: 600
  },
  assignmentDeadline: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: 'var(--neutral-500)',
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
    backgroundColor: 'var(--primary-600)',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--border-radius-md)',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: 'var(--primary-700)'
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
    color: 'var(--neutral-500)',
    fontSize: '12px'
  },
  completedBadge: {
    position: 'absolute',
    top: '-10px',
    right: '-10px',
    backgroundColor: 'var(--success)',
    color: 'white',
    borderRadius: '50%',
    padding: '4px',
    boxShadow: 'var(--shadow-sm)'
  },
  // Legend styles
  legendToggle: {
    position: 'absolute',
    top: 100,
    right: 20,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    backgroundColor: 'white',
    color: 'var(--primary-600)',
    border: '1px solid var(--neutral-200)',
    borderRadius: 'var(--border-radius-md)',
    boxShadow: 'var(--shadow-sm)',
    cursor: 'pointer',
    zIndex: 10,
    fontSize: '14px',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: 'var(--primary-50)',
      borderColor: 'var(--primary-200)'
    }
  },
  legendContainer: {
    position: 'absolute',
    top: 100,
    right: 20,
    width: 280,
    backgroundColor: 'white',
    borderRadius: 'var(--border-radius-lg)',
    boxShadow: 'var(--shadow-md)',
    zIndex: 10,
    padding: '16px',
    border: '1px solid var(--neutral-200)',
    animation: 'fadeIn 0.3s ease'
  },
  legendHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  legendTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--neutral-900)'
  },
  legendCloseButton: {
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
  legendSection: {
    marginBottom: '16px'
  },
  legendSectionTitle: {
    margin: '0 0 8px 0',
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--neutral-700)'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '8px'
  },
  legendSwatch: {
    width: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '12px'
  },
  legendText: {
    fontSize: '14px',
    color: 'var(--neutral-700)'
  },
  legendTips: {
    borderTop: '1px solid var(--neutral-200)',
    paddingTop: '12px',
    marginTop: '4px'
  },
  legendTip: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    margin: '4px 0',
    fontSize: '13px',
    color: 'var(--neutral-500)'
  }
};

export default FlowchartView;