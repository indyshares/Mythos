import React, { useState, useMemo, useRef, useEffect } from 'react';
import { GitBranch, ZoomIn, ZoomOut, RotateCcw, ExternalLink } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { extractInternalLinks, parseMarkdown } from '../utils/markdownParser';

interface Node {
  id: string;
  name: string;
  cleanTitle: string;
  type: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  connectionCount: number;
}

interface Edge {
  source: string;
  target: string;
}

export const GraphView: React.FC = () => {
  const { files, activeWorkspaceId, openFileInTab } = useWorkspace();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Build nodes and edges from files in active workspace
  const { nodes, edges } = useMemo(() => {
    const wsFiles = files.filter((f) => f.workspaceId === activeWorkspaceId && !f.deletedAt);
    const nodeMap = new Map<string, Node>();
    const edgeList: Edge[] = [];

    // Map files to nodes
    wsFiles.forEach((file, index) => {
      const parsed = parseMarkdown(file.content);
      const cleanTitle = file.name.replace(/\.md$/, '');
      const angle = (index / Math.max(1, wsFiles.length)) * Math.PI * 2;
      const radius = 160 + Math.random() * 60;

      nodeMap.set(cleanTitle.toLowerCase(), {
        id: file.id,
        name: file.name,
        cleanTitle,
        type: String(parsed.frontmatter.type || 'note'),
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        radius: 14,
        connectionCount: 0,
      });
    });

    // Parse edges via [[Links]]
    wsFiles.forEach((file) => {
      const srcTitle = file.name.replace(/\.md$/, '').toLowerCase();
      const internalLinks = extractInternalLinks(file.content);

      internalLinks.forEach((targetName) => {
        const tgtLower = targetName.toLowerCase();
        if (nodeMap.has(tgtLower) && tgtLower !== srcTitle) {
          edgeList.push({ source: srcTitle, target: tgtLower });

          const srcNode = nodeMap.get(srcTitle);
          const tgtNode = nodeMap.get(tgtLower);
          if (srcNode) srcNode.connectionCount += 1;
          if (tgtNode) tgtNode.connectionCount += 1;
        }
      });
    });

    const nodeList = Array.from(nodeMap.values());
    nodeList.forEach((n) => {
      n.radius = Math.min(24, Math.max(12, 10 + n.connectionCount * 2.5));
    });

    return { nodes: nodeList, edges: edgeList };
  }, [files, activeWorkspaceId]);

  // Simulation & Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      canvas.width = canvas.parentElement?.clientWidth || 800;
      canvas.height = canvas.parentElement?.clientHeight || 600;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();

      // Pan & Zoom
      ctx.translate(canvas.width / 2 + offset.x, canvas.height / 2 + offset.y);
      ctx.scale(zoom, zoom);

      // Draw Edges
      edges.forEach((edge) => {
        const src = nodes.find((n) => n.cleanTitle.toLowerCase() === edge.source);
        const tgt = nodes.find((n) => n.cleanTitle.toLowerCase() === edge.target);
        if (!src || !tgt) return;

        const isHighlighted =
          (hoveredNode && (hoveredNode.id === src.id || hoveredNode.id === tgt.id)) ||
          (selectedNode && (selectedNode.id === src.id || selectedNode.id === tgt.id));

        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(tgt.x, tgt.y);
        ctx.strokeStyle = isHighlighted ? 'rgba(14, 165, 233, 0.8)' : 'rgba(150, 150, 150, 0.2)';
        ctx.lineWidth = isHighlighted ? 2 : 1;
        ctx.stroke();
      });

      // Draw Nodes
      nodes.forEach((node) => {
        const isHovered = hoveredNode?.id === node.id;
        const isSelected = selectedNode?.id === node.id;

        // Node Circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);

        if (isHovered || isSelected) {
          ctx.fillStyle = '#0ea5e9'; // sky-500
          ctx.shadowColor = 'rgba(14, 165, 233, 0.6)';
          ctx.shadowBlur = 12;
        } else if (node.type === 'character') {
          ctx.fillStyle = '#38bdf8'; // light sky blue
          ctx.shadowBlur = 0;
        } else if (node.type === 'location') {
          ctx.fillStyle = '#10b981'; // emerald
          ctx.shadowBlur = 0;
        } else if (node.type === 'event') {
          ctx.fillStyle = '#f43f5e'; // rose
          ctx.shadowBlur = 0;
        } else {
          ctx.fillStyle = '#6366f1'; // indigo
          ctx.shadowBlur = 0;
        }

        ctx.fill();

        // Node Outline
        ctx.lineWidth = isSelected ? 3 : 1.5;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Text Label
        ctx.font = '11px Plus Jakarta Sans, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = isHovered || isSelected ? '#38bdf8' : '#a3a3a3';
        ctx.fillText(node.cleanTitle, node.x, node.y + node.radius + 14);
      });

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [nodes, edges, zoom, offset, hoveredNode, selectedNode]);

  // Mouse interaction on Canvas
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDraggingCanvas(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isDraggingCanvas) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
      return;
    }

    // Hit test nodes
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - canvas.width / 2 - offset.x) / zoom;
    const mouseY = (e.clientY - rect.top - canvas.height / 2 - offset.y) / zoom;

    const hit = nodes.find((n) => {
      const dist = Math.hypot(n.x - mouseX, n.y - mouseY);
      return dist <= n.radius + 4;
    });

    setHoveredNode(hit || null);
  };

  const handleMouseUp = () => {
    setIsDraggingCanvas(false);
  };

  const handleClick = () => {
    if (hoveredNode) {
      setSelectedNode(hoveredNode);
    } else {
      setSelectedNode(null);
    }
  };

  const handleDoubleClick = () => {
    if (hoveredNode) {
      openFileInTab(hoveredNode.id);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-900 text-neutral-100 relative select-none overflow-hidden">
      {/* Top Floating Controls */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-neutral-800/90 backdrop-blur border border-neutral-700 p-1.5 rounded-lg text-xs">
        <div className="flex items-center gap-1.5 px-2 font-medium">
          <GitBranch className="w-4 h-4 text-sky-500" />
          <span>Knowledge Graph ({nodes.length} notes, {edges.length} connections)</span>
        </div>

        <div className="h-4 w-[1px] bg-neutral-700" />

        <button
          onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
          className="p-1 hover:bg-neutral-700 rounded text-neutral-300"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setZoom((z) => Math.max(0.4, z - 0.2))}
          className="p-1 hover:bg-neutral-700 rounded text-neutral-300"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => {
            setZoom(1);
            setOffset({ x: 0, y: 0 });
          }}
          className="p-1 hover:bg-neutral-700 rounded text-neutral-300"
          title="Reset View"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Legend Badge */}
      <div className="absolute bottom-4 left-4 z-10 bg-neutral-800/80 backdrop-blur border border-neutral-700 px-3 py-2 rounded-lg text-[11px] flex items-center gap-3">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-400" /> Character
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Location
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Event
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Lore & Notes
        </span>
      </div>

      {/* Selected Node Details Box */}
      {selectedNode && (
        <div className="absolute top-4 right-4 z-10 w-64 bg-neutral-800/95 backdrop-blur border border-neutral-700 p-4 rounded-xl shadow-xl text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-semibold text-sky-400">
              {selectedNode.type}
            </span>
            <button
              onClick={() => openFileInTab(selectedNode.id)}
              className="flex items-center gap-1 text-sky-400 hover:underline"
            >
              <span>Open Note</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
          <h3 className="font-display text-sm font-bold text-white">
            {selectedNode.cleanTitle}
          </h3>
          <p className="text-neutral-400 text-[11px]">
            Connected to <strong>{selectedNode.connectionCount}</strong> notes in this workspace.
          </p>
        </div>
      )}

      {/* Main Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />
    </div>
  );
};
