export interface DataItem {
  type: string;
  data: {
    content?: any;
    [key: string]: any;
  };
}

export interface RequirementItem {
  id: string;
  title: string;
  type: 'epic' | 'story' | 'task';
  tags: string[];
  description?: string;
  priority?: string;
  estimation?: number;
  children?: RequirementItem[];
  epicId?: string;
  parentStoryId?: string;
}

/**
 * Formats requirements data from the AI agent stream into a hierarchical structure
 * @param data - Array of data items from the AI agent
 * @returns Array of formatted epic requirements with nested stories and tasks
 */
export function formatRequirementsData(data: DataItem[]): RequirementItem[] {
  if (!data || !Array.isArray(data)) return [];

  // Find the index data (single source of truth)
  const indexData = data.findLast(item => item.type === 'data-index')?.data
    ?.content;
  if (!indexData) return [];

  // Create maps for quick lookup
  const epicMap = new Map();
  const storyMap = new Map();
  const taskMap = new Map();

  // Process all data items to build maps
  data.forEach(item => {
    if (item.type === 'data-epic' && item.data?.content) {
      epicMap.set(item.data.content.id, item.data.content);
    } else if (item.type === 'data-story' && item.data?.content) {
      storyMap.set(item.data.content.id, item.data.content);
    } else if (item.type === 'data-task' && item.data?.content) {
      taskMap.set(item.data.content.id, item.data.content);
    }
  });

  // Build the hierarchical structure with flattened items
  return indexData.epics
    .map((epicRef: any) => {
      const epic = epicMap.get(epicRef.id);
      if (!epic) return null;

      const items: RequirementItem[] = [];

      // Add all stories for this epic
      epicRef.story_ids.forEach((storyId: string) => {
        const story = storyMap.get(storyId);
        if (!story) return;

        items.push({
          id: story.id,
          title: story.title,
          type: 'story',
          tags: story.labels || [],
          description: story.description,
          priority: story.priority,
          estimation: story.estimation,
          epicId: epic.id,
        });

        // Add tasks for this story
        const storyRef = indexData.stories.find((s: any) => s.id === storyId);
        storyRef?.task_ids?.forEach((taskId: string) => {
          const task = taskMap.get(taskId);
          if (task) {
            items.push({
              id: task.id,
              title: task.title,
              type: 'task',
              tags: task.labels || [],
              description: task.description,
              epicId: epic.id,
              parentStoryId: storyId,
            });
          }
        });
      });

      // Add tasks directly under the epic
      indexData.tasks
        .filter(
          (taskRef: any) => taskRef.epic_id === epic.id && !taskRef.story_id
        )
        .forEach((taskRef: any) => {
          const task = taskMap.get(taskRef.id);
          if (task) {
            items.push({
              id: task.id,
              title: task.title,
              type: 'task',
              tags: task.labels || [],
              description: task.description,
              epicId: epic.id,
            });
          }
        });

      return {
        id: epic.id,
        title: epic.title,
        type: 'epic',
        tags: epic.labels || [],
        description: epic.description,
        children: items,
      };
    })
    .filter(Boolean);
}

/**
 * Gets all requirement items in a flattened array (useful for searching/filtering)
 * @param requirements - Formatted requirements data
 * @returns Flattened array of all requirement items
 */
export function getFlattenedRequirements(
  requirements: RequirementItem[]
): RequirementItem[] {
  const flattened: RequirementItem[] = [];

  requirements.forEach(epic => {
    flattened.push(epic);
    if (epic.children) {
      flattened.push(...epic.children);
    }
  });

  return flattened;
}

/**
 * Finds a specific requirement item by ID
 * @param requirements - Formatted requirements data
 * @param id - ID of the requirement to find
 * @returns The found requirement item or null
 */
