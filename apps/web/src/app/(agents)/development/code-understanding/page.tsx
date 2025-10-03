'use client';

import SectionWrapper from '@/components/shared/SectionWrapper';

import { SparkleIcon } from '@/components/icons';
import { RepositorySelector } from '@/components/shared/RepositorySelector';
import { DocumentIntegration } from '@/components/shared/DocumentIntegration';
import { AIEngineSelector } from '@/components/shared/AIEngineSelector';
import { AnalysisScopeSelector } from '@/components/shared/AnalysisScopeSelector';
import { CustomInstruction } from '@/components/shared/CustomInstruction';
import ProjectNameInput from '@/components/shared/ProjectNameInput';
import { useOAuthTokenHandler } from '@/hooks/useOAuthTokenHandler';
import { useProject } from '@/hooks/useProject';
import { AgentActionButton } from '@/components/shared/AgentActionButton';

export default function CodeUnderstanding() {
  // useOAuthTokenHandler
  useOAuthTokenHandler();

  const { gitHubRepos, projectName } = useProject();
  const canStart =
    gitHubRepos.selectedRepositories.length > 0 && projectName !== '';

  return (
    <div className='space-y-8'>
      <p className='text-muted-foreground mb-4 text-sm'>
        Your AI companion to visualize and document complex codebases.
      </p>

      <div className='space-y-8'>
        {/* Project Name */}
        <ProjectNameInput />

        {/* GitHub Integration */}
        <RepositorySelector />

        {/* Document Integration */}
        <DocumentIntegration type='supporting_doc' agentType='code_analysis' />

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
            buttonText='Begin Analysis'
            title='Documentation & Knowledge Agent'
            disabled={!canStart}
          />
        </div>
      </div>
    </div>
  );
}
