import React from 'react';

interface UserMessageProps {
  content: string;
}

export const UserMessage: React.FC<UserMessageProps> = ({ content }) => {
  return (
    <div className='flex justify-end'>
      <div className='max-w-[100%] rounded-2xl rounded-br-md bg-blue-500 px-4 py-3 text-white'>
        <div className='text-sm whitespace-pre-wrap'>{content}</div>
      </div>
    </div>
  );
};
