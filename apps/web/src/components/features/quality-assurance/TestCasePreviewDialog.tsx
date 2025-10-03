'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';

interface TestCasePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseFormat: {
    generalInfo: boolean;
    preconditions: boolean;
    testSteps: boolean;
    expectedResult: boolean;
  };
}

export function TestCasePreviewDialog({
  open,
  onOpenChange,
  caseFormat,
}: TestCasePreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] max-w-4xl overflow-y-auto'>
        <DialogHeader className='flex flex-row items-center justify-between'>
          <DialogTitle className='text-xl font-semibold'>
            Preview Test Case Example
          </DialogTitle>
          <DialogClose onClose={() => onOpenChange(false)} />
        </DialogHeader>

        <div className='mt-6 space-y-6'>
          {/* General Info Section */}
          {caseFormat.generalInfo && (
            <div className='space-y-3'>
              <h3 className='text-lg font-semibold'>
                TC-LOGIN-001: Verify user login with valid credentials
              </h3>
              <ul className='space-y-2 text-sm'>
                <li>
                  <strong>Description:</strong> Ensure that a registered user
                  can log in using a valid username and password.
                </li>
                <li>
                  <strong>Priority:</strong> High
                </li>
                <li>
                  <strong>Environment:</strong> Chrome 120, Windows 11
                </li>
                <li>
                  <strong>Module:</strong> User Authentication
                </li>
              </ul>
            </div>
          )}

          {/* Preconditions Section */}
          {caseFormat.preconditions && (
            <div className='space-y-3'>
              <h4 className='font-semibold'>Preconditions</h4>
              <ul className='list-disc space-y-1 pl-6 text-sm'>
                <li>User account already exists with the following details:</li>
                <li>Username: testuser</li>
                <li>Password: Pass@123</li>
                <li>
                  Application is running and accessible at
                  https://app.example.com
                </li>
              </ul>
            </div>
          )}

          {/* Test Steps Section */}
          {caseFormat.testSteps && (
            <div className='space-y-3'>
              <h4 className='font-semibold'>Test Steps</h4>
              <div className='overflow-x-auto'>
                <table className='w-full border-collapse'>
                  <thead>
                    <tr className='bg-gray-50 dark:bg-gray-800'>
                      <th className='border border-gray-200 px-4 py-2 text-left text-sm font-medium dark:border-gray-700'>
                        Steps #
                      </th>
                      <th className='border border-gray-200 px-4 py-2 text-left text-sm font-medium dark:border-gray-700'>
                        Action
                      </th>
                      <th className='border border-gray-200 px-4 py-2 text-left text-sm font-medium dark:border-gray-700'>
                        Test Data
                      </th>
                      <th className='border border-gray-200 px-4 py-2 text-left text-sm font-medium dark:border-gray-700'>
                        Expected Result
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className='border border-gray-200 px-4 py-2 text-sm dark:border-gray-700'>
                        1
                      </td>
                      <td className='border border-gray-200 px-4 py-2 text-sm dark:border-gray-700'>
                        Navigate to login page
                      </td>
                      <td className='border border-gray-200 px-4 py-2 text-sm dark:border-gray-700'>
                        URL: https://app.example.com/login
                      </td>
                      <td className='border border-gray-200 px-4 py-2 text-sm dark:border-gray-700'>
                        Login page loads successfully
                      </td>
                    </tr>
                    <tr className='bg-gray-50/50 dark:bg-gray-800/50'>
                      <td className='border border-gray-200 px-4 py-2 text-sm dark:border-gray-700'>
                        2
                      </td>
                      <td className='border border-gray-200 px-4 py-2 text-sm dark:border-gray-700'>
                        Enter valid username
                      </td>
                      <td className='border border-gray-200 px-4 py-2 text-sm dark:border-gray-700'>
                        testuser
                      </td>
                      <td className='border border-gray-200 px-4 py-2 text-sm dark:border-gray-700'>
                        Username is accepted
                      </td>
                    </tr>
                    <tr>
                      <td className='border border-gray-200 px-4 py-2 text-sm dark:border-gray-700'>
                        3
                      </td>
                      <td className='border border-gray-200 px-4 py-2 text-sm dark:border-gray-700'>
                        Enter valid password
                      </td>
                      <td className='border border-gray-200 px-4 py-2 text-sm dark:border-gray-700'>
                        Pass@123
                      </td>
                      <td className='border border-gray-200 px-4 py-2 text-sm dark:border-gray-700'>
                        Password is accepted
                      </td>
                    </tr>
                    <tr className='bg-gray-50/50 dark:bg-gray-800/50'>
                      <td className='border border-gray-200 px-4 py-2 text-sm dark:border-gray-700'>
                        4
                      </td>
                      <td className='border border-gray-200 px-4 py-2 text-sm dark:border-gray-700'>
                        Click on Login button
                      </td>
                      <td className='border border-gray-200 px-4 py-2 text-sm dark:border-gray-700'>
                        NA
                      </td>
                      <td className='border border-gray-200 px-4 py-2 text-sm dark:border-gray-700'>
                        User is redirected to the dashboard
                      </td>
                    </tr>
                    <tr>
                      <td className='border border-gray-200 px-4 py-2 text-sm dark:border-gray-700'>
                        5
                      </td>
                      <td className='border border-gray-200 px-4 py-2 text-sm dark:border-gray-700'>
                        Verify session
                      </td>
                      <td className='border border-gray-200 px-4 py-2 text-sm dark:border-gray-700'>
                        NA
                      </td>
                      <td className='border border-gray-200 px-4 py-2 text-sm dark:border-gray-700'>
                        A valid session token/cookie is created
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Expected Result Section */}
          {caseFormat.expectedResult && (
            <div className='space-y-3'>
              <h4 className='font-semibold'>Expected Result</h4>
              <ul className='list-disc space-y-1 pl-6 text-sm'>
                <li>
                  User is redirected to dashboard and session is established.
                </li>
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
