'use client';

import SectionWrapper from '@/components/shared/SectionWrapper';

import { SparkleIcon } from '@/components/icons';
import { DocumentIntegration } from '@/components/shared/DocumentIntegration';
import { AIEngineSelector } from '@/components/shared/AIEngineSelector';
import { AnalysisScopeSelector } from '@/components/shared/AnalysisScopeSelector';

import { useOAuthTokenHandler } from '@/hooks/useOAuthTokenHandler';
import { useProject } from '@/hooks/useProject';
import RequirementSelector from '@/components/features/product-management/requirement-selector';
import ProjectNameInput from '@/components/shared/ProjectNameInput';
import { AgentActionButton } from '@/components/shared/AgentActionButton';

export default function RequirementToTicketAgentPage() {
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
        Configure PRD processing and JIRA integration. Start by uploading your
        PRD.
      </p>

      <div className='space-y-8'>
        {/* Project Name */}
        <ProjectNameInput />
        {/* PRD Integration */}
        <DocumentIntegration type='prd' agentType='requirements_to_tickets' />

        {/* Supporting Documentation */}
        <DocumentIntegration
          type='supporting_doc'
          agentType='requirements_to_tickets'
        />

        {/* Requirement Selector */}
        <RequirementSelector />

        {/* AI Engine & Scope Selector */}
        <SectionWrapper
          icon={<SparkleIcon className='h-4 w-4' />}
          title='Select an AI Engine'
        >
          <div className='space-y-4'>
            <AIEngineSelector />
            <div className='mt-4'>
              <p className='my-2 text-sm font-semibold'>
                Ticket Descriptive Level
              </p>
              <AnalysisScopeSelector
                basicTitle='Basic'
                basicDescription='(General details)'
                deepTitle='Deep'
                deepDescription='(More innovative)'
              />
            </div>
          </div>
        </SectionWrapper>

        {/* Generate Button */}
        <div className='space-y-4'>
          <AgentActionButton
            buttonText='Generate Board'
            title='Requirement to Ticket Agent'
            disabled={!canStart}
          />
        </div>
      </div>
    </div>
  );
}
