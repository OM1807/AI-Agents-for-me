'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

export interface TreeNode {
  id: string;
  label: string;
  icon?: string;
  url?: string;
  children?: TreeNode[];
  level?: number;
}

interface TreeViewProps {
  nodes: TreeNode[];
  selectedIds: Set<string>;
  onToggleNode: (nodeId: string) => void;
  className?: string;
}

interface TreeNodeItemProps {
  node: TreeNode;
  selectedIds: Set<string>;
  onToggleNode: (nodeId: string) => void;
  level?: number;
}

const TreeNodeItem = ({
  node,
  selectedIds,
  onToggleNode,
  level = 0,
}: TreeNodeItemProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedIds.has(node.id);

  const handleToggle = () => {
    onToggleNode(node.id);
  };

  const handleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div className='select-none'>
      <div
        className={cn(
          'hover:bg-muted/50 flex cursor-pointer items-center gap-2 px-3 py-2 transition-colors',
          'rounded-md'
        )}
        style={{ paddingLeft: `${12 + level * 20}px` }}
      >
        {hasChildren && (
          <button
            onClick={handleExpand}
            className='hover:bg-muted flex-shrink-0 rounded-sm p-0.5'
          >
            {isExpanded ? (
              <ChevronDown className='h-3 w-3' />
            ) : (
              <ChevronRight className='h-3 w-3' />
            )}
          </button>
        )}

        {!hasChildren && <div className='w-4' />}

        <Checkbox
          checked={isSelected}
          onCheckedChange={handleToggle}
          className='flex-shrink-0'
        />

        <div
          className='flex min-w-0 flex-1 items-center gap-2'
          onClick={handleToggle}
        >
          {node.icon && (
            <span className='flex-shrink-0 text-sm'>{node.icon}</span>
          )}
          <span className='truncate text-sm'>{node.label}</span>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {node.children!.map(child => (
            <TreeNodeItem
              key={child.id}
              node={child}
              selectedIds={selectedIds}
              onToggleNode={onToggleNode}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const TreeView = ({
  nodes,
  selectedIds,
  onToggleNode,
  className,
}: TreeViewProps) => {
  return (
    <div className={cn('space-y-1', className)}>
      {nodes.map(node => (
        <TreeNodeItem
          key={node.id}
          node={node}
          selectedIds={selectedIds}
          onToggleNode={onToggleNode}
        />
      ))}
    </div>
  );
};
