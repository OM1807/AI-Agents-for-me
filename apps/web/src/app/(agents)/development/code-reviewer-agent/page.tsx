'use client';

import SectionWrapper from '@/components/shared/SectionWrapper';

import { SparkleIcon } from '@/components/icons';
import { PullRequestSelector } from '@/components/features/code-review';
import { DocumentIntegration } from '@/components/shared/DocumentIntegration';
import { AIEngineSelector } from '@/components/shared/AIEngineSelector';
import { AnalysisScopeSelector } from '@/components/shared/AnalysisScopeSelector';
import ProjectNameInput from '@/components/shared/ProjectNameInput';
import { useOAuthTokenHandler } from '@/hooks/useOAuthTokenHandler';
import { useProject } from '@/hooks/useProject';
import { AgentActionButton } from '@/components/shared/AgentActionButton';
import { CustomInstruction } from '@/components/shared/CustomInstruction';

export default function CodeReviewerAgent() {
  // useOAuthTokenHandler
  useOAuthTokenHandler();

  const { gitHubRepos, projectName } = useProject();

  const canStart = gitHubRepos.selectedPR && projectName !== '';

  return (
    <div className='space-y-8'>
      <p className='text-muted-foreground mb-4 text-sm'>
        Set up your project, data sources, and analysis preferences to generate
        meaningful results.
      </p>

      <div className='space-y-8'>
        {/* Project Name */}
        <ProjectNameInput />

        {/* Pull Request Selection */}
        <PullRequestSelector showPasteURL={true} />

        {/* Document Integration */}
        <DocumentIntegration type='supporting_doc' agentType='code_reviewer' />

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
            buttonText='Launch Agent'
            title='Code Reviewer Agent'
            disabled={!canStart}
          />
        </div>
      </div>
    </div>
  );
}
