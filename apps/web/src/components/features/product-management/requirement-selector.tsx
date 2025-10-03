'use client';
import { Fragment, useCallback, useEffect, useState } from 'react';
import { Toggle } from '@/components/ui/toggle';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import SectionWrapper from '@/components/shared/SectionWrapper';
import { GitIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import BulletPoints from '@/components/shared/BulletPoints';
import { GENERAL_INFO_BULLET_POINTS } from '@/lib/constants/product-management';
import { useProject } from '@/hooks/useProject';

type SubOption = { title: string; checked: boolean; id: string };
type Option = {
  title: string;
  checked: boolean;
  subOptions: SubOption[];
};

const OPTIONS = {
  epic: {
    title: 'Epics',
    checked: true, // Always enabled, cannot be turned off
    subOptions: [
      { title: 'General Info', checked: true, id: 'general_info' }, // Always enabled for epics
      { title: 'Tags', checked: false, id: 'tags' },
    ],
  },
  story: {
    title: 'Stories',
    checked: true, // Always enabled, cannot be turned off
    subOptions: [
      { title: 'General Info', checked: true, id: 'general_info' }, // Always enabled for stories
      { title: 'Attachments', checked: false, id: 'references' },
      { title: 'Priority', checked: false, id: 'priority' },
      { title: 'Estimation', checked: false, id: 'estimation' },
      { title: 'Labels / Components', checked: false, id: 'labels' },
    ],
  },
  task: {
    title: 'Tasks',
    checked: false,
    subOptions: [
      { title: 'General Info', checked: false, id: 'general_info' },
      { title: 'Attachments / References', checked: false, id: 'references' },
    ],
  },
};

export default function RequirementSelector() {
  const { setOutput } = useProject();
  const [activeTab, setActiveTab] = useState<'story' | 'epic' | 'task'>('epic');

  const [options, setOptions] =
    useState<Record<'story' | 'epic' | 'task', Option>>(OPTIONS);

  const prepareDataStructures = useCallback(
    (currentOptions: typeof options) => {
      const result: Array<{ type: string; contents: string[] }> = [];

      Object.entries(currentOptions).forEach(([key, option]) => {
        if (option.checked) {
          const selectedContents = option.subOptions
            .filter(sub => sub.checked)
            .map(sub => sub.id);

          if (selectedContents.length > 0) {
            result.push({
              type: key,
              contents: selectedContents,
            });
          }
        }
      });

      return result;
    },
    []
  );

  useEffect(() => {
    const result = prepareDataStructures(options);
    setOutput(result);
  }, [options, setOutput, prepareDataStructures]);

  const toggleMain = (key: 'story' | 'epic' | 'task', checked: boolean) => {
    // Prevent story and epic from being turned off
    if ((key === 'story' || key === 'epic') && !checked) {
      return;
    }

    setOptions(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        checked,
        subOptions: prev[key].subOptions.map(sub => ({
          ...sub,
          checked,
        })),
      },
    }));
  };

  const toggleSub = (
    key: 'story' | 'epic' | 'task',
    index: number,
    checked: boolean
  ) => {
    // Prevent General Info from being turned off for story and epic
    if (
      (key === 'story' || key === 'epic') &&
      index === 0 && // General Info is always the first sub-option
      !checked
    ) {
      return;
    }

    setOptions(prev => {
      const subs = prev[key].subOptions.map((sub, i) =>
        i === index ? { ...sub, checked } : sub
      );
      // Main option should be true if at least one sub-option is checked
      const hasAnyChecked = subs.some(sub => sub.checked);
      return {
        ...prev,
        [key]: {
          ...prev[key],
          checked: hasAnyChecked,
          subOptions: subs,
        },
      };
    });
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as 'story' | 'epic' | 'task');
  };

  return (
    <SectionWrapper
      icon={<GitIcon className='h-4 w-4' color='#4A20F5' />}
      title='Choose What to Include in Your Requirements'
    >
      <div className='mt-4'>
        <p className='text-sm font-bold'>Ticket Type</p>
      </div>
      {/* Tabs for main Options */}
      <Tabs>
        <TabsList className='h-auto bg-white p-0'>
          {Object.entries(options).map(([key, opt]) => (
            <TabsTrigger
              key={key}
              value={key}
              isActive={activeTab === key}
              onClick={() => handleTabChange(key)}
              activeClassName='bg-blue-50 shadow-none rounded-none rounded-tl-lg rounded-tr-lg'
              className='px-4 py-2'
            >
              <Toggle
                checked={opt.checked}
                onCheckedChange={checked =>
                  toggleMain(key as keyof typeof options, checked)
                }
                disabled={key === 'story' || key === 'epic'} // Disable for story and epic
              />
              <span className='ml-2 text-sm font-normal'>{opt.title}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Tabs for sub Options */}

        {Object.entries(options).map(([key, opt]) => (
          <TabsContent
            key={key}
            value={key}
            isActive={activeTab === key}
            className='mt-0'
          >
            <div
              className={cn(
                'flex flex-col gap-3 rounded-lg bg-blue-50 p-4',
                activeTab === 'epic' && 'rounded-tl-none'
              )}
            >
              <div>
                <p className='text-sm font-bold'>Ticket Format</p>
              </div>
              {opt.subOptions.map((sub, i) => (
                <Fragment key={i}>
                  <div className='flex justify-between'>
                    <span className='flex items-center gap-3'>
                      <Toggle
                        checked={sub.checked}
                        onCheckedChange={checked =>
                          toggleSub(key as any, i, checked)
                        }
                        disabled={
                          (key === 'story' || key === 'epic') &&
                          sub.title === 'General Info'
                        }
                      />
                      <span className='ml-2 text-sm font-normal'>
                        {sub.title}
                      </span>
                    </span>
                    {/* {opt?.subOptions?.length - 1 === i && (
                      <span className='text-sm font-normal text-[#4a20f5]'>
                        Preview jira {activeTab} example
                      </span>
                    )} */}
                  </div>
                  {sub.title === 'General Info' && (
                    <BulletPoints
                      className='rounded-lg bg-white p-4'
                      points={
                        GENERAL_INFO_BULLET_POINTS[
                          key as keyof typeof GENERAL_INFO_BULLET_POINTS
                        ]
                      }
                    />
                  )}
                </Fragment>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </SectionWrapper>
  );
}
