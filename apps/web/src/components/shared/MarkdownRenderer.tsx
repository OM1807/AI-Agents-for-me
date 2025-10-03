import React from 'react';
// import ReactMarkdown from 'react-markdown';
// import remarkGfm from 'remark-gfm';
// import { Clipboard, Code, Check, Link } from 'lucide-react';
import { Streamdown } from 'streamdown';

// Component wrapper with copy feedback functionality
export const MarkdownRenderer = ({
  content,
  // isStreaming = false,
}: {
  content: string;
  isStreaming?: boolean;
}) => {
  // const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

  // const handleCopyCode = async (code: string, id: string) => {
  //   try {
  //     await navigator.clipboard.writeText(code);
  //     setCopiedStates(prev => ({ ...prev, [id]: true }));
  //     setTimeout(() => {
  //       setCopiedStates(prev => ({ ...prev, [id]: false }));
  //     }, 2000);
  //   } catch (err) {
  //     console.error('Failed to copy code:', err);
  //   }
  // };

  // const markdownComponents = {
  //   code: (props: any) => {
  //     const { className, children, ...rest } = props;
  //     const match = /language-(\w+)/.exec(className || '');
  //     const isInline = !match;

  //     if (isInline) {
  //       return (
  //         <code
  //           className='rounded-md bg-gray-100 px-1.5 py-0.5 font-mono text-sm text-gray-800 dark:bg-gray-800 dark:text-gray-200'
  //           {...rest}
  //         >
  //           {children}
  //         </code>
  //       );
  //     }

  //     const codeContent = String(children).replace(/\n$/, '');
  //     const language = match[1] || 'text';
  //     const codeId = `code-${Math.random().toString(36).substr(2, 9)}`;

  //     return (
  //       <div className='my-4 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700'>
  //         <header className='flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-2 dark:border-gray-700 dark:bg-gray-800'>
  //           <div className='flex items-center gap-2'>
  //             <Code className='h-4 w-4 text-gray-500' />
  //             <span className='font-mono text-sm font-medium text-gray-700 dark:text-gray-300'>
  //               {language}
  //             </span>
  //           </div>
  //           <button
  //             onClick={() => handleCopyCode(codeContent, codeId)}
  //             className='flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm transition-all hover:bg-gray-200 dark:hover:bg-gray-700'
  //             title='Copy code'
  //           >
  //             {copiedStates[codeId] ? (
  //               <>
  //                 <Check className='h-3.5 w-3.5 text-green-600' />
  //                 <span className='text-green-600'>Copied!</span>
  //               </>
  //             ) : (
  //               <>
  //                 <Clipboard className='h-3.5 w-3.5 text-gray-600 dark:text-gray-400' />
  //                 <span className='text-gray-600 dark:text-gray-400'>Copy</span>
  //               </>
  //             )}
  //           </button>
  //         </header>
  //         <div className='overflow-x-auto bg-gray-50 dark:bg-gray-900'>
  //           <pre className='p-4'>
  //             <code className='block font-mono text-sm whitespace-pre text-gray-800 dark:text-gray-200'>
  //               {codeContent}
  //             </code>
  //           </pre>
  //           {isStreaming && (
  //             <span className='mb-4 ml-4 inline-block h-4 w-0.5 animate-pulse bg-blue-500' />
  //           )}
  //         </div>
  //       </div>
  //     );
  //   },
  //   p: (props: any) => (
  //     <p
  //       className='mb-2 text-sm leading-7 text-gray-700 dark:text-gray-300'
  //       {...props}
  //     />
  //   ),
  //   ul: (props: any) => (
  //     <ul
  //       className='mb-2 list-disc space-y-2 pl-6 text-gray-700 dark:text-gray-300'
  //       {...props}
  //     />
  //   ),
  //   ol: (props: any) => (
  //     <ol
  //       className='mb-2 list-decimal space-y-2 pl-6 text-gray-700 dark:text-gray-300'
  //       {...props}
  //     />
  //   ),
  //   li: (props: any) => <li className='leading-7' {...props} />,
  //   blockquote: (props: any) => (
  //     <blockquote
  //       className='mb-2 border-l-4 border-blue-500 bg-blue-50 py-3 pr-3 pl-4 text-gray-700 italic dark:border-blue-400 dark:bg-blue-900/20 dark:text-gray-300'
  //       {...props}
  //     />
  //   ),
  //   h1: (props: any) => {
  //     const { children, ...rest } = props;
  //     const id = String(children).toLowerCase().replace(/\s+/g, '-');
  //     return (
  //       <h1
  //         id={id}
  //         className='mt-4 mb-4 flex items-center gap-2 border-b-2 border-gray-200 pb-3 text-xl font-bold text-gray-900 dark:border-gray-700 dark:text-gray-100'
  //         {...rest}
  //       >
  //         {children}
  //       </h1>
  //     );
  //   },
  //   h2: (props: any) => {
  //     const { children, ...rest } = props;
  //     const id = String(children).toLowerCase().replace(/\s+/g, '-');
  //     return (
  //       <h2
  //         id={id}
  //         className='mt-4 mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100'
  //         {...rest}
  //       >
  //         {children}
  //       </h2>
  //     );
  //   },
  //   h3: (props: any) => {
  //     const { children, ...rest } = props;
  //     const id = String(children).toLowerCase().replace(/\s+/g, '-');
  //     return (
  //       <h3
  //         id={id}
  //         className='text-md mt-4 mb-4 font-medium text-gray-900 dark:text-gray-100'
  //         {...rest}
  //       >
  //         {children}
  //       </h3>
  //     );
  //   },
  //   h4: (props: any) => (
  //     <h4
  //       className='mt-4 mb-4 text-sm font-medium text-gray-900 dark:text-gray-100'
  //       {...props}
  //     />
  //   ),
  //   strong: (props: any) => (
  //     <strong
  //       className='font-semibold text-gray-900 dark:text-gray-100'
  //       {...props}
  //     />
  //   ),
  //   em: (props: any) => (
  //     <em className='text-gray-700 italic dark:text-gray-300' {...props} />
  //   ),
  //   a: (props: any) => {
  //     const { children, href, ...rest } = props;
  //     const isExternal = href?.startsWith('http');
  //     const isFileLink = href?.startsWith('file:///');

  //     // Convert file links to h3 headings
  //     if (isFileLink) {
  //       const filename = String(children);
  //       return (
  //         <h3 className='text-md mt-4 mb-4 font-medium text-gray-900 dark:text-gray-100'>
  //           {filename}
  //         </h3>
  //       );
  //     }
  //     return (
  //       <a
  //         href={href}
  //         className='inline-flex items-center gap-1 text-blue-600 underline decoration-blue-300 underline-offset-2 transition-colors hover:text-blue-800 hover:decoration-blue-500 dark:text-blue-400 dark:decoration-blue-600 dark:hover:text-blue-300'
  //         target={isExternal ? '_blank' : undefined}
  //         rel={isExternal ? 'noopener noreferrer' : undefined}
  //         {...rest}
  //       >
  //         {children}
  //         {isExternal && <Link className='h-3 w-3' />}
  //       </a>
  //     );
  //   },
  //   table: (props: any) => (
  //     <div className='mb-4 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700'>
  //       <table
  //         className='w-full border-collapse bg-white text-sm dark:bg-gray-800'
  //         {...props}
  //       />
  //     </div>
  //   ),
  //   thead: (props: any) => (
  //     <thead className='bg-gray-50 dark:bg-gray-700' {...props} />
  //   ),
  //   tbody: (props: any) => (
  //     <tbody
  //       className='divide-y divide-gray-200 dark:divide-gray-700'
  //       {...props}
  //     />
  //   ),
  //   tr: (props: any) => (
  //     <tr
  //       className='transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50'
  //       {...props}
  //     />
  //   ),
  //   th: (props: any) => (
  //     <th
  //       className='px-3 py-2 text-left text-sm font-medium text-gray-900 dark:text-gray-100'
  //       {...props}
  //     />
  //   ),
  //   td: (props: any) => (
  //     <td
  //       className='px-3 py-2 text-sm text-gray-700 dark:text-gray-300'
  //       {...props}
  //     />
  //   ),
  //   hr: () => <hr className='my-4 border-gray-200 dark:border-gray-700' />,
  //   pre: (props: any) => {
  //     const { children } = props;
  //     // For code blocks inside pre tags that aren't caught by the code component
  //     if (children?.props?.className?.includes('language-')) {
  //       return <>{children}</>;
  //     }
  //     return (
  //       <pre
  //         className='mb-2 overflow-x-auto rounded-lg bg-gray-100 p-2 font-mono text-sm whitespace-pre text-gray-800 dark:bg-gray-800 dark:text-gray-200'
  //         {...props}
  //       />
  //     );
  //   },
  // };

  const components = {
    h1: (props: any) => <h1 className='text-2xl font-bold' {...props} />,
    h2: (props: any) => <h2 className='text-xl font-semibold' {...props} />,
    h3: (props: any) => <h3 className='text-lg font-medium' {...props} />,
    h4: (props: any) => <h4 className='text-base font-medium' {...props} />,
    h5: (props: any) => <h5 className='text-sm font-medium' {...props} />,
    h6: (props: any) => <h6 className='text-sm font-normal' {...props} />,
    p: (props: any) => <p className='text-sm font-normal' {...props} />,
  };

  return (
    // <article className='prose prose-gray dark:prose-invert max-w-none'>
    //   <ReactMarkdown
    //     remarkPlugins={[remarkGfm]}
    //     components={markdownComponents}
    //   >
    //     {content}
    //   </ReactMarkdown>
    // </article>
    <Streamdown components={components}>{content}</Streamdown>
  );
};
