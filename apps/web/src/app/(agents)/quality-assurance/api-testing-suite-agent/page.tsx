'use client';

import SectionWrapper from '@/components/shared/SectionWrapper';

import { SparkleIcon } from '@/components/icons';
import { DocumentIntegration } from '@/components/shared/DocumentIntegration';
import { AIEngineSelector } from '@/components/shared/AIEngineSelector';
import { CustomInstruction } from '@/components/shared/CustomInstruction';
import {
  ConnectApiSpecs,
  ConnectTestCases,
  ApiAutomationFrameworkSelector,
} from '@/components/features/api-testing';
import { useOAuthTokenHandler } from '@/hooks/useOAuthTokenHandler';
import { useProject } from '@/hooks/useProject';
import { AgentActionButton } from '@/components/shared/AgentActionButton';
import ProjectNameInput from '@/components/shared/ProjectNameInput';
import { AnalysisScopeSelector } from '@/components/shared/AnalysisScopeSelector';
import { RepositorySelector } from '@/components/shared/RepositorySelector';

export default function APITestingSuiteAgentPage() {
  const { projectName, apiSpecs, testCases } = useProject();

  // useOAuthTokenHandler
  useOAuthTokenHandler();

  const canStart =
    (apiSpecs.selectedSpecs.length > 0 ||
      testCases.selectedTestCases.length > 0) &&
    projectName !== '';

  return (
    <div className='space-y-8'>
      <p className='text-muted-foreground mb-4 text-sm'>
        Start by naming your project and connecting API specs & test cases input
        source to run the API testing suite.
      </p>

      <div className='space-y-8'>
        {/* Project Name */}
        <ProjectNameInput />

        {/* Connect API Specs */}
        <ConnectApiSpecs />

        {/* Connect Test Cases */}
        <ConnectTestCases />

        {/* optional- Connect GitHub Test Cases Repo */}
        <RepositorySelector optional={true} />

        {/*optional- Supporting Document Integration */}
        <DocumentIntegration
          type='supporting_doc'
          agentType='api_testing_suite'
        />

        {/* API Automation Framework Selector */}
        <ApiAutomationFrameworkSelector />

        {/* AI Engine Selector & Scope Selector */}
        <SectionWrapper
          icon={<SparkleIcon className='h-4 w-4' />}
          title='AI Engine Selector & Scope Selector'
        >
          <AIEngineSelector />
          <AnalysisScopeSelector
            basicTitle='Basic research'
            basicDescription='Top-level summaries only'
            deepTitle='Deep research'
            deepDescription='Summaries + API map + diagrams + inter-service dependencies'
          />
        </SectionWrapper>

        {/* Custom Instructions */}
        <CustomInstruction />
        <div className='space-y-4'>
          <AgentActionButton
            buttonText='Run API Test Suite Builder'
            title='API Testing Suite Agent'
            disabled={!canStart}
          />
        </div>
      </div>
    </div>
  );
}
