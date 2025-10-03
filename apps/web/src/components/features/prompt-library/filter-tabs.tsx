'use client';

import { Button } from '@/components/ui/button';
import { CategoryFilter, PromptCategory } from '@/lib/constants/prompt-library';

interface FilterTabsProps {
  categories: CategoryFilter[];
  activeCategory: PromptCategory;
  onCategoryChange: (category: PromptCategory) => void;
}

export const FilterTabs = ({
  categories,
  activeCategory,
  onCategoryChange,
}: FilterTabsProps) => {
  const handleCategoryClick = (category: PromptCategory) => {
    onCategoryChange(category);
  };

  const handleKeyDown = (
    event: React.KeyboardEvent,
    category: PromptCategory
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleCategoryClick(category);
    }
  };

  return (
    <div className='flex items-center gap-2'>
      {categories.map(category => {
        const IconComponent = category.icon;
        const isActive = activeCategory === category.id;

        return (
          <Button
            key={category.id}
            variant={isActive ? 'default' : 'ghost'}
            size='sm'
            onClick={() => handleCategoryClick(category.id)}
            onKeyDown={e => handleKeyDown(e, category.id)}
            tabIndex={0}
            aria-label={`Filter by ${category.label}`}
            className={`flex cursor-pointer items-center gap-2 ${
              isActive
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {IconComponent && <IconComponent className='h-4 w-4' />}
            {category.label}
          </Button>
        );
      })}
    </div>
  );
};
