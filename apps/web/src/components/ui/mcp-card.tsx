import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  Edit,
  Trash2,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface MCP {
  id: string;
  name: string;
  config: string;
  status: 'active' | 'inactive';
  health: 'healthy' | 'warning' | 'error';
  lastUpdated: string;
}

interface MCPCardProps {
  mcp: MCP;
  onEdit?: (mcp: MCP) => void;
  onToggleStatus?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function MCPCard({
  mcp,
  onEdit,
  onToggleStatus,
  onDelete,
}: MCPCardProps) {
  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy':
        return <CheckCircle className='h-4 w-4 text-green-600' />;
      case 'warning':
        return <AlertCircle className='h-4 w-4 text-yellow-600' />;
      case 'error':
        return <XCircle className='h-4 w-4 text-red-600' />;
      default:
        return <Activity className='h-4 w-4 text-gray-600' />;
    }
  };

  const getHealthBadge = (health: string) => {
    const healthConfig = {
      healthy: {
        label: 'Healthy',
        className: 'bg-green-100 text-green-800 border-green-200',
      },
      warning: {
        label: 'Warning',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      },
      error: {
        label: 'Error',
        className: 'bg-red-100 text-red-800 border-red-200',
      },
    };

    const config =
      healthConfig[health as keyof typeof healthConfig] || healthConfig.error;

    return (
      <Badge variant='outline' className={config.className}>
        {getHealthIcon(health)}
        <span className='ml-1'>{config.label}</span>
      </Badge>
    );
  };

  const formatLastUpdated = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return 'Updated just now';
    if (diffInHours < 24) return `Updated ${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `Updated ${diffInDays}d ago`;
  };

  const handleEdit = () => onEdit?.(mcp);
  const handleToggleStatus = () => onToggleStatus?.(mcp.id);
  const handleDelete = () => onDelete?.(mcp.id);

  return (
    <Card>
      <CardContent className='p-6'>
        <div className='flex items-start justify-between'>
          <div className='flex-1 space-y-3'>
            {/* Header with icon and name */}
            <div className='flex items-center gap-3'>
              <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100'>
                <Settings className='h-4 w-4 text-blue-600' />
              </div>
              <h3 className='font-semibold'>{mcp.name}</h3>
            </div>

            {/* Status and Health badges */}
            <div className='flex items-center gap-3'>
              <Badge
                variant={mcp.status === 'active' ? 'default' : 'secondary'}
                className={
                  mcp.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-600'
                }
              >
                {mcp.status === 'active' ? 'Active' : 'Inactive'}
              </Badge>
              {getHealthBadge(mcp.health)}
              <span className='text-muted-foreground text-xs'>
                {formatLastUpdated(mcp.lastUpdated)}
              </span>
            </div>

            {/* JSON Configuration */}
            <div className='bg-muted rounded-md p-3'>
              <p className='text-muted-foreground font-mono text-xs break-all'>
                {mcp.config}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className='ml-4 flex items-center gap-2'>
            <Button variant='outline' size='sm' onClick={handleEdit}>
              <Edit className='h-4 w-4' />
            </Button>
            <Button variant='outline' size='sm' onClick={handleToggleStatus}>
              {mcp.status === 'active' ? 'Disable' : 'Enable'}
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={handleDelete}
              className='text-red-600 hover:text-red-700'
            >
              <Trash2 className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
