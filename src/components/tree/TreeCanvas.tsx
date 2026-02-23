'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { usePreferencesStore } from '@/store/preferencesStore';

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
  const theme = usePreferencesStore((state) => state.theme);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // Sync nodes when initialNodes prop changes
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  // Sync edges when initialEdges prop changes
  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  useEffect(() => {
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      setResolvedTheme(systemTheme);
    } else {
      setResolvedTheme(theme as 'light' | 'dark');
    }
  }, [theme]);

  const onMoveEnd = useCallback(
    (event: unknown, viewport: Viewport) => {
      setViewport(viewport);
    },
    [setViewport]
  );

  const minimapClassName = useMemo(
    () => '!bg-surface/90 !rounded-xl !border !border-border',
    []
  );

  const controlsClassName = useMemo(
    () => '!bg-surface/90 !rounded-xl !border !border-border',
    []
  );

  const backgroundColor = useMemo(
    () => (resolvedTheme === 'dark' ? '#2d3a3c' : '#d1d5db'),
    [resolvedTheme]
  );

  return (
    <div className="w-full h-full bg-surface-elevated">
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
        <Background gap={40} color={backgroundColor} />
        <Controls className={controlsClassName} />
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
