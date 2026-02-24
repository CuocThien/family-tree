import { BaseEdge, EdgeProps, getBezierPath } from 'reactflow';

/**
 * Orthogonal Parent-Child Edge Component
 * Renders right-angle (orthogonal) connection lines between parent and child nodes
 */
export function OrthogonalParentChildEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style,
  markerEnd,
}: EdgeProps) {
  // Calculate orthogonal path with two 90-degree turns
  const midY = (sourceY + targetY) / 2;

  const path = `M ${sourceX} ${sourceY} L ${sourceX} ${midY} L ${targetX} ${midY} L ${targetX} ${targetY}`;

  return (
    <g>
      <path
        id={id}
        d={path}
        fill="none"
        stroke={style?.stroke || '#cbd5e1'}
        strokeWidth={style?.strokeWidth || 2}
        strokeDasharray={style?.strokeDasharray || 'none'}
      />
    </g>
  );
}

/**
 * Distribution Edge Component
 * Renders horizontal distribution line from junction to multiple children
 */
export function DistributionEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style,
}: EdgeProps) {
  // Vertical line down from junction, then horizontal to child
  const midY = (sourceY + targetY) / 2;

  const path = `M ${sourceX} ${sourceY} L ${sourceX} ${midY} L ${targetX} ${midY} L ${targetX} ${targetY}`;

  return (
    <path
      id={id}
      d={path}
      fill="none"
      stroke={style?.stroke || '#cbd5e1'}
      strokeWidth={style?.strokeWidth || 2}
    />
  );
}

/**
 * Junction to Parent Edge
 * Connects a junction node back to parent(s)
 */
export function JunctionToParentEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style,
}: EdgeProps) {
  // Path from junction up to parent
  const midY = (sourceY + targetY) / 2;

  const path = `M ${sourceX} ${sourceY} L ${sourceX} ${midY} L ${targetX} ${midY} L ${targetX} ${targetY}`;

  return (
    <path
      id={id}
      d={path}
      fill="none"
      stroke={style?.stroke || '#cbd5e1'}
      strokeWidth={style?.strokeWidth || 2}
    />
  );
}

/**
 * Enhanced Spouse Edge with Traditional Symbol
 * Horizontal dashed line between spouses with optional traditional symbol
 */
export function EnhancedSpouseEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style,
}: EdgeProps) {
  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;

  return (
    <>
      {/* Horizontal connection line */}
      <line
        x1={sourceX}
        y1={sourceY}
        x2={targetX}
        y2={targetY}
        stroke={style?.stroke || '#f472b6'}
        strokeWidth={style?.strokeWidth || 2}
        strokeDasharray={style?.strokeDasharray || '5,5'}
      />
    </>
  );
}
