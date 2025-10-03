import { saveAs } from 'file-saver';
import JSZip from 'jszip';

interface TestCase {
  id: string;
  title: string;
  type: 'functional' | 'edge' | 'negative' | 'regression';
  description: string;
  priority: string;
  environment: string;
  module: string;
  preconditions?: string[];
  test_steps?: Array<{
    step_id: string;
    action: string;
    test_data?: string;
    expected_result?: string;
  }>;
  steps?: Array<{
    step: number;
    action: string;
    test_data?: string | null;
    expected?: string;
  }>;
  expected_result?: string;
  expected_results?: string[];
}

interface TestCaseSource {
  type: string;
  provider: string;
  properties: {
    key?: string;
    id?: string;
    url?: string;
    title: string;
  };
  test_case_index: Array<{
    id: string;
    title: string;
    type: string;
    file: string;
  }>;
}

interface GroupedTestCases {
  functional: TestCase[];
  edge: TestCase[];
  negative: TestCase[];
  regression: TestCase[];
}

interface SourceWithTestCases {
  source: TestCaseSource;
  artifactId: string;
  testCases: GroupedTestCases;
}

// Helper function to map test case type to BrowserStack format
const mapTestCaseType = (type: string): string => {
  switch (type) {
    case 'functional':
      return 'Manual';
    case 'edge':
      return 'Manual';
    case 'negative':
      return 'Security';
    case 'regression':
      return 'Automated';
    default:
      return 'Manual';
  }
};

// Helper function to format test steps for CSV
const formatStepsForCSV = (testCase: TestCase): string => {
  const steps = testCase.test_steps || (testCase as any).steps || [];
  if (steps.length === 0) return '';

  return steps
    .map((step: any, index: number) => {
      const stepNum = step.step || step.step_id || index + 1;
      return `${stepNum}. ${step.action}`;
    })
    .join('\n');
};

// Helper function to format expected results for CSV
const formatExpectedResultsForCSV = (testCase: TestCase): string => {
  if (testCase.expected_result) {
    return testCase.expected_result;
  }
  if (
    (testCase as any).expected_results &&
    Array.isArray((testCase as any).expected_results)
  ) {
    return (testCase as any).expected_results.join('\n');
  }
  return testCase.description || '';
};

