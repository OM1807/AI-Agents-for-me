'use client';

import Link from 'next/link';
import {
  House,
  Code,
  Package,
  ShieldCheck,
  BookOpen,
  Question,
  Gear,
  CaretRight,
  CaretLeft,
  SignOut,
  type IconProps,
} from '@phosphor-icons/react';

import { Avatar } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

import { LogoShort } from '@/components/icons/Logo';
import { useUser } from '@/hooks/useUser';
import { useOAuth } from '@/hooks/useOAuth';
import { useProject } from '@/hooks/useProject';
import { useHeader } from '@/hooks/useHeader';

interface NavigationItem {
  title: string;
  href: string;
  icon: React.ComponentType<IconProps>;
}

const navigationItems: NavigationItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: House,
  },
  {
    title: 'Development',
    href: '/development',
    icon: Code,
  },
  {
    title: 'Product Management',
    href: '/product-management',
    icon: Package,
  },
  {
    title: 'Quality Assurance',
    href: '/quality-assurance',
    icon: ShieldCheck,
  },
  {
    title: 'Prompt Library',
    href: '/prompt-library',
    icon: BookOpen,
  },
];

const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { name, resetUser } = useUser();
  const { resetConnections } = useOAuth();
  const { resetProject } = useProject();
  const { isCollapsed, setIsCollapsed, resetAll } = useHeader();

  const handleLogout = () => {
    resetUser();
    resetConnections();
    resetProject();
    resetAll();
    router.push('/login');
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div
      className={cn(
        'relative flex h-full flex-col text-white transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-16' : 'w-64'
      )}
      style={{
        background: 'linear-gradient(180deg, #070220 -15.43%, #160A53 100%)',
      }}
    >
      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        className={cn(
          'absolute top-14 -right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#342487] bg-[#150a4f] text-white shadow-lg transition-all duration-200',
          'focus-visible:ring-2 focus-visible:outline-none'
        )}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? (
          <CaretRight size={12} weight='bold' />
        ) : (
          <CaretLeft size={12} weight='bold' />
        )}
      </button>

      <div
        className={cn(
          'mb-6 flex items-center gap-2',
          isCollapsed ? 'justify-center px-3 py-6' : 'p-6'
        )}
      >
        <LogoShort className='h-8 w-8 flex-shrink-0' />
        {!isCollapsed && <span className='text-2xl font-bold'>SDLC Agents</span>}
      </div>

      <nav className={cn('flex-1', isCollapsed ? 'px-2' : 'px-4')}>
        <ul className='space-y-2'>
          {navigationItems.map(item => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200',
                    'hover:bg-white/10',
                    'focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:outline-none',
                    isCollapsed ? 'justify-center px-3 py-3' : 'px-3 py-3'
                  )}
                  style={
                    isActive
                      ? {
                          background: '#2A1E65',
                          color: 'white',
                        }
                      : {}
                  }
                  tabIndex={0}
                  aria-label={`Navigate to ${item.title}`}
                  title={isCollapsed ? item.title : undefined}
                >
                  <Icon size={24} weight='regular' className='flex-shrink-0' />
                  {!isCollapsed && <span className='flex-1'>{item.title}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div
        className={cn('border-t border-slate-700', isCollapsed ? 'p-2' : 'p-4')}
      >
        <Link
          href='/help'
          className={cn(
            'mb-4 flex items-center gap-3 rounded-lg text-sm text-slate-300 transition-colors',
            'hover:bg-white/5 hover:text-white',
            'focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:outline-none',
            isCollapsed ? 'justify-center px-3 py-2' : 'px-3 py-2'
          )}
          style={
            pathname === '/help'
              ? {
                  background: '#2A1E65',
                  color: 'white',
                }
              : {}
          }
          title={isCollapsed ? 'Help & Support' : undefined}
        >
          <Question size={24} weight='regular' className='flex-shrink-0' />
          {!isCollapsed && <span>Help & Support</span>}
        </Link>

        {/* Settings */}
        <Link
          href='/settings'
          className={cn(
            'mb-4 flex items-center gap-3 rounded-lg text-sm text-slate-300 transition-colors',
            'hover:bg-white/5 hover:text-white',
            'focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:outline-none',
            isCollapsed ? 'justify-center px-3 py-2' : 'px-3 py-2'
          )}
          style={
            pathname === '/settings'
              ? {
                  background: '#2A1E65',
                  color: 'white',
                }
              : {}
          }
          title={isCollapsed ? 'Settings' : undefined}
        >
          <Gear size={24} weight='regular' className='flex-shrink-0' />
          {!isCollapsed && <span>Settings</span>}
        </Link>

        {/* User Profile */}
        <div
          className={cn(
            'flex items-center gap-3 rounded-lg',
            isCollapsed ? 'justify-center px-2 py-2' : 'px-3 py-2'
          )}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  'flex items-center gap-3 rounded-lg transition-all duration-200',
                  'hover:bg-white/5',
                  'focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:outline-none',
                  isCollapsed ? 'p-0' : 'w-full'
                )}
                aria-label='User menu'
              >
                <Avatar>
                  {name
                    ?.split(' ')
                    .map(word => word.charAt(0).toUpperCase())
                    .join('') ?? 'UA'}
                </Avatar>
                {!isCollapsed && (
                  <>
                    <div className='flex-1 text-left'>
                      <p className='text-sm font-medium text-white'>
                        {name ?? 'user'}
                      </p>
                    </div>
                    <CaretRight
                      size={20}
                      weight='regular'
                      className='text-slate-400'
                    />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align={isCollapsed ? 'center' : 'end'}
              className='w-48'
            >
              <DropdownMenuItem
                onClick={handleLogout}
                className='flex cursor-pointer items-center gap-2'
              >
                <SignOut size={16} weight='regular' />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
