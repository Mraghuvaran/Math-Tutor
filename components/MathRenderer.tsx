import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface MathRendererProps {
  content: string;
}

export const MathRenderer: React.FC<MathRendererProps> = ({ content }) => {
  return (
    <div className="prose prose-invert prose-sm max-w-none break-words">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Override basic elements for custom styling if needed
          p: ({ node, ...props }) => <p className="mb-2 leading-relaxed" {...props} />,
          h1: ({ node, ...props }) => <h1 className="text-xl font-bold mb-2 text-indigo-300" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-lg font-bold mb-2 text-indigo-300" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-md font-bold mb-1 text-indigo-300" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props} />,
          code: ({ node, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            return !match ? (
              <code className="bg-gray-800 px-1 py-0.5 rounded text-yellow-300 font-mono text-sm" {...props}>
                {children}
              </code>
            ) : (
               <div className="bg-gray-900 p-2 rounded-md my-2 overflow-x-auto border border-gray-700">
                <code className={className} {...props}>
                  {children}
                </code>
              </div>
            );
          },
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-indigo-500 pl-4 italic text-gray-400 my-2" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};