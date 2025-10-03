import {
  AutomationReportItem,
  StreamDataItem,
} from '@/lib/utils/api-testing-formatter';
import { ApiSpec, ApiTestCase } from '@/types';
import { Message } from '@ai-sdk/react';

export interface ApiSpecComponentProps {
  onSpecSelect?: (specId: string) => void;
  onSpecRemove?: (specId: string) => void;
  className?: string;
}

export interface ApiSpecListProps {
  specs: ApiSpec[];
  selectedSpecs: string[];
  onToggleSpec: (specId: string) => void;
  onRemoveSpec: (specId: string) => void;
}

export interface ApiSpecCardProps {
  spec: ApiSpec;
  isSelected?: boolean;
  onToggle?: () => void;
  onRemove: () => void;
}

export interface TestCasesComponentProps {
  onTestCaseSelect?: (testCaseId: string) => void;
  onTestCaseRemove?: (testCaseId: string) => void;
  className?: string;
}

export interface TestCasesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface TestCasesListProps {
  testCases: ApiTestCase[];
  selectedTestCases: string[];
  onToggleTestCase: (testCaseId: string) => void;
  onRemoveTestCase: (testCaseId: string) => void;
}

export interface TestCasesCardProps {
  testCase: ApiTestCase;
  isSelected: boolean;
  onToggle: () => void;
  onRemove: () => void;
}

export interface ApiAutomationFrameworkSelectorProps {
  className?: string;
}
export interface ApiTestingReportProps {
  data: StreamDataItem[];
  append: (message: Message) => void;
}

export type ViewType = 'code' | 'automation';

export interface AutomationReportTableProps {
  data: AutomationReportItem[];
  append: (message: any) => void;
}

export interface TestCase {
  id: string;
  title: string;
  generatedCode: string;
  filename: string;
  endpoints: string[];
  status: 'pending' | 'completed' | 'failed';
}

export interface PostmanEvent {
  listen: 'prerequest' | 'test';
  script: {
    exec: string[];
    type: string;
  };
}

export interface PostmanHierarchyNode {
  id: string;
  name: string;
  type: 'folder' | 'request';
  children?: PostmanHierarchyNode[];
  events?: PostmanEvent[];
  request?: any;
}

export interface Project {
  id: string;
  title: string;
  subtitle: string;
  testCases: TestCase[];
  module: string;
  framework?: string;
  collectionStructure?: PostmanHierarchyNode[] | null;
}

export interface CodeGeneratedViewProps {
  projects: Project[];
  append: (message: Message) => void;
}

// Reusable AI Popover Component
export interface AIPopoverProps {
  itemId: string;
  placeholder: string;
  onSendMessage: (title: string) => void;
  openPopover: string | null;
  setOpenPopover: (id: string | null) => void;
  inputValue: string;
  setInputValue: (value: string) => void;
}

export interface UploadedFile {
  id: string;
  name: string;
  status: 'uploading' | 'completed' | 'error';
  progress?: number;
  size?: number;
  type?: string;
  file?: File;
}

export interface SummaryCardsProps {
  testCasesAutomated: number;
  failed: number;
}

export interface ActionBarProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  onCreatePR: () => void;
  showCreatePR?: boolean;
}
