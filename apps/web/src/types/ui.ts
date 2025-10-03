// ========================================
// UI COMPONENT TYPES
// ========================================

export interface IconProps {
  className?: string;
  size?: number;
}

export interface MultiSelectOption {
  id: string;
  label: string;
  checked: boolean;
}

export interface BulletPoint {
  id: string;
  text: string;
}

export interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
  checked?: boolean;
  partiallyChecked?: boolean;
  data?: any;
}

export interface CreatedFileItem {
  name: string;
  language: string;
  code: string;
}

export interface MetricData {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
}

export interface FeatureData {
  title: string;
  status: 'completed' | 'in-progress' | 'planned';
  progress: number;
  dueDate: string;
}
