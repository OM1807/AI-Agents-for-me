// ========================================
// KNOWLEDGE GRAPH TYPES
// ========================================

import type { NodeType } from './common';

export type KnowledgeNode = {
  id: string;
  label: string;
  type: NodeType;
  size?: number;
  colorStops?: { offset: number; color: string; alpha?: number }[];
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
};

export type KnowledgeLink = {
  source: string;
  target: string;
};

export type GraphData = {
  nodes: KnowledgeNode[];
  links: KnowledgeLink[];
};
