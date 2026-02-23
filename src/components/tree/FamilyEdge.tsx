import { BaseEdge, EdgeProps, getSmoothStepPath } from 'reactflow';

/**
 * Spouse Edge Component
 * Renders a horizontal dashed line between spouse nodes
 */
export function SpouseEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style,
  markerEnd,
}: EdgeProps) {
  // Create a straight horizontal path between spouses
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    borderRadius: 0,
  });

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      markerEnd={markerEnd}
      style={{
        ...style,
        stroke: '#f472b6',
        strokeWidth: 2,
        strokeDasharray: '5,5',
      }}
    />
  );
}

/**
 * Half-Sibling Edge Component
 * Renders a subtle dashed line connecting half-siblings through a shared parent
 */
export function HalfSiblingEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style,
  markerEnd,
}: EdgeProps) {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    borderRadius: 8,
  });

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      markerEnd={markerEnd}
      style={{
        ...style,
        stroke: '#94a3b8',
        strokeWidth: 1,
        strokeDasharray: '3,3',
        opacity: 0.6,
      }}
    />
  );
}

/**
 * Family Edge Component
 * Renders the parent-child connection edge
 */
export function FamilyEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style,
  data,
  markerEnd,
}: EdgeProps) {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    borderRadius: 4,
  });

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      markerEnd={markerEnd}
      style={{
        ...style,
        stroke: '#cbd5e1',
        strokeWidth: 2,
      }}
    />
  );
}
