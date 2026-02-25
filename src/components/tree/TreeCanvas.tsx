'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  Controls,
  Node,
  Edge,
  NodeTypes,
  EdgeTypes,
  useNodesState,
  useEdgesState,
  NodeMouseHandler,
  Viewport,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { TraditionalPersonNode } from './TraditionalPersonNode';
import {
  OrthogonalParentChildEdge,
  EnhancedSpouseEdge,
} from './OrthogonalEdge';
import { GenerationRow } from './GenerationRow';
import { useTreeBoardStore } from '@/store/treeBoardStore';
import { usePreferencesStore } from '@/store/preferencesStore';
import { GenerationRow as GenerationRowType } from '@/types/tree-layout';

interface TreeCanvasProps {
  initialNodes: Node[];
  initialEdges: Edge[];
  onNodeClick: NodeMouseHandler;
  onNodeDoubleClick: NodeMouseHandler;
  generationRows?: GenerationRowType[];
}

const nodeTypes: NodeTypes = {
  traditionalPerson: TraditionalPersonNode,
};

const edgeTypes: EdgeTypes = {
  orthogonal: OrthogonalParentChildEdge,
  spouse: EnhancedSpouseEdge,
  enhancedSpouse: EnhancedSpouseEdge,
};

export function TreeCanvas({
  initialNodes,
  initialEdges,
  onNodeClick,
  onNodeDoubleClick,
  generationRows = [],
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

  const controlsClassName = useMemo(
    () => '!bg-surface/90 !rounded-xl !border !border-border',
    []
  );

  // Background color based on theme - matches design specification
  // Light mode: #d1d5db (gray-300)
  // Dark mode: #2d3a3c
  const backgroundColor = useMemo(
    () => (resolvedTheme === 'dark' ? '#2d3a3c' : '#d1d5db'),
    [resolvedTheme]
  );

  return (
    <div className="w-full h-full bg-background-light dark:bg-background-dark relative overflow-hidden">
      {/* Grid Background Pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: resolvedTheme === 'dark'
            ? 'radial-gradient(#2d3a3c 1px, transparent 1px)'
            : 'radial-gradient(#d1d5db 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Generation Rows */}
      {generationRows.map((row) => (
        <GenerationRow
          key={`gen-row-${row.level}`}
          row={row}
          visible={row.labelVisible}
        />
      ))}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={viewport}
        onMoveEnd={onMoveEnd}
        proOptions={{ hideAttribution: true }}
      >
        <Controls className={controlsClassName} />
      </ReactFlow>
    </div>
  );
}