// Helper function to escape CSV values
const escapeCSVValue = (value: string): string => {
  if (value.includes('"') || value.includes(',') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

// Export single source as CSV
export const exportSourceAsCSV = (sourceData: SourceWithTestCases): void => {
  // CSV Headers
  const headers = [
    'Test Case ID',
    'Title',
    'Folder',
    'State',
    'Tags',
    'Steps',
    'Results',
    'Type of Test Case',
    'Priority',
    'Estimate',
    'Owner',
    'Jira Issues',
  ];

  // Combine all test cases
  const allTestCases = [
    ...sourceData.testCases.functional,
    ...sourceData.testCases.edge,
    ...sourceData.testCases.negative,
    ...sourceData.testCases.regression,
  ];

  // Create CSV rows
  const rows = allTestCases.map(testCase => {
    return [
      testCase.id,
      testCase.title,
      testCase.module || '', // Folder
      'Active', // State (default to Active)
      testCase.type, // Tags
      formatStepsForCSV(testCase),
      formatExpectedResultsForCSV(testCase),
      mapTestCaseType(testCase.type),
      (testCase.priority || 'medium').charAt(0).toUpperCase() +
        (testCase.priority || 'medium').slice(1).toLowerCase(),
      '', // Estimate
      '', // Owner
      '', // Jira Issues
    ].map(escapeCSVValue);
  });

  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const identifier =
    sourceData.source.properties.key ||
    sourceData.source.properties.id ||
    'test-cases';
  saveAs(blob, `${identifier}-test-cases.csv`);
};

// Parse data to extract sources with test cases
export const parseTestCaseData = (data: any[]): SourceWithTestCases[] => {
  if (!data || data.length === 0) return [];

  const sourcesMap = new Map<string, SourceWithTestCases>();
  const allTestCases = new Map<
    string,
    { testCase: TestCase; filePath: string }
  >();

  // First pass: collect all test cases and sources
  data.forEach((item: any) => {
    if (item.type === 'data-source' && item.data?.content) {
      const content = item.data.content as TestCaseSource;
      if ('properties' in content) {
        sourcesMap.set(item.data.artifact_id, {
          source: content,
          artifactId: item.data.artifact_id,
          testCases: {
            functional: [],
            edge: [],
            negative: [],
            regression: [],
          },
        });
      }
    } else if (item.type === 'data-testcase' && item.data?.content) {
      const testCase = item.data.content as TestCase;
      allTestCases.set(testCase.id, {
        testCase,
        filePath: item.data.file_path,
      });
    }
  });

  // Second pass: assign test cases to sources
  allTestCases.forEach(({ testCase, filePath }, testCaseId) => {
    let assigned = false;

    sourcesMap.forEach(sourceData => {
      const isInIndex = sourceData.source.test_case_index?.some(
        indexItem => indexItem.id === testCaseId
      );

      if (isInIndex) {
        const type = testCase.type as keyof GroupedTestCases;
        if (
          sourceData.testCases[type] &&
          !sourceData.testCases[type].some(tc => tc.id === testCaseId)
        ) {
          sourceData.testCases[type].push(testCase);
          assigned = true;
        }
      }
    });

    if (!assigned) {
      sourcesMap.forEach((sourceData, sourceId) => {
        if (filePath.includes(sourceId)) {
          const isExcluded =
            sourceData.source.test_case_index &&
            !sourceData.source.test_case_index.some(
              item => item.id === testCaseId
            );

          if (!isExcluded) {
            const type = testCase.type as keyof GroupedTestCases;
            if (
              sourceData.testCases[type] &&
              !sourceData.testCases[type].some(tc => tc.id === testCaseId)
            ) {
              sourceData.testCases[type].push(testCase);
            }
          }
        }
      });
    }
  });

  return Array.from(sourcesMap.values());
};

// Copy single test case as JSON
export const copyTestCaseAsJSON = (testCase: TestCase): void => {
  const jsonContent = JSON.stringify(testCase, null, 2);
  navigator.clipboard.writeText(jsonContent);
};

// Copy single source with all test cases as JSON
export const copySourceAsJSON = (sourceData: SourceWithTestCases): void => {
  const fullStructure = {
    source: {
      type: sourceData.source.type,
      provider: sourceData.source.provider,
      properties: sourceData.source.properties,
    },
    testCases: {
      functional: sourceData.testCases.functional,
      edge: sourceData.testCases.edge,
      negative: sourceData.testCases.negative,
      regression: sourceData.testCases.regression,
    },
    summary: {
      totalTestCases:
        sourceData.testCases.functional.length +
        sourceData.testCases.edge.length +
        sourceData.testCases.negative.length +
        sourceData.testCases.regression.length,
      byType: {
        functional: sourceData.testCases.functional.length,
        edge: sourceData.testCases.edge.length,
        negative: sourceData.testCases.negative.length,
        regression: sourceData.testCases.regression.length,
      },
    },
  };

  const jsonContent = JSON.stringify(fullStructure, null, 2);
  navigator.clipboard.writeText(jsonContent);
};

// Copy all sources as structured JSON
export const copyAllTestCasesAsJSON = (data: any[]): void => {
  const sources = parseTestCaseData(data);

  const structuredData = sources.map(sourceData => ({
    source: {
      type: sourceData.source.type,
      provider: sourceData.source.provider,
      properties: sourceData.source.properties,
    },
    testCases: {
      functional: sourceData.testCases.functional,
      edge: sourceData.testCases.edge,
      negative: sourceData.testCases.negative,
      regression: sourceData.testCases.regression,
    },
    summary: {
      totalTestCases:
        sourceData.testCases.functional.length +
        sourceData.testCases.edge.length +
        sourceData.testCases.negative.length +
        sourceData.testCases.regression.length,
      byType: {
        functional: sourceData.testCases.functional.length,
        edge: sourceData.testCases.edge.length,
        negative: sourceData.testCases.negative.length,
        regression: sourceData.testCases.regression.length,
      },
    },
  }));

  const jsonContent = JSON.stringify(structuredData, null, 2);
  navigator.clipboard.writeText(jsonContent);
};

// Export all sources as individual CSV files in a ZIP
export const exportAllTestCasesAsZip = async (data: any[]): Promise<void> => {
  const sources = parseTestCaseData(data);

  if (sources.length === 0) {
    console.warn('No test case data found to export');
    return;
  }

  const zip = new JSZip();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

  sources.forEach(sourceData => {
    // CSV Headers
    const headers = [
      'Test Case ID',
      'Title',
      'Folder',
      'State',
      'Tags',
      'Steps',
      'Results',
      'Type of Test Case',
      'Priority',
      'Estimate',
      'Owner',
      'Jira Issues',
    ];

    // Combine all test cases
    const allTestCases = [
      ...sourceData.testCases.functional,
      ...sourceData.testCases.edge,
      ...sourceData.testCases.negative,
      ...sourceData.testCases.regression,
    ];

    // Create CSV rows
    const rows = allTestCases.map(testCase => {
      return [
        testCase.id,
        testCase.title,
        testCase.module || '',
        'Active',
        testCase.type,
        formatStepsForCSV(testCase),
        formatExpectedResultsForCSV(testCase),
        mapTestCaseType(testCase.type),
        (testCase.priority || 'medium').charAt(0).toUpperCase() +
          (testCase.priority || 'medium').slice(1).toLowerCase(),
        '',
        '',
        '',
      ].map(escapeCSVValue);
    });

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    // Add to zip
    const identifier =
      sourceData.source.properties.key ||
      sourceData.source.properties.id ||
      `source-${sourceData.artifactId}`;
    zip.file(`${identifier}-test-cases.csv`, csvContent);
  });

  // Generate and download zip
  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `test-cases-export-${timestamp}.zip`);
};
