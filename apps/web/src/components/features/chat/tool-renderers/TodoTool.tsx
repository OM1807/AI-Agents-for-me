import React from 'react';
import { CheckSquare, CheckCircle, Circle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TodoToolProps {
  toolInvocation: any;
  state: string;
  index: string;
}

export const TodoTool: React.FC<TodoToolProps> = ({
  toolInvocation,
  state,
  index,
}) => {
  const args = 'args' in toolInvocation ? toolInvocation.args : undefined;
  const todos = args?.todos || [];

  // Calculate completion statistics
  const completedCount = todos.filter(
    (todo: any) => todo.status?.toLowerCase() === 'completed'
  ).length;
  const totalCount = todos.length;

  const getStatusText = () => {
    if (state === 'result') return `${completedCount}/${totalCount} done`;
    if (state === 'call') return 'Updating...';
    return 'Ready';
  };

  const getTodoIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return (
          <CheckCircle className='h-2.5 w-2.5 flex-shrink-0' color='#4a20f5' />
        );
      case 'in-progress':
      case 'in_progress':
        return <Clock color='#4a20f5' className='h-2.5 w-2.5 flex-shrink-0' />;
      case 'pending':
      default:
        return <Circle color='#4a20f5' className='h-2.5 w-2.5 flex-shrink-0' />;
    }
  };

  return (
    <div key={index} className='mb-2 max-w-full'>
      <div className='overflow-hidden rounded-lg bg-gray-50 p-3'>
        {/* First line: Todo List with icon and status side by side */}
        <div className='mb-1.5 flex items-center justify-between border-b border-gray-200 pb-2'>
          <div className='flex items-center gap-2'>
            <CheckSquare size={16} color='#4a20f5' />
            <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
              Todo List
            </span>
          </div>
          <div className='flex items-center gap-1.5'>
            <Badge variant='default'>{getStatusText()}</Badge>
          </div>
        </div>

        {/* Todo list - all todos with small font */}
        {todos.length > 0 && (
          <div className='mt-2 max-w-full space-y-0.5'>
            {todos.map((todo: any, todoIndex: number) => (
              <div
                key={todo.id || todoIndex}
                className='group flex items-center gap-1.5'
              >
                <div className='flex-shrink-0'>{getTodoIcon(todo.status)}</div>
                <span
                  className={`flex-1 overflow-hidden text-xs leading-tight break-words ${
                    todo.status?.toLowerCase() === 'completed'
                      ? 'text-gray-500 line-through dark:text-gray-400'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                  style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                  title={todo.content}
                >
                  {todo.content}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
