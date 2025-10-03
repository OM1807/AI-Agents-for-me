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

export default function RootCauseAnalysis() {
  // useOAuthTokenHandler
  useOAuthTokenHandler();

  const {
    incidentjira,
    incidentpagerduty,
    incidentsentry,
    incidentnewrelic,
    incidentdatadog,
    projectName,
  } = useProject();
  const canStart =
    (incidentjira.incident ||
      incidentpagerduty.incident ||
      incidentsentry.incident ||
      incidentnewrelic.incident ||
      incidentdatadog.incident) &&
    projectName !== '';

  return (
    <div className='space-y-8'>
      <p className='text-muted-foreground mb-4 text-sm'>
        Pick an incident you want the RCA Agent to investigate.
      </p>

      <div className='space-y-8'>
        {/* Project Name */}
        <ProjectNameInput />

        {/* Incident Integration */}
        <DocumentIntegration
          type='incident'
          agentType='root_cause_analysis'
          viewMode='dropdown'
        />

        {/* Logging Integration */}
        <DocumentIntegration type='logging' agentType='root_cause_analysis' />

        {/* GitHub Integration */}
        <RepositorySelector optional={true} />

        {/* Document Integration */}
        <DocumentIntegration
          type='supporting_doc'
          agentType='root_cause_analysis'
        />

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
            buttonText='Run RCA Agent'
            title='Root Cause Analysis Agent'
            disabled={!canStart}
          />
        </div>
      </div>
    </div>
  );
}
