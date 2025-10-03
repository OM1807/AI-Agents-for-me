import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function Page() {
  return (
    <div className='space-y-6'>
      {/* Page Header */}
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Dashboard</h1>
        <p className='text-muted-foreground'>
          Welcome to SDLC Agents - Your intelligent development assistant
        </p>
      </div>

      {/* Dashboard Content */}
      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>
              Overview of your development activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>42</div>
            <p className='text-muted-foreground text-xs'>
              +20% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Projects</CardTitle>
            <CardDescription>Projects currently in development</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>12</div>
            <p className='text-muted-foreground text-xs'>+2 new this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Code Quality</CardTitle>
            <CardDescription>Average code quality score</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>94%</div>
            <p className='text-muted-foreground text-xs'>+5% improvement</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest development activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <div className='flex items-center space-x-4'>
              <div className='bg-primary h-2 w-2 rounded-full'></div>
              <div className='flex-1'>
                <p className='text-sm font-medium'>Code review completed</p>
                <p className='text-muted-foreground text-xs'>2 hours ago</p>
              </div>
            </div>
            <div className='flex items-center space-x-4'>
              <div className='bg-primary h-2 w-2 rounded-full'></div>
              <div className='flex-1'>
                <p className='text-sm font-medium'>New feature deployed</p>
                <p className='text-muted-foreground text-xs'>1 day ago</p>
              </div>
            </div>
            <div className='flex items-center space-x-4'>
              <div className='bg-primary h-2 w-2 rounded-full'></div>
              <div className='flex-1'>
                <p className='text-sm font-medium'>Database optimized</p>
                <p className='text-muted-foreground text-xs'>3 days ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