export function findRequirementById(
  requirements: RequirementItem[],
  id: string
): RequirementItem | null {
  for (const epic of requirements) {
    if (epic.id === id) return epic;
    if (epic.children) {
      const found = epic.children.find(child => child.id === id);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Gets related tasks for a specific story
 * @param requirements - Formatted requirements data
 * @param storyId - ID of the story
 * @returns Array of related tasks
 */
export function getRelatedTasks(
  requirements: RequirementItem[],
  storyId: string
): RequirementItem[] {
  return requirements
    .flatMap(epic => epic.children || [])
    .filter(child => child.parentStoryId === storyId);
}

/**
 * Gets the total count of epics, stories, and tasks individually
 * @param requirements - Formatted requirements data
 * @returns Object with counts for epics, stories, and tasks
 */
export function getRequirementsCount(requirements: RequirementItem[] = []): {
  epics: number;
  stories: number;
  tasks: number;
} {
  let epics = 0;
  let stories = 0;
  let tasks = 0;

  requirements.forEach(epic => {
    epics++;

    if (epic?.children) {
      epic?.children?.forEach(child => {
        if (child.type === 'story') {
          stories++;
        } else if (child.type === 'task') {
          tasks++;
        }
      });
    }
  });

  return { epics, stories, tasks };
}

/**
 * Converts requirements data to CSV format for Jira import
 * Follows Atlassian's CSV import guidelines for maintaining parent-child relationships
 * @param requirements - Formatted requirements data from formatRequirementsData
 * @returns CSV string content ready for clipboard copy
 */
export function convertRequirementsToCSV(
  requirements: RequirementItem[]
): string {
  if (!requirements || requirements.length === 0) return '';

  // CSV headers following Atlassian documentation
  const headers = [
    'issue type',
    'issue key',
    'issue id',
    'summary',
    'parent',
    'status',
    'priority',
    'estimation',
    'tags',
  ];

  const rows: string[][] = [];

  // Second pass: create CSV rows in hierarchical order
  const addToRows = (item: RequirementItem, parentId?: string) => {
    // Map requirement type to Jira issue type
    let issueType = 'Task';
    if (item.type === 'epic') issueType = 'Epic';
    else if (item.type === 'story') issueType = 'Story';

    // Create row with proper parent mapping using actual item.id
    const row = [
      issueType,
      item.id, // Use actual item.id for the key
      item.id, // Use actual item.id for Issue ID
      item.title || 'Untitled',
      issueType === 'Task' ? item?.parentStoryId || '' : parentId || '', // Parent Issue ID for hierarchy
      'To Do', // Default status for new items
      item.priority || 'Medium',
      item.estimation ? item.estimation.toString() : '',
      item.tags ? item.tags.join(', ') : '',
    ];

    rows.push(row);

    // Add children with this item as parent
    if (item.children) {
      item.children.forEach(child => {
        addToRows(child, item.id); // Pass the actual parent ID
      });
    }
  };

  // Start with epics (top level)
  requirements.forEach(epic => {
    addToRows(epic);
  });

  // Sort rows by type priority: Epic first, then Story, then Task
  rows.sort((a, b) => {
    const typeOrder = { Epic: 1, Story: 2, Task: 3 };
    const aType = a[0] as string;
    const bType = b[0] as string;
    return (
      typeOrder[aType as keyof typeof typeOrder] -
      typeOrder[bType as keyof typeof typeOrder]
    );
  });

  // Convert to CSV format
  const csvContent = [
    headers.join(','),
    ...rows.map(row =>
      row
        .map(cell => {
          // Escape commas and quotes in cell content
          const escaped = cell.replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(',')
    ),
  ].join('\n');

  return csvContent;
}

/**
 * Copies requirements data to clipboard as CSV for Jira import
 * @param requirements - Formatted requirements data
 */
export function copyRequirementsToClipboard(requirements: RequirementItem[]) {
  const csvContent = convertRequirementsToCSV(requirements);
  navigator.clipboard.writeText(csvContent);
}
