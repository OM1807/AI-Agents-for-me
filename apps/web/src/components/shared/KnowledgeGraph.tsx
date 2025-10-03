'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ForceGraphMethods } from 'react-force-graph-2d';
import type { NodeObject } from 'force-graph';
import type { KnowledgeNode, KnowledgeLink, GraphData } from '@/types';

// Avoid SSR issues by dynamically importing the canvas component
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
}) as unknown as React.ComponentType<any>;

const useContainerSize = () => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setSize({ width, height });
      }
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, ...size } as const;
};

const svgToDataURI = (svg: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

const notionSVG = svgToDataURI(
  `<?xml version="1.0" encoding="UTF-8"?>
  <svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="10" width="44" height="44" rx="8" fill="white" stroke="#111827" stroke-width="4"/>
    <text x="32" y="41" text-anchor="middle" font-size="28" font-family="ui-sans-serif, system-ui" font-weight="700" fill="#111827">N</text>
  </svg>`
);

const confluenceSVG = svgToDataURI(
  `<?xml version="1.0" encoding="UTF-8"?>
  <svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="28" fill="white"/>
    <path d="M16 25c6-5 15-5 21 0l3 3-6 6-3-3c-3-3-8-3-11 0l-4-6z" fill="#2563eb"/>
    <path d="M48 39c-6 5-15 5-21 0l-3-3 6-6 3 3c3 3 8 3 11 0l4 6z" fill="#60a5fa"/>
  </svg>`
);

const githubSVG = svgToDataURI(
  `<?xml version="1.0" encoding="UTF-8"?>
  <svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="30" fill="#111827"/>
    <path fill="#ffffff" d="M32 18c-7.2 0-13 5.9-13 13 0 5.7 3.7 10.6 8.8 12.3.6.1.8-.2.8-.6v-2.4c-3.6.8-4.4-1.5-4.4-1.5-.5-1.2-1.2-1.5-1.2-1.5-1-.7.1-.7.1-.7 1.1.1 1.7 1.1 1.7 1.1 1 1.7 2.7 1.2 3.4.9.1-.8.4-1.2.8-1.6-2.9-.3-5.9-1.5-5.9-6.6 0-1.5.5-2.7 1.3-3.7-.1-.3-.6-1.6.1-3.3 0 0 1.1-.3 3.6 1.3 1-.3 2.1-.4 3.2-.4s2.2.1 3.2.4c2.5-1.7 3.6-1.3 3.6-1.3.6 1.7.2 3 .1 3.3.8 1 1.3 2.2 1.3 3.7 0 5.1-3.1 6.3-6 6.6.5.4.9 1.1.9 2.2v3.2c0 .4.2.8.8.6 5.1-1.7 8.8-6.6 8.8-12.3 0-7.1-5.8-13-13-13z"/>
  </svg>`
);

const loadIcons = () => {
  if (typeof window === 'undefined')
    return {} as Record<string, HTMLImageElement>;
  const entries: [string, string][] = [
    ['notion', notionSVG],
    ['confluence', confluenceSVG],
    ['github', githubSVG],
  ];
  const map: Record<string, HTMLImageElement> = {};
  for (const [key, uri] of entries) {
    const img = new Image();
    img.src = uri;
    map[key] = img;
  }
  return map;
};

const createData = (): GraphData => {
  // Coordinates are chosen to resemble the provided layout and then fixed with fx/fy
  // Canvas origin top-left. Positions are relative; component will scale to container.
  const nodes: KnowledgeNode[] = [
    // Source nodes
    {
      id: 'notion',
      label: 'Notion',
      type: 'source',
      fx: 520,
      fy: 300,
      size: 36,
      colorStops: [
        { offset: 0, color: '#ffb08a' },
        { offset: 1, color: '#ffcfb3' },
      ],
    },
    {
      id: 'team-structure',
      label: 'Team structure',
      type: 'child',
      fx: 660,
      fy: 300,
    },

    // Confluence
    {
      id: 'confluence',
      label: 'Confluence',
      type: 'source',
      fx: 600,
      fy: 520,
      size: 34,
      colorStops: [
        { offset: 0, color: '#9bd0ff' },
        { offset: 1, color: '#6fb9ff' },
      ],
    },
    {
      id: 'backend-guidelines',
      label: 'Backend guidelines',
      type: 'child',
      fx: 720,
      fy: 520,
    },
    {
      id: 'tech-specs',
      label: 'Technical specifications',
      type: 'child',
      fx: 680,
      fy: 640,
    },
    {
      id: 'user-stories',
      label: 'User stories & requirements',
      type: 'child',
      fx: 520,
      fy: 700,
    },

    // Github
    {
      id: 'github',
      label: 'Github',
      type: 'source',
      fx: 360,
      fy: 520,
      size: 34,
      colorStops: [
        { offset: 0, color: '#9a86ff' },
        { offset: 1, color: '#6f60ff' },
      ],
    },
    { id: 'pixelkit', label: 'pixelkit', type: 'child', fx: 440, fy: 480 },
    { id: 'buildbox', label: 'buildbox', type: 'child', fx: 480, fy: 580 },
    {
      id: 'prompt-factory',
      label: 'prompt-factory',
      type: 'child',
      fx: 220,
      fy: 480,
    },
    { id: 'sdlc-utils', label: 'sdlc-utils', type: 'child', fx: 280, fy: 400 },

    // Engineering docs
    {
      id: 'eng-docs',
      label: 'Engineering docs',
      type: 'source',
      fx: 380,
      fy: 250,
      size: 28,
      colorStops: [
        { offset: 0, color: '#ffb98f' },
        { offset: 1, color: '#f7a773' },
      ],
    },
    {
      id: 'data-flow',
      label: 'Data flow diagram',
      type: 'child',
      fx: 420,
      fy: 120,
    },
    {
      id: 'frontend-comp',
      label: 'Frontend components',
      type: 'child',
      fx: 250,
      fy: 200,
    },
    {
      id: 'api-arch',
      label: 'API architecture',
      type: 'child',
      fx: 320,
      fy: 340,
    },
    {
      id: 'cloud-deploy',
      label: 'Cloud deployment',
      type: 'child',
      fx: 520,
      fy: 160,
    },
    {
      id: 'infra-overview',
      label: 'Infrastructure overview',
      type: 'child',
      fx: 620,
      fy: 220,
    },
  ];

  const links: KnowledgeLink[] = [
    // Notion relations
    { source: 'notion', target: 'eng-docs' },
    { source: 'notion', target: 'confluence' },
    { source: 'notion', target: 'team-structure' },
    { source: 'notion', target: 'github' },

    // Engineering docs relations
    { source: 'eng-docs', target: 'data-flow' },
    { source: 'eng-docs', target: 'frontend-comp' },
    { source: 'eng-docs', target: 'api-arch' },
    { source: 'eng-docs', target: 'cloud-deploy' },
    { source: 'eng-docs', target: 'infra-overview' },

    // Confluence relations
    { source: 'confluence', target: 'backend-guidelines' },
    { source: 'confluence', target: 'tech-specs' },
    { source: 'confluence', target: 'user-stories' },

    // Github relations
    { source: 'github', target: 'pixelkit' },
    { source: 'github', target: 'buildbox' },
    { source: 'github', target: 'prompt-factory' },
    { source: 'github', target: 'sdlc-utils' },
  ];

  return { nodes, links };
};

const getAnimatedOffset = (nodeId: string, startTime: number) => {
  const now = Date.now();
  const elapsed = (now - startTime) / 1000; // Convert to seconds

  // Create a unique seed for each node based on its ID
  const seed = nodeId
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  // Use different frequencies and phases for x and y to create organic movement
  const xFreq = 0.3 + (seed % 100) / 1000; // 0.3-0.4 Hz
  const yFreq = 0.25 + ((seed * 7) % 100) / 1000; // 0.25-0.35 Hz
  const xPhase = (seed * 3.14159) / 180;
  const yPhase = (seed * 7 * 3.14159) / 180;

  // Small movement range (increased for visibility)
  const xAmplitude = 8 + (seed % 5);
  const yAmplitude = 8 + ((seed * 3) % 5);

  return {
    x: Math.sin(elapsed * xFreq + xPhase) * xAmplitude,
    y: Math.cos(elapsed * yFreq + yPhase) * yAmplitude,
  };
};

const drawPill = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  options: {
    paddingX: number;
    paddingY: number;
    radius: number;
    bg: string;
    color: string;
    font: string;
    shadow?: string;
  }
) => {
  const { paddingX, paddingY, radius, bg, color, font, shadow } = options;
  ctx.font = font;
  const metrics = ctx.measureText(text);
  const w = Math.ceil(metrics.width) + paddingX * 2;
  const h = 24 + paddingY * 2;
  const rx = x - w / 2;
  const ry = y - h / 2;

  if (shadow) {
    ctx.shadowColor = shadow;
    ctx.shadowBlur = 12;
  }
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.moveTo(rx + radius, ry);
  ctx.lineTo(rx + w - radius, ry);
  ctx.quadraticCurveTo(rx + w, ry, rx + w, ry + radius);
  ctx.lineTo(rx + w, ry + h - radius);
  ctx.quadraticCurveTo(rx + w, ry + h, rx + w - radius, ry + h);
  ctx.lineTo(rx + radius, ry + h);
  ctx.quadraticCurveTo(rx, ry + h, rx, ry + h - radius);
  ctx.lineTo(rx, ry + radius);
  ctx.quadraticCurveTo(rx, ry, rx + radius, ry);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y);
};

