'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import type { ComponentPropsWithoutRef } from 'react';
import type { Components } from 'react-markdown';

const components: Components = {
  h1: (props: ComponentPropsWithoutRef<'h1'>) => (
    <h1 className="text-4xl font-bold text-white mt-8 mb-4" {...props} />
  ),
  h2: (props: ComponentPropsWithoutRef<'h2'>) => (
    <h2 className="text-3xl font-bold text-white mt-8 mb-4" {...props} />
  ),
  h3: (props: ComponentPropsWithoutRef<'h3'>) => (
    <h3 className="text-2xl font-bold text-white mt-6 mb-3" {...props} />
  ),
  h4: (props: ComponentPropsWithoutRef<'h4'>) => (
    <h4 className="text-xl font-bold text-white mt-4 mb-2" {...props} />
  ),
  p: (props: ComponentPropsWithoutRef<'p'>) => (
    <p className="text-white/80 leading-relaxed mb-4" {...props} />
  ),
  a: (props: ComponentPropsWithoutRef<'a'>) => (
    <a
      className="text-pink-400 hover:text-pink-300 underline transition-colors"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  ul: (props: ComponentPropsWithoutRef<'ul'>) => (
    <ul className="list-disc list-inside text-white/80 mb-4 space-y-2" {...props} />
  ),
  ol: (props: ComponentPropsWithoutRef<'ol'>) => (
    <ol className="list-decimal list-inside text-white/80 mb-4 space-y-2" {...props} />
  ),
  li: (props: ComponentPropsWithoutRef<'li'>) => (
    <li className="text-white/80 ml-4" {...props} />
  ),
  code: (props: ComponentPropsWithoutRef<'code'>) => {
    const { children, className } = props;
    const isInline = !className;

    if (isInline) {
      return (
        <code className="px-1.5 py-0.5 bg-white/10 text-pink-400 rounded text-sm font-mono">
          {children}
        </code>
      );
    }

    return <code className={className} {...props} />;
  },
  pre: (props: ComponentPropsWithoutRef<'pre'>) => (
    <pre
      className="bg-black/30 backdrop-blur-sm rounded-lg p-4 overflow-x-auto mb-4 border border-white/10"
      {...props}
    />
  ),
  blockquote: (props: ComponentPropsWithoutRef<'blockquote'>) => (
    <blockquote
      className="border-l-4 border-purple-500 pl-4 py-2 my-4 bg-white/5 rounded-r-lg text-white/70 italic"
      {...props}
    />
  ),
  table: (props: ComponentPropsWithoutRef<'table'>) => (
    <div className="overflow-x-auto mb-4">
      <table className="w-full border-collapse" {...props} />
    </div>
  ),
  th: (props: ComponentPropsWithoutRef<'th'>) => (
    <th className="border border-white/20 bg-white/10 px-4 py-2 text-left text-white font-bold" {...props} />
  ),
  td: (props: ComponentPropsWithoutRef<'td'>) => (
    <td className="border border-white/20 px-4 py-2 text-white/80" {...props} />
  ),
  hr: (props: ComponentPropsWithoutRef<'hr'>) => (
    <hr className="border-white/20 my-8" {...props} />
  ),
  img: (props: ComponentPropsWithoutRef<'img'>) => (
    <img className="rounded-lg my-4 max-w-full h-auto" {...props} alt={props.alt ?? ''} />
  ),
  input: (props: ComponentPropsWithoutRef<'input'>) => {
    const { type, checked } = props;
    // GFM 체크박스를 controlled component로 처리
    if (type === 'checkbox') {
      return (
        <input
          type="checkbox"
          checked={checked ?? false}
          readOnly
          className="mr-2"
          {...props}
        />
      );
    }
    return <input {...props} />;
  },
};

interface MarkdownContentProps {
  readonly content: string;
}

export function MarkdownContent({ content }: MarkdownContentProps): React.ReactElement {
  return (
    <div className="prose prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
