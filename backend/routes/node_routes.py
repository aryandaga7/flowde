# node_routes.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
from models.models import Step, Assignment, User, Connection
from core.database import SessionLocal
from auth.auth_dependencies import get_current_user

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ---------------------------
# Update Node Position (unchanged)
# ---------------------------
class NodePositionUpdate(BaseModel):
    position_x: float
    position_y: float

@router.put("/steps/{node_id}/position")
def update_node_position(
    node_id: int,
    update: NodePositionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    node = db.query(Step).filter(Step.id == node_id).first()
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    if node.assignment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this node")
    
    node.position_x = update.position_x
    node.position_y = update.position_y
    db.commit()
    return {"message": "Node position updated successfully"}

# ---------------------------
# Delete a Node with Refined Connection Re-wiring
# ---------------------------
@router.delete("/steps/{node_id}")
def delete_node(
    node_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Retrieve the node to delete.
    node = db.query(Step).filter(Step.id == node_id).first()
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    if node.assignment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this node")
    
    # For substeps (node with a parent), use the connection table to rewire:
    if node.parent_id is not None:
        # Filter incoming connection: from a node that is either a main step or a sibling.
        incoming_conn = (
            db.query(Connection)
            .join(Step, Connection.from_step == Step.id)
            .filter(
                Connection.to_step == node_id,
                ((Step.parent_id == node.parent_id) | (Step.parent_id.is_(None)))
            )
            .first()
        )
        # Filter outgoing connection: to a node that is a sibling (i.e. has same parent as the deleted node).
        outgoing_conn = (
            db.query(Connection)
            .join(Step, Connection.to_step == Step.id)
            .filter(
                Connection.from_step == node_id,
                Step.parent_id == node.parent_id
            )
            .first()
        )
        # Filter outgoing subset connection: connection from node to a child (substep)
        outgoing_subset_conn = (
            db.query(Connection)
            .join(Step, Connection.to_step == Step.id)
            .filter(
                Connection.from_step == node_id,
                Step.parent_id == node_id
            )
            .first()
        )
        children: List[Step] = db.query(Step).filter(Step.parent_id == node.id).all()
        
        # Re-wire sibling connection if both incoming and outgoing exist.
        if incoming_conn and outgoing_conn:
            db.add(Connection(
                assignment_id=node.assignment_id,
                from_step=incoming_conn.from_step,
                to_step=outgoing_conn.to_step
            ))
        
        # Handle subset promotion if there is an outgoing subset connection.
        if outgoing_subset_conn:
            # Assume we promote the first substep (target of outgoing_subset_conn).
            promoted_id = outgoing_subset_conn.to_step
            promoted_node = db.query(Step).filter(Step.id == promoted_id).first()
            for child in children:
                if child == promoted_node:
                    promoted_node.parent_id = None
                else:
                    child.parent_id = promoted_id
            db.commit()
    else:
        # Node is a parent (main step)
        # Query all children of this parent.
        children: List[Step] = db.query(Step).filter(Step.parent_id == node.id).order_by(Step.position_y).all()
        if children:
            # Promote the first child to become the new parent.
            promoted = children[0]
            promoted.parent_id = None  # Now a main step.
            # Update incoming connections that pointed to the deleted node,
            # but only if their source is not already the promoted node.
            incoming_conns = db.query(Connection).filter(
                Connection.to_step == node_id,
                Connection.from_step != promoted.id
            ).all()
            for conn in incoming_conns:
                conn.to_step = promoted.id
            # Update outgoing connections that originated from the deleted node,
            # but only if their target is not already the promoted node.
            outgoing_conns = db.query(Connection).filter(
                Connection.from_step == node_id,
                Connection.to_step != promoted.id
            ).all()
            for conn in outgoing_conns:
                conn.from_step = promoted.id
            # For the rest of the children, update their parent_id to the promoted node.
            for child in children[1:]:
                child.parent_id = promoted.id
            db.commit()
        else:
            incoming_conn = db.query(Connection).filter(Connection.to_step == node_id).first()
            outgoing_conn = db.query(Connection).filter(Connection.from_step == node_id).first()
            if incoming_conn and outgoing_conn:
                # Bridge the gap by connecting the source of the incoming to the target of the outgoing.
                db.add(Connection(
                    assignment_id=node.assignment_id,
                    from_step=incoming_conn.from_step,
                    to_step=outgoing_conn.to_step
                ))

    
    # Remove all connections that directly reference the deleted node.
    conns_to_delete: List[Connection] = db.query(Connection).filter(
        (Connection.from_step == node_id) | (Connection.to_step == node_id)
    ).all()
    for conn in conns_to_delete:
        db.delete(conn)
    
    # Finally, delete the node.
    db.delete(node)
    db.commit()
    return {"message": "Node deleted successfully and connections re-wired"}

# ---------------------------
# Update Node Completion Status (unchanged)
# ---------------------------
class NodeCompletionUpdate(BaseModel):
    completed: bool

@router.patch("/steps/{node_id}/completion")
def update_node_completion(
    node_id: int,
    update: NodeCompletionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    node = db.query(Step).filter(Step.id == node_id).first()
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    if node.assignment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this node")
    
    node.completed = update.completed
    db.commit()
    return {"message": "Node completion status updated successfully"}

# ---------------------------
# Add a New Node with Enhanced Insertion Options and Connection Re-wiring
# ---------------------------
# Insertion types:
#   - "new_step": Add a new main step to the right of a parent node.
#                If the reference parent already has children (via an outgoing connection),
#                the new node becomes the new first substep.
#   - "after": Insert as a sibling immediately after the reference node (for substeps).
#   - "substep": Insert as a child of the reference node.
# node_routes.py

class NewNode(BaseModel):
    assignment_id: int
    content: str
    reference_node_id: Optional[int] = None  # Required for non-random insertions.
    position_x: Optional[float] = None       # If not provided, defaults will be computed.
    position_y: Optional[float] = None
    insertion_type: Optional[str] = None     # "new_step", "after", or "substep"

@router.post("/steps", response_model=NewNode)
def add_new_node(
    new_node: NewNode,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify assignment and ownership.
    assignment = db.query(Assignment).filter(Assignment.id == new_node.assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    if assignment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to add a node to this assignment")
    
    # Set default positions.
    default_x, default_y = 100, 100
    pos_x = new_node.position_x if new_node.position_x is not None else default_x
    pos_y = new_node.position_y if new_node.position_y is not None else default_y
    parent_id = None

    # Determine insertion type.
    if new_node.insertion_type == "new_step":
        # "new_step": Add a new main step to the right of a parent.
        if not new_node.reference_node_id:
            raise HTTPException(status_code=400, detail="Reference node required for 'new_step' insertion")
        ref_node = db.query(Step).filter(Step.id == new_node.reference_node_id).first()
        if not ref_node:
            raise HTTPException(status_code=404, detail="Reference node not found")
        if ref_node.parent_id is not None:
            raise HTTPException(status_code=400, detail="Reference node must be a main step for 'new_step' insertion")
        parent_id = None  # New node is an independent main step.
        # Compute new position to the right.
        pos_x = ref_node.position_x + 100  
        pos_y = ref_node.position_y

    elif new_node.insertion_type == "after":
        # "after": Insert as a sibling immediately after the reference node.
        if not new_node.reference_node_id:
            raise HTTPException(status_code=400, detail="Reference node required for 'after' insertion")
        ref_node = db.query(Step).filter(Step.id == new_node.reference_node_id).first()
        if not ref_node:
            raise HTTPException(status_code=404, detail="Reference node not found")
        # If the reference node is a parent, we treat "after" as adding a new substep.
        if ref_node.parent_id is None:
            parent_id = ref_node.id  # New node becomes a child.
            pos_x = ref_node.position_x
            pos_y = ref_node.position_y + 50
        else:
            # For substeps: insert as a sibling.
            parent_id = ref_node.parent_id
            pos_x = ref_node.position_x
            pos_y = ref_node.position_y + 50
    elif new_node.insertion_type == "substep":
        # "substep": Insert as a child of the reference node.
        if not new_node.reference_node_id:
            raise HTTPException(status_code=400, detail="Reference node required for 'substep' insertion")
        parent_id = new_node.reference_node_id
        ref_node = db.query(Step).filter(Step.id == new_node.reference_node_id).first()
        if not ref_node:
            raise HTTPException(status_code=404, detail="Reference node not found")
        pos_x = ref_node.position_x + 150  
        pos_y = ref_node.position_y
    else:
        # Random insertion: treat as main step.
        parent_id = None

    # Create the new node.
    node = Step(
        assignment_id=new_node.assignment_id,
        content=new_node.content,
        parent_id=parent_id,
        position_x=pos_x,
        position_y=pos_y,
        completed=False
    )
    db.add(node)
    db.commit()
    db.refresh(node)
    
    # Connection re-wiring based on insertion type.
    if new_node.insertion_type == "new_step":
        # For "new_step": Insert a new main step.
        # Check if the reference node (ref_node) has an outgoing connection.
        conn_out = (
            db.query(Connection)
            .join(Step, Connection.to_step == Step.id)
            .filter(
                Connection.from_step == new_node.reference_node_id,
                Step.parent_id == None  # Only consider connections where target is a main step.
            )
            .first()
        )
        if conn_out:
            # Case 1: There is an outgoing main-step connection.
            # Delete the connection from the reference parent to its current main-step target.
            db.delete(conn_out)
            # Create connection from the reference parent to the new node.
            db.add(Connection(assignment_id=assignment.id, from_step=new_node.reference_node_id, to_step=node.id))
            # And create connection from the new node to the former target.
            db.add(Connection(assignment_id=assignment.id, from_step=node.id, to_step=conn_out.to_step))
        else:
            # Case 2: No main-step outgoing connection exists.
            db.add(Connection(assignment_id=assignment.id, from_step=new_node.reference_node_id, to_step=node.id))
    
    elif new_node.insertion_type == "after":
        # For "after":
        if ref_node.parent_id is None:
            # For a parent node, treat "after" as adding a new substep.
            # Get the outgoing connection from ref_node (if any).
            first_child_conn = (db.query(Connection).join(Step, Connection.to_step == Step.id).filter(Connection.from_step == ref_node.id, Step.parent_id == ref_node.id).first())
            if first_child_conn:
                db.delete(first_child_conn)
                db.add(Connection(assignment_id=assignment.id, from_step=ref_node.id, to_step=node.id))
                db.add(Connection(assignment_id=assignment.id, from_step=node.id, to_step=first_child_conn.to_step))
            else:
                db.add(Connection(assignment_id=assignment.id, from_step=ref_node.id, to_step=node.id))
        else:
            # For substeps, treat as sibling insertion.
            conn_out = (
                db.query(Connection)
                .join(Step, Connection.to_step == Step.id)
                .filter(
                    Connection.from_step == ref_node.id,
                    Step.parent_id == ref_node.parent_id
                )
                .first()
            )
            if conn_out:
                db.delete(conn_out)
                db.add(Connection(assignment_id=assignment.id, from_step=new_node.reference_node_id, to_step=node.id))
                db.add(Connection(assignment_id=assignment.id, from_step=node.id, to_step=conn_out.to_step))
            else:
                db.add(Connection(assignment_id=assignment.id, from_step=new_node.reference_node_id, to_step=node.id))
    
    elif new_node.insertion_type == "substep":
        # For "substep": create a direct connection.
        db.add(Connection(assignment_id=assignment.id, from_step=new_node.reference_node_id, to_step=node.id))
    
    db.commit()
    return node


# ---------------------------
# Update Node Content (unchanged)
# ---------------------------
class NodeContentUpdate(BaseModel):
    content: str

@router.patch("/steps/{node_id}")
def update_node_content(
    node_id: int,
    update: NodeContentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    node = db.query(Step).filter(Step.id == node_id).first()
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    if node.assignment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this node")
    
    node.content = update.content
    db.commit()
    return {"message": "Node content updated successfully"}
