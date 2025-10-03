export interface StreamDataItem {
  type: string;
  data: {
    content?: any;
    filename?: string;
    [key: string]: any;
  };
}

export interface TestCase {
  id: string;
  title: string;
  generatedCode: string;
  filename: string;
  endpoints: string[];
  status: 'pending' | 'completed' | 'failed';
}

// New interfaces for Postman support
export interface PostmanEvent {
  listen: 'prerequest' | 'test';
  script: {
    exec: string[];
    type: string;
  };
}

export interface PostmanTestCase extends TestCase {
  events: PostmanEvent[];
  framework: 'postman';
}

export interface PostmanItem {
  name: string;
  item?: PostmanItem[];
  event?: PostmanEvent[];
  request?: any;
}

export interface PostmanCollection {
  info: {
    name: string;
    description?: string;
  };
  item: PostmanItem[];
  variable?: any[];
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

export interface AutomationReportItem {
  project: string;
  successCount: number;
  failedCount: number;
  status: 'success' | 'failed' | 'mixed';
}

export interface ApiTestingSummary {
  testCasesAutomated: number;
  failed: number;
  totalEndpointsCovered: number;
  framework: string;
}

export interface ProcessedApiTestingData {
  summary: ApiTestingSummary;
  projects: Project[];
  automationReport: AutomationReportItem[];
}

/**
 * Formats API testing stream data into structured format for UI components
 * @param data - Array of stream data items from the API testing agent
 * @returns Processed data structure for ApiTestingReport components
 */
export function formatApiTestingData(
  data: StreamDataItem[]
): ProcessedApiTestingData {
  if (!data || !Array.isArray(data)) {
    return {
      summary: {
        testCasesAutomated: 0,
        failed: 0,
        totalEndpointsCovered: 0,
        framework: '',
      },
      projects: [],
      automationReport: [],
    };
  }

  // Find the latest data-index artifact (source of truth)
  const latestIndexArtifact = [...data]
    .reverse()
    .find((item: StreamDataItem) => {
      return item.type === 'data-index' && item.data?.content;
    });

  if (!latestIndexArtifact?.data?.content) {
    return {
      summary: {
        testCasesAutomated: 0,
        failed: 0,
        totalEndpointsCovered: 0,
        framework: '',
      },
      projects: [],
      automationReport: [],
    };
  }

  const indexData = latestIndexArtifact.data.content;
  const framework = indexData.framework;
  const artifacts =
    framework === 'postman'
      ? indexData.relevantArtifacts || []
      : (indexData.relevantArtifacts || []).filter(
          (artifact: any) => artifact.status !== 'deleted'
        );

  // Create map of test content by filename
  const testContentMap = new Map<string, any>();
  data.forEach(item => {
    if (item.type === 'data-test' && item.data?.content) {
      // Extract filename from the artifact data
      const filename = item.data.filename || item.data.artifact_id + '.ts';
      const content = item.data.content;
      testContentMap.set(filename, content);
    }
  });

  // Transform data based on framework
  const summary = transformToSummary(indexData, artifacts);
  const projects =
    framework === 'postman'
      ? transformPostmanProjects(artifacts, testContentMap)
      : transformToProjects(artifacts, testContentMap);
  const automationReport = transformToAutomationReport(projects);

  return {
    summary,
    projects,
    automationReport,
  };
}

/**
 * Transform index data to summary information
 */
function transformToSummary(
  indexData: any,
  artifacts: any[]
): ApiTestingSummary {
  const coverage = indexData.coverage || {};
  const failedCount = artifacts.filter(
    artifact => artifact.status === 'failed'
  ).length;

  return {
    testCasesAutomated: coverage.totalTestsWritten || artifacts.length,
    failed: failedCount,
    totalEndpointsCovered: coverage.totalEndpointsCovered || 0,
    framework: indexData.framework || 'playwright',
  };
}

/**
 * Transform artifacts and test content to project structure (Playwright)
 */
function transformToProjects(
  artifacts: any[],
  testContentMap: Map<string, string>
): Project[] {
  if (!artifacts.length) return [];

  // Group artifacts by module
  const moduleGroups = new Map<string, any[]>();

  artifacts.forEach(artifact => {
    const moduleName = artifact.module || 'default';
    if (!moduleGroups.has(moduleName)) {
      moduleGroups.set(moduleName, []);
    }
    moduleGroups.get(moduleName)!.push(artifact);
  });

  // Convert each module group to a project
  return Array.from(moduleGroups.entries()).map(
    ([moduleName, moduleArtifacts]) => {
      const testCases: TestCase[] = moduleArtifacts.map(artifact => ({
        id: artifact.filename.replace('.spec.ts', ''),
        title: artifact.test_case || artifact.filename,
        generatedCode:
          testContentMap.get(artifact.filename) ||
          '// Code generation in progress...',
        filename: artifact.filename,
        endpoints: artifact.endpoints || [],
        status: artifact.status || 'pending',
      }));

      return {
        id: moduleName,
        title: `${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)} Module Tests`,
        subtitle: `${testCases.length} test cases covering ${getTotalEndpoints(testCases)} endpoints`,
        testCases,
        module: moduleName,
        framework: 'playwright',
      };
    }
  );
}

/**
 * Transform artifacts and test content to project structure (Postman)
 */
function transformPostmanProjects(
  artifacts: any[],
  testContentMap: Map<string, any>
): Project[] {
  if (!artifacts.length) return [];

  return artifacts.map(artifact => {
    const collectionContent = testContentMap.get(artifact.filename);
    if (!collectionContent) {
      return {
        id: artifact.filename.replace('.json', ''),
        title: artifact.test_case || artifact.filename,
        subtitle: 'No collection data available',
        testCases: [],
        module: artifact.module || 'default',
        framework: 'postman',
        collectionStructure: null,
      };
    }

    try {
      const collection: PostmanCollection =
        typeof collectionContent === 'string'
          ? JSON.parse(collectionContent)
          : collectionContent;

      const collectionStructure = buildPostmanHierarchy(collection);
      const flatTestCases = extractFlatTestCases(collection, artifact);

      return {
        id: artifact.filename.replace('.json', ''),
        title: collection.info.name || artifact.test_case || artifact.filename,
        subtitle: `${flatTestCases.length} test requests covering ${getUniqueEndpointsFromPostman(flatTestCases)} endpoints`,
        testCases: flatTestCases,
        module: artifact.module || 'default',
        framework: 'postman',
        collectionStructure,
      };
    } catch (error) {
      console.error('Error parsing Postman collection:', error);
      return {
        id: artifact.filename.replace('.json', ''),
        title: artifact.test_case || artifact.filename,
        subtitle: 'Error parsing collection',
        testCases: [
          {
            id: artifact.filename.replace('.json', ''),
            title: 'Error parsing Postman collection',
            generatedCode: '// Error parsing Postman collection',
            filename: artifact.filename,
            endpoints: artifact.endpoints || [],
            status: 'failed',
          },
        ],
        module: artifact.module || 'default',
        framework: 'postman',
        collectionStructure: null,
      };
    }
  });
}

/**
 * Build hierarchical structure from Postman collection
 */
function buildPostmanHierarchy(
  collection: PostmanCollection
): PostmanHierarchyNode[] {
  function buildNode(
    item: PostmanItem,
    path: string[] = []
  ): PostmanHierarchyNode {
    const nodeId = generatePostmanTestCaseId(path, item.name);

    if (item.item && item.item.length > 0) {
      // This is a folder
      return {
        id: nodeId,
        name: item.name,
        type: 'folder',
        children: item.item.map(child =>
          buildNode(child, [...path, item.name])
        ),
      };
    } else {
      // This is a request
      const events =
        item.event?.filter(
          event => event.listen === 'prerequest' || event.listen === 'test'
        ) || [];

      return {
        id: nodeId,
        name: item.name,
        type: 'request',
        events: events,
        request: item.request,
      };
    }
  }

  return collection.item.map(item => buildNode(item));
}

/**
 * Extract flat test cases for backward compatibility
 */
function extractFlatTestCases(
  collection: PostmanCollection,
  artifact: any
): TestCase[] {
  const testCases: TestCase[] = [];

  function traverseItems(items: PostmanItem[], path: string[] = []): void {
    items.forEach(item => {
      if (item.item && item.item.length > 0) {
        traverseItems(item.item, [...path, item.name]);
      } else if (item.event && item.event.length > 0) {
        const events = item.event.filter(
          event => event.listen === 'prerequest' || event.listen === 'test'
        );

        if (events.length > 0) {
          const testCase: PostmanTestCase = {
            id: generatePostmanTestCaseId(path, item.name),
            title: item.name,
            generatedCode: formatPostmanEventsAsCode(events),
            filename: artifact.filename,
            endpoints: extractEndpointsFromRequest(item.request),
            status: artifact.status || 'pending',
            events: events,
            framework: 'postman',
          };
          testCases.push(testCase);
        }
      }
    });
  }

  traverseItems(collection.item);
  return testCases;
}

/**
 * Generate unique ID for Postman test case based on path
 */
function generatePostmanTestCaseId(path: string[], itemName: string): string {
  return [...path, itemName]
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function getPostmanEventLabel(eventType: 'prerequest' | 'test'): string {
  return eventType === 'prerequest'
    ? 'Pre Request Script'
    : 'Post Response Script';
}

/**
 * Format Postman events as code for display
 */
function formatPostmanEventsAsCode(events: PostmanEvent[]): string {
  return events
    .map(event => {
      const code = event.script.exec.join('\n');
      const scriptLabel = getPostmanEventLabel(event.listen).toUpperCase();
      return `// ${scriptLabel}\n${code}`;
    })
    .join('\n\n');
}

/**
 * Extract endpoints from Postman request object
 */
function extractEndpointsFromRequest(request: any): string[] {
  if (!request || !request.url) return [];

  try {
    if (typeof request.url === 'string') {
      return [request.url];
    } else if (request.url.raw) {
      return [request.url.raw];
    } else if (request.url.path) {
      return [`/${request.url.path.join('/')}`];
    }
  } catch (error) {
    console.error('Error extracting endpoints from request:', error);
  }

  return [];
}

/**
 * Count unique endpoints from Postman test cases
 */
function getUniqueEndpointsFromPostman(testCases: TestCase[]): number {
  const uniqueEndpoints = new Set<string>();
  testCases.forEach(tc => {
    tc.endpoints.forEach(endpoint => uniqueEndpoints.add(endpoint));
  });
  return uniqueEndpoints.size;
}

/**
 * Transform projects to automation report data
 */
function transformToAutomationReport(
  projects: Project[]
): AutomationReportItem[] {
  return projects.map(project => {
    const successCount = project.testCases.filter(
      tc => tc.status === 'completed'
    ).length;
    const failedCount = project.testCases.filter(
      tc => tc.status === 'failed'
    ).length;

    let status: 'success' | 'failed' | 'mixed' = 'success';
    if (failedCount > 0 && successCount > 0) {
      status = 'mixed';
    } else if (failedCount > 0) {
      status = 'failed';
    }

    return {
      project: project.title,
      successCount,
      failedCount,
      status,
    };
  });
}

/**
 * Helper to count total unique endpoints across test cases
 */
function getTotalEndpoints(testCases: TestCase[]): number {
  const uniqueEndpoints = new Set<string>();
  testCases.forEach(tc => {
    tc.endpoints.forEach(endpoint => uniqueEndpoints.add(endpoint));
  });
  return uniqueEndpoints.size;
}

/**
 * Gets the processing status of the API testing suite
 */
export function getProcessingStatus(data: StreamDataItem[]): {
  isComplete: boolean;
  hasIndex: boolean;
  testFilesCount: number;
  expectedTestFiles: number;
} {
  const latestIndex = [...data]
    .reverse()
    .find(item => item.type === 'data-index');
  const testFiles = data.filter(item => item.type === 'data-test');

  const expectedCount =
    latestIndex?.data?.content?.relevantArtifacts?.length || 0;

  return {
    isComplete: testFiles.length >= expectedCount && expectedCount > 0,
    hasIndex: !!latestIndex,
    testFilesCount: testFiles.length,
    expectedTestFiles: expectedCount,
  };
}
