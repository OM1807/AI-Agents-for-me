'use client';

import { useHeader } from '@/hooks/useHeader';

const Header = () => {
  const { title } = useHeader();

  return (
    <header className='bg-background border-border flex h-16 items-center justify-between border-b px-6'>
      <h1 className='text-foreground text-xl font-semibold'>{title}</h1>
    </header>
  );
};

export default Header;
