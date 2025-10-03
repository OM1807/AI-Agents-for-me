'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import SectionWrapper from '@/components/shared/SectionWrapper';
import { SparkleIcon } from '@/components/icons';
import { TestCasePreviewDialog } from '@/components/features/quality-assurance/TestCasePreviewDialog';
import { useProject } from '@/hooks/useProject';
import { toast } from 'sonner';

export function TestCaseConfiguration() {
  const { setOutputConfigType, setOutputConfigContent } = useProject();

  // Test case configuration states
  const [testCaseTypes, setTestCaseTypes] = useState({
    functional: true,
    edgeCase: true,
    negative: true,
    regression: true,
  });

  const [caseFormat, setCaseFormat] = useState({
    generalInfo: true,
    preconditions: true,
    testSteps: true,
    expectedResult: true,
  });

  const [showPreview, setShowPreview] = useState(false);

  // Prepare output configurations whenever state changes
  useEffect(() => {
    // Prepare output_config_type array based on selected test case types
    const outputConfigType: string[] = [];
    if (testCaseTypes.functional) {
      outputConfigType.push('functional');
    }
    if (testCaseTypes.edgeCase) {
      outputConfigType.push('edge');
    }
    if (testCaseTypes.negative) {
      outputConfigType.push('negative');
    }
    if (testCaseTypes.regression) {
      outputConfigType.push('regression');
    }

    // Prepare output_config_content array based on selected case format
    const outputConfigContent: string[] = [];
    if (caseFormat.generalInfo) {
      outputConfigContent.push('general_info');
    }
    if (caseFormat.preconditions) {
      outputConfigContent.push('preconditions_setup');
    }
    if (caseFormat.testSteps) {
      outputConfigContent.push('steps');
    }
    if (caseFormat.expectedResult) {
      outputConfigContent.push('expected_results');
    }

    // Validation: Check if at least one test case type is selected
    if (outputConfigType.length === 0) {
      toast.error('Please select at least one type of test case');
      return;
    }

    // Validation: Check if at least one case format is selected
    if (outputConfigContent.length === 0) {
      toast.error('Please select at least one case format option');
      return;
    }

    // Set the output configuration in the project store only if validation passes
    setOutputConfigType(outputConfigType);
    setOutputConfigContent(outputConfigContent);
  }, [testCaseTypes, caseFormat, setOutputConfigType, setOutputConfigContent]);

  // Update state - useEffect will handle store updates automatically
  const handleTestCaseTypeChange = (
    type: keyof typeof testCaseTypes,
    checked: boolean
  ) => {
    // If trying to uncheck, ensure at least one test case type remains selected
    if (!checked) {
      const remainingSelected = Object.entries(testCaseTypes).filter(
        ([key, value]) => key !== type && value
      );

      if (remainingSelected.length === 0) {
        toast.error('At least one test case type must be selected');
        return;
      }
    }

    setTestCaseTypes(prev => ({ ...prev, [type]: checked }));
  };

  const handleCaseFormatChange = (
    format: keyof typeof caseFormat,
    checked: boolean
  ) => {
    // If trying to uncheck, ensure at least one case format remains selected
    if (!checked) {
      const remainingSelected = Object.entries(caseFormat).filter(
        ([key, value]) => key !== format && value
      );

      if (remainingSelected.length === 0) {
        toast.error('At least one case format option must be selected');
        return;
      }
    }

    setCaseFormat(prev => ({ ...prev, [format]: checked }));
  };

  return (
    <>
      <SectionWrapper
        icon={<SparkleIcon className='h-4 w-4' />}
        title='Choose What to Include in Your Test Cases'
      >
        <div className='space-y-6'>
          {/* Test Cases Types */}
          <div className='space-y-4'>
            <h3 className='text-sm font-semibold'>Types of Test Cases</h3>
            <div className='flex flex-wrap gap-6'>
              <label className='flex cursor-pointer items-center gap-3'>
                <Toggle
                  checked={testCaseTypes.functional}
                  onCheckedChange={checked =>
                    handleTestCaseTypeChange('functional', checked)
                  }
                />
                <span className='text-sm'>Functional Test Cases</span>
              </label>
              <label className='flex cursor-pointer items-center gap-3'>
                <Toggle
                  checked={testCaseTypes.edgeCase}
                  onCheckedChange={checked =>
                    handleTestCaseTypeChange('edgeCase', checked)
                  }
                />
                <span className='text-sm'>Edge Case Test Cases</span>
              </label>
              <label className='flex cursor-pointer items-center gap-3'>
                <Toggle
                  checked={testCaseTypes.negative}
                  onCheckedChange={checked =>
                    handleTestCaseTypeChange('negative', checked)
                  }
                />
                <span className='text-sm'>Negative Test Cases</span>
              </label>
              <label className='flex cursor-pointer items-center gap-3'>
                <Toggle
                  checked={testCaseTypes.regression}
                  onCheckedChange={checked =>
                    handleTestCaseTypeChange('regression', checked)
                  }
                />
                <span className='text-sm'>Regression Test Cases</span>
              </label>
            </div>
          </div>

          {/* Case Format */}
          <div className='space-y-4'>
            <h3 className='text-sm font-semibold'>Case Format</h3>
            <div className='space-y-3'>
              <label className='flex cursor-pointer items-center gap-3'>
                <Toggle
                  checked={caseFormat.generalInfo}
                  onCheckedChange={checked =>
                    handleCaseFormatChange('generalInfo', checked)
                  }
                />
                <span className='text-sm'>General Info</span>
              </label>
              {caseFormat.generalInfo && (
                <div className='ml-14 space-y-1 rounded-lg bg-gray-50 p-3 text-xs text-gray-600 dark:bg-gray-900 dark:text-gray-400'>
                  <ul className='list-disc pl-4'>
                    <li>Test Case ID: eg. TC-LOGIN-001</li>
                    <li>Title: eg. Verify login with valid credentials</li>
                    <li>
                      Description: eg. Ensure user can successfully log in with
                      a valid username and password.
                    </li>
                    <li>Priority: eg. High, Medium, Low</li>
                    <li>
                      Environment: eg. Chrome, Firefox, Safari, Windows, MacOS,
                      etc.
                    </li>
                  </ul>
                </div>
              )}

              <label className='flex cursor-pointer items-center gap-3'>
                <Toggle
                  checked={caseFormat.preconditions}
                  onCheckedChange={checked =>
                    handleCaseFormatChange('preconditions', checked)
                  }
                />
                <span className='text-sm'>Preconditions / Setup</span>
              </label>

              <label className='flex cursor-pointer items-center gap-3'>
                <Toggle
                  checked={caseFormat.testSteps}
                  onCheckedChange={checked =>
                    handleCaseFormatChange('testSteps', checked)
                  }
                />
                <span className='text-sm'>Test Steps</span>
              </label>

              <label className='flex cursor-pointer items-center gap-3'>
                <Toggle
                  checked={caseFormat.expectedResult}
                  onCheckedChange={checked =>
                    handleCaseFormatChange('expectedResult', checked)
                  }
                />
                <span className='text-sm'>Expected Result</span>
              </label>
            </div>
          </div>

          {/* Preview Link */}
          <div className='flex justify-end'>
            <Button
              variant='link'
              className='cursor-pointer p-0 text-purple-600 hover:text-purple-700'
              onClick={() => setShowPreview(!showPreview)}
            >
              Preview Test Case Example
            </Button>
          </div>
        </div>
      </SectionWrapper>

      {/* Test Case Preview Dialog */}
      <TestCasePreviewDialog
        open={showPreview}
        onOpenChange={setShowPreview}
        caseFormat={caseFormat}
      />
    </>
  );
}
