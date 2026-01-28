'use client';

import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  NodeTypes,
  useNodesState,
  useEdgesState,
  NodeMouseHandler,
  Viewport,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { PersonNode } from './PersonNode.flow';
import { useTreeBoardStore } from '@/store/treeBoardStore';

const nodeTypes: NodeTypes = {
  person: PersonNode,
};

interface TreeCanvasProps {
  initialNodes: Node[];
  initialEdges: Edge[];
  onNodeClick: NodeMouseHandler;
  onNodeDoubleClick: NodeMouseHandler;
}

export function TreeCanvas({
  initialNodes,
  initialEdges,
  onNodeClick,
  onNodeDoubleClick,
}: TreeCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { viewport, setViewport, showMinimap } = useTreeBoardStore();

  const onMoveEnd = useCallback(
    (event: unknown, viewport: Viewport) => {
      setViewport(viewport);
    },
    [setViewport]
  );

  const minimapClassName = useMemo(
    () => '!bg-white/90 !rounded-xl !border !border-[#e7f1f3]',
    []
  );

  return (
    <div className="w-full h-full bg-[#f8fafc] dark:bg-[#0f172a]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={viewport}
        onMoveEnd={onMoveEnd}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={40} color="#d1d5db" />
        <Controls className="!bg-white/90 !rounded-xl !border !border-[#e7f1f3]" />
        {showMinimap && (
          <MiniMap
            nodeColor={(n) => (n.selected ? '#13c8ec' : '#cbd5e1')}
            className={minimapClassName}
          />
        )}
      </ReactFlow>
    </div>
  );
}
