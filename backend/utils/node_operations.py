# utils/node_operations.py
from fastapi import HTTPException
from sqlalchemy.orm import Session
from models.models import Step, Assignment, Connection, User
from typing import Optional

def create_node(
    db: Session,
    current_user: User,
    assignment_id: int,
    content: str,
    reference_node_id: Optional[int] = None,
    position_x: Optional[float] = None,
    position_y: Optional[float] = None,
    insertion_type: Optional[str] = None
):
    """
    Create a new node with the specified parameters.
    This is extracted from the add_new_node route function to be reusable.
    """
    # Verify assignment and ownership.
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    if assignment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to add a node to this assignment")
    
    # Set default positions.
    default_x, default_y = 100, 100
    pos_x = position_x if position_x is not None else default_x
    pos_y = position_y if position_y is not None else default_y
    parent_id = None

    # Determine insertion type.
    if insertion_type == "new_step":
        # "new_step": Add a new main step to the right of a parent.
        if not reference_node_id:
            raise HTTPException(status_code=400, detail="Reference node required for 'new_step' insertion")
        ref_node = db.query(Step).filter(Step.id == reference_node_id).first()
        if not ref_node:
            raise HTTPException(status_code=404, detail="Reference node not found")
        if ref_node.parent_id is not None:
            raise HTTPException(status_code=400, detail="Reference node must be a main step for 'new_step' insertion")
        parent_id = None  # New node is an independent main step.
        # Compute new position to the right.
        pos_x = ref_node.position_x + 100  
        pos_y = ref_node.position_y

    elif insertion_type == "after":
        # "after": Insert as a sibling immediately after the reference node.
        if not reference_node_id:
            raise HTTPException(status_code=400, detail="Reference node required for 'after' insertion")
        ref_node = db.query(Step).filter(Step.id == reference_node_id).first()
        if not ref_node:
            raise HTTPException(status_code=404, detail="Reference node not found")
        # If the reference node is a parent, we treat "after" as adding a new substep.
        if ref_node.parent_id is None:
            parent_id = ref_node.id  # New node becomes a child.
            pos_x = ref_node.position_x
            pos_y = ref_node.position_y + 70
        else:
            # For substeps: insert as a sibling.
            parent_id = ref_node.parent_id
            pos_x = ref_node.position_x
            pos_y = ref_node.position_y + 70
    elif insertion_type == "substep":
        # "substep": Insert as a child of the reference node.
        if not reference_node_id:
            raise HTTPException(status_code=400, detail="Reference node required for 'substep' insertion")
        parent_id = reference_node_id
        ref_node = db.query(Step).filter(Step.id == reference_node_id).first()
        if not ref_node:
            raise HTTPException(status_code=404, detail="Reference node not found")
        pos_x = ref_node.position_x + 180 
        pos_y = ref_node.position_y
    else:
        # Random insertion: treat as main step.
        parent_id = None

    # Create the new node.
    node = Step(
        assignment_id=assignment_id,
        content=content,
        parent_id=parent_id,
        position_x=pos_x,
        position_y=pos_y,
        completed=False
    )
    db.add(node)
    db.commit()
    db.refresh(node)
    
    # Connection re-wiring based on insertion type.
    if insertion_type == "new_step":
        # For "new_step": Insert a new main step.
        # Check if the reference node (ref_node) has an outgoing connection.
        conn_out = (
            db.query(Connection)
            .join(Step, Connection.to_step == Step.id)
            .filter(
                Connection.from_step == reference_node_id,
                Step.parent_id == None  # Only consider connections where target is a main step.
            )
            .first()
        )
        if conn_out:
            # Case 1: There is an outgoing main-step connection.
            # Delete the connection from the reference parent to its current main-step target.
            db.delete(conn_out)
            # Create connection from the reference parent to the new node.
            db.add(Connection(assignment_id=assignment.id, from_step=reference_node_id, to_step=node.id))
            # And create connection from the new node to the former target.
            db.add(Connection(assignment_id=assignment.id, from_step=node.id, to_step=conn_out.to_step))
        else:
            # Case 2: No main-step outgoing connection exists.
            db.add(Connection(assignment_id=assignment.id, from_step=reference_node_id, to_step=node.id))
    
    elif insertion_type == "after":
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
                db.add(Connection(assignment_id=assignment.id, from_step=reference_node_id, to_step=node.id))
                db.add(Connection(assignment_id=assignment.id, from_step=node.id, to_step=conn_out.to_step))
            else:
                db.add(Connection(assignment_id=assignment.id, from_step=reference_node_id, to_step=node.id))
    
    elif insertion_type == "substep":
        # For "substep": create a direct connection.
        db.add(Connection(assignment_id=assignment.id, from_step=reference_node_id, to_step=node.id))
    
    db.commit()
    return node