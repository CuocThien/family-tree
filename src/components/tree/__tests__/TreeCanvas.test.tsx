import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { Node, Edge } from 'reactflow';

// Mock ReactFlow hooks and components
jest.mock('reactflow', () => ({
  ReactFlow: jest.fn(({ nodes, edges, onNodesChange, onEdgesChange, onNodeClick, onNodeDoubleClick, children }) => (
    <div data-testid="react-flow" data-nodes={JSON.stringify(nodes)} data-edges={JSON.stringify(edges)}>
      {children}
    </div>
  )),
  Background: jest.fn(() => <div data-testid="background" />),
  Controls: jest.fn(() => <div data-testid="controls" />),
  MiniMap: jest.fn(() => <div data-testid="minimap" />),
  useNodesState: jest.fn((initialNodes) => {
    const [nodes, setNodes] = React.useState(initialNodes);
    const onNodesChange = jest.fn();
    return [nodes, setNodes, onNodesChange];
  }),
  useEdgesState: jest.fn((initialEdges) => {
    const [edges, setEdges] = React.useState(initialEdges);
    const onEdgesChange = jest.fn();
    return [edges, setEdges, onEdgesChange];
  }),
}));

// Mock stores
jest.mock('@/store/treeBoardStore', () => ({
  useTreeBoardStore: jest.fn(() => ({
    viewport: { x: 0, y: 0, zoom: 1 },
    setViewport: jest.fn(),
    showMinimap: true,
  })),
}));

jest.mock('@/store/preferencesStore', () => ({
  usePreferencesStore: jest.fn((selector) => selector({ theme: 'light' })),
}));

// Mock PersonNode component
jest.mock('../PersonNode.flow', () => ({
  PersonNode: jest.fn(() => <div data-testid="person-node" />),
}));

// Import TreeCanvas after all mocks are set up
import { TreeCanvas } from '../TreeCanvas';

