'use client';

import { Input } from '@/components/ui/input';
import SectionWrapper from '@/components/shared/SectionWrapper';
import { OpenFolderIcon } from '@/components/icons';
import { useProject } from '@/hooks/useProject';

export default function ProjectNameInput() {
  const { projectName, setProjectName } = useProject();

  return (
    <SectionWrapper
      icon={<OpenFolderIcon className='h-4 w-4' />}
      title='Project Name'
    >
      <div className='space-y-4'>
        <Input
          type='text'
          placeholder='Enter your project name'
          value={projectName}
          onChange={e => setProjectName(e.target.value)}
        />
      </div>
    </SectionWrapper>
  );
}
