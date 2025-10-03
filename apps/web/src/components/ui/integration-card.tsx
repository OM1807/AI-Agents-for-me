import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';

interface Integration {
  mcp_type: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'connected' | 'disconnected';
  statusText: string;
  buttonText: string;
}

interface IntegrationCardProps {
  integration: Integration;
  onConnect?: (integrationId: string) => void;
}

export function IntegrationCard({
  integration,
  onConnect,
}: IntegrationCardProps) {
  const handleConnect = () => {
    onConnect?.(integration.mcp_type);
  };

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center gap-3'>
          <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-gray-900'>
            <integration.icon className='h-6 w-6 text-white' />
          </div>
          <div>
            <CardTitle>{integration.name}</CardTitle>
            <CardDescription>{integration.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-sm font-medium'>Status</p>
            <p className='text-muted-foreground text-xs'>
              {integration.statusText}
            </p>
          </div>
          <Badge
            variant='outline'
            className={
              integration.status === 'connected'
                ? 'border-green-200 bg-green-50 text-green-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }
          >
            {integration.status === 'connected' ? 'Connected' : 'Disconnected'}
          </Badge>
        </div>

        {/* Conditionally render button based on connection status */}
        {integration.status === 'connected' ? (
          <Button className='w-full' disabled variant='outline'>
            <Check className='mr-2 h-4 w-4' />
            Connected
          </Button>
        ) : (
          onConnect && (
            <Button className='w-full' onClick={handleConnect}>
              <integration.icon className='mr-2 h-4 w-4' />
              {integration.buttonText}
            </Button>
          )
        )}
      </CardContent>
    </Card>
  );
}