describe('TreeCanvas', () => {
  const mockOnNodeClick = jest.fn();
  const mockOnNodeDoubleClick = jest.fn();

  const defaultProps = {
    initialNodes: [] as Node[],
    initialEdges: [] as Edge[],
    onNodeClick: mockOnNodeClick,
    onNodeDoubleClick: mockOnNodeDoubleClick,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(<TreeCanvas {...defaultProps} />);
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
  });

  it('should render with initial nodes', () => {
    const initialNodes: Node[] = [
      { id: '1', type: 'person', position: { x: 0, y: 0 }, data: { firstName: 'John', lastName: 'Doe' } },
    ];

    render(<TreeCanvas {...defaultProps} initialNodes={initialNodes} />);

    const reactFlow = screen.getByTestId('react-flow');
    const nodesData = JSON.parse(reactFlow.getAttribute('data-nodes') || '[]');
    expect(nodesData).toHaveLength(1);
    expect(nodesData[0].id).toBe('1');
  });

  it('should render with initial edges', () => {
    const initialEdges: Edge[] = [
      { id: 'e1-2', source: '1', target: '2' },
    ];

    render(<TreeCanvas {...defaultProps} initialEdges={initialEdges} />);

    const reactFlow = screen.getByTestId('react-flow');
    const edgesData = JSON.parse(reactFlow.getAttribute('data-edges') || '[]');
    expect(edgesData).toHaveLength(1);
    expect(edgesData[0].id).toBe('e1-2');
  });

  it('should update nodes when initialNodes prop changes', async () => {
    const { rerender } = render(<TreeCanvas {...defaultProps} />);

    // Initially no nodes
    let reactFlow = screen.getByTestId('react-flow');
    let nodesData = JSON.parse(reactFlow.getAttribute('data-nodes') || '[]');
    expect(nodesData).toHaveLength(0);

    // Rerender with new nodes
    const newNodes: Node[] = [
      { id: '1', type: 'person', position: { x: 0, y: 0 }, data: { firstName: 'John', lastName: 'Doe' } },
      { id: '2', type: 'person', position: { x: 200, y: 0 }, data: { firstName: 'Jane', lastName: 'Doe' } },
    ];

    rerender(<TreeCanvas {...defaultProps} initialNodes={newNodes} />);

    // Check that nodes were updated
    reactFlow = screen.getByTestId('react-flow');
    nodesData = JSON.parse(reactFlow.getAttribute('data-nodes') || '[]');
    expect(nodesData).toHaveLength(2);
    expect(nodesData[0].id).toBe('1');
    expect(nodesData[1].id).toBe('2');
  });

  it('should update edges when initialEdges prop changes', async () => {
    const { rerender } = render(<TreeCanvas {...defaultProps} />);

    // Initially no edges
    let reactFlow = screen.getByTestId('react-flow');
    let edgesData = JSON.parse(reactFlow.getAttribute('data-edges') || '[]');
    expect(edgesData).toHaveLength(0);

    // Rerender with new edges
    const newEdges: Edge[] = [
      { id: 'e1-2', source: '1', target: '2', type: 'smoothstep' },
      { id: 'e2-3', source: '2', target: '3', type: 'smoothstep' },
    ];

    rerender(<TreeCanvas {...defaultProps} initialEdges={newEdges} />);

    // Check that edges were updated
    reactFlow = screen.getByTestId('react-flow');
    edgesData = JSON.parse(reactFlow.getAttribute('data-edges') || '[]');
    expect(edgesData).toHaveLength(2);
    expect(edgesData[0].id).toBe('e1-2');
    expect(edgesData[1].id).toBe('e2-3');
  });

  it('should sync nodes and edges when both props change simultaneously', async () => {
    const { rerender } = render(<TreeCanvas {...defaultProps} />);

    // Rerender with new nodes and edges
    const newNodes: Node[] = [
      { id: '1', type: 'person', position: { x: 0, y: 0 }, data: { firstName: 'John', lastName: 'Doe' } },
    ];
    const newEdges: Edge[] = [
      { id: 'e1-2', source: '1', target: '2', type: 'smoothstep' },
    ];

    rerender(
      <TreeCanvas
        {...defaultProps}
        initialNodes={newNodes}
        initialEdges={newEdges}
      />
    );

    const reactFlow = screen.getByTestId('react-flow');
    const nodesData = JSON.parse(reactFlow.getAttribute('data-nodes') || '[]');
    const edgesData = JSON.parse(reactFlow.getAttribute('data-edges') || '[]');

    expect(nodesData).toHaveLength(1);
    expect(edgesData).toHaveLength(1);
  });

  it('should handle empty initial state and transition to populated state', async () => {
    const { rerender } = render(<TreeCanvas {...defaultProps} />);

    // Initially empty
    let reactFlow = screen.getByTestId('react-flow');
    expect(JSON.parse(reactFlow.getAttribute('data-nodes') || '[]')).toHaveLength(0);
    expect(JSON.parse(reactFlow.getAttribute('data-edges') || '[]')).toHaveLength(0);

    // Add first person
    const firstPersonNodes: Node[] = [
      { id: '1', type: 'person', position: { x: 100, y: 100 }, data: { firstName: 'First', lastName: 'Person' } },
    ];

    rerender(<TreeCanvas {...defaultProps} initialNodes={firstPersonNodes} />);

    reactFlow = screen.getByTestId('react-flow');
    const nodesData = JSON.parse(reactFlow.getAttribute('data-nodes') || '[]');
    expect(nodesData).toHaveLength(1);
    expect(nodesData[0].data.firstName).toBe('First');
  });

  it('should handle removing nodes from the tree', async () => {
    const initialNodes: Node[] = [
      { id: '1', type: 'person', position: { x: 0, y: 0 }, data: { firstName: 'John' } },
      { id: '2', type: 'person', position: { x: 200, y: 0 }, data: { firstName: 'Jane' } },
    ];

    const { rerender } = render(<TreeCanvas {...defaultProps} initialNodes={initialNodes} />);

    // Initially 2 nodes
    let reactFlow = screen.getByTestId('react-flow');
    expect(JSON.parse(reactFlow.getAttribute('data-nodes') || '[]')).toHaveLength(2);

    // Remove one node
    const updatedNodes: Node[] = [
      { id: '1', type: 'person', position: { x: 0, y: 0 }, data: { firstName: 'John' } },
    ];

    rerender(<TreeCanvas {...defaultProps} initialNodes={updatedNodes} />);

    reactFlow = screen.getByTestId('react-flow');
    const nodesData = JSON.parse(reactFlow.getAttribute('data-nodes') || '[]');
    expect(nodesData).toHaveLength(1);
    expect(nodesData[0].id).toBe('1');
  });

  it('should render minimap when showMinimap is true', () => {
    render(<TreeCanvas {...defaultProps} />);
    expect(screen.getByTestId('minimap')).toBeInTheDocument();
  });

  it('should render controls', () => {
    render(<TreeCanvas {...defaultProps} />);
    expect(screen.getByTestId('controls')).toBeInTheDocument();
  });

  it('should render background', () => {
    render(<TreeCanvas {...defaultProps} />);
    expect(screen.getByTestId('background')).toBeInTheDocument();
  });
});
