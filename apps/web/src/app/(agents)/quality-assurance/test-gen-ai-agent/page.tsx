'use client';

import SectionWrapper from '@/components/shared/SectionWrapper';

import { SparkleIcon } from '@/components/icons';
import { DocumentIntegration } from '@/components/shared/DocumentIntegration';
import { AIEngineSelector } from '@/components/shared/AIEngineSelector';
import { CustomInstruction } from '@/components/shared/CustomInstruction';
import { TestCaseConfiguration } from '@/components/features/quality-assurance/TestCaseConfiguration';
import { useOAuthTokenHandler } from '@/hooks/useOAuthTokenHandler';
import { useProject } from '@/hooks/useProject';
import { AgentActionButton } from '@/components/shared/AgentActionButton';
import ProjectNameInput from '@/components/shared/ProjectNameInput';

export default function TestGenAIAgentPage() {
  const { projectName, prdnotion, prdconfluence, prdjira } = useProject();

  // useOAuthTokenHandler
  useOAuthTokenHandler();

  const canStart =
    (prdnotion.selectedPages.length > 0 ||
      prdconfluence.selectedPages.length > 0 ||
      prdjira.selectedTickets.length > 0) &&
    projectName !== '';

  return (
    <div className='space-y-8'>
      <p className='text-muted-foreground mb-4 text-sm'>
        Auto-generate functional and scenario-based test cases using structured
        documents and project tracking tools.
      </p>

      <div className='space-y-8'>
        {/* Project Name */}
        <ProjectNameInput />

        {/* PRD Integration */}
        <DocumentIntegration type='prd' agentType='test_case_generation' />

        {/* Document Integration */}
        <DocumentIntegration
          type='supporting_doc'
          agentType='test_case_generation'
        />

        {/* Test Case Configuration */}
        <TestCaseConfiguration />

        {/* AI Engine Selector */}
        <SectionWrapper
          icon={<SparkleIcon className='h-4 w-4' />}
          title='AI Engine Selector'
        >
          <AIEngineSelector />
        </SectionWrapper>

        {/* Custom Instructions */}
        <CustomInstruction />
        <div className='space-y-4'>
          <AgentActionButton
            buttonText='Generate Test Cases'
            title='TestGen AI Agent'
            disabled={!canStart}
          />
        </div>
      </div>
    </div>
  );
}