const KnowledgeGraph = () => {
  const { ref, width, height } = useContainerSize();
  const fgRef = useRef<ForceGraphMethods | undefined>(undefined);
  const [hasFit, setHasFit] = useState(false);
  const baseData = useMemo(createData, []);
  const [data, setData] = useState(baseData);

  // Initialize data with base positions
  useEffect(() => {
    setData(baseData);
  }, [baseData]);
  const icons = useMemo(loadIcons, []);
  const [, forceRerender] = useState<number>(0);
  const animationRef = useRef<number | undefined>(undefined);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    // ensure redraw when icons finish loading
    const subs: Array<() => void> = [];
    Object.values(icons).forEach(img => {
      const handler = () => forceRerender(v => v + 1);
      if (!img.complete) img.addEventListener('load', handler);
      subs.push(() => img.removeEventListener('load', handler));
    });
    return () => subs.forEach(fn => fn());
  }, [icons]);

  useEffect(() => {
    if (!fgRef.current) return;
    // Refit on size changes
    const id = setTimeout(() => {
      try {
        fgRef.current?.zoomToFit(400, 60);
        setHasFit(true);
      } catch {}
    }, 0);
    return () => clearTimeout(id);
  }, [width, height]);

  // Animation loop for gentle node movement
  useEffect(() => {
    let lastUpdate = 0;
    const targetFPS = 30; // Limit to 30fps for better performance
    const frameDelay = 1000 / targetFPS;

    const animate = (timestamp: number) => {
      if (timestamp - lastUpdate >= frameDelay) {
        // Update node positions with animated offsets, keeping fx/fy as the animated position
        setData(prevData => ({
          ...prevData,
          nodes: prevData.nodes.map(node => {
            const offset = getAnimatedOffset(node.id, startTimeRef.current);
            const originalFx =
              baseData.nodes.find(n => n.id === node.id)?.fx || 0;
            const originalFy =
              baseData.nodes.find(n => n.id === node.id)?.fy || 0;
            return {
              ...node,
              fx: originalFx + offset.x,
              fy: originalFy + offset.y,
              x: originalFx + offset.x,
              y: originalFy + offset.y,
            };
          }),
        }));
        lastUpdate = timestamp;
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    // Start animation after a short delay to ensure graph is initialized
    const timeoutId = setTimeout(() => {
      animationRef.current = requestAnimationFrame(animate);
    }, 1000);

    return () => {
      clearTimeout(timeoutId);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [baseData.nodes]);

  return (
    <div ref={ref} className='relative h-full w-full'>
      <div
        className='absolute inset-0 rounded-2xl'
        style={{
          background:
            'linear-gradient(179.6deg, rgba(255, 171, 213, 0.14) 6.53%, rgba(30, 4, 162, 0.112) 57.79%, rgba(255, 69, 40, 0.14) 106.18%)',
        }}
      />
      <ForceGraph2D
        ref={fgRef as any}
        width={width}
        height={height}
        graphData={data}
        cooldownTicks={0}
        nodeRelSize={1}
        enablePointerInteraction={true}
        d3AlphaDecay={1}
        d3VelocityDecay={1}
        d3AlphaMin={0}
        d3ReheatDecay={1}
        warmupTicks={0}
        numDimensions={2}
        linkColor={() => 'rgba(0,0,0,0.35)'}
        linkWidth={1.4}
        linkDirectionalParticles={0}
        onEngineStop={() => {
          if (hasFit) return;
          try {
            fgRef.current?.zoomToFit(400, 100);
            setHasFit(true);
            // Stop the simulation completely to allow our custom animation
            fgRef.current?.pauseAnimation();
            // Also try to stop the d3 force simulation
            const d3ForceGraph = (fgRef.current as any)?.d3Force;
            if (d3ForceGraph) {
              d3ForceGraph('charge', null);
              d3ForceGraph('link', null);
              d3ForceGraph('center', null);
            }
          } catch {}
        }}
        enableNodeDrag
        nodeCanvasObject={(
          n: KnowledgeNode & NodeObject,
          ctx: CanvasRenderingContext2D,
          globalScale: number
        ) => {
          const isSource = n.type === 'source';
          const rawRadius = n.size ?? (isSource ? 26 : 10);
          const radius = Math.max(
            6,
            Number.isFinite(rawRadius) ? Number(rawRadius) : 6
          );
          const x = (n as any).x as number;
          const y = (n as any).y as number;

          if (!Number.isFinite(x) || !Number.isFinite(y)) return;

          const gradient = ctx.createRadialGradient(x, y, 2, x, y, radius);
          const stops =
            n.colorStops ||
            (isSource
              ? [
                  { offset: 0, color: '#ffffff' },
                  { offset: 1, color: '#cccccc' },
                ]
              : [
                  { offset: 0, color: '#ffffff' },
                  { offset: 1, color: '#e6e6e6' },
                ]);
          stops.forEach(s => gradient.addColorStop(s.offset, s.color));

          // Node circle
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
          ctx.fillStyle = gradient;
          ctx.fill();

          // Icons for specific sources
          const sourceId = n.id;
          if (
            isSource &&
            (sourceId === 'notion' ||
              sourceId === 'confluence' ||
              sourceId === 'github')
          ) {
            const img = icons[sourceId];
            if (img && img.complete) {
              const size = radius * 1.1;
              ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
            }
          }

          // Inner subtle sheen for source nodes
          if (isSource) {
            const sheen = ctx.createRadialGradient(
              x - radius / 3,
              y - radius / 3,
              1,
              x,
              y,
              radius
            );
            sheen.addColorStop(0, 'rgba(255,255,255,0.35)');
            sheen.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = sheen;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
          }

          // Label pill beneath the node
          const fontScale = Math.max(12, 14 / (globalScale || 1));
          const pillY = y + radius + 22;
          drawPill(ctx, x, pillY, n.label, {
            paddingX: 12,
            paddingY: 4,
            radius: 12,
            bg: isSource ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.95)',
            color: '#111827',
            font: `${fontScale}px ui-sans-serif, system-ui, -apple-system`,
            shadow: isSource ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.15)',
          });
        }}
        nodePointerAreaPaint={(
          n: KnowledgeNode & NodeObject,
          color: string,
          ctx: CanvasRenderingContext2D
        ) => {
          const x = (n as any).x as number;
          const y = (n as any).y as number;
          if (!Number.isFinite(x) || !Number.isFinite(y)) return;

          const rawRadius = n.size ?? (n.type === 'source' ? 26 : 10);
          const radius = Math.max(
            6,
            Number.isFinite(rawRadius) ? Number(rawRadius) : 6
          );
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(x, y, radius + 12, 0, 2 * Math.PI, false);
          ctx.fill();
        }}
      />
    </div>
  );
};

export default KnowledgeGraph;
