'use client';

import { useEffect, useState } from 'react';
import { Editor } from 'novel';

interface NovelEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

export default function NovelEditor({ content, onChange, placeholder, className = '' }: NovelEditorProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`border border-gray-300 rounded-lg p-4 min-h-[300px] bg-gray-50 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <Editor
        defaultValue={content ? JSON.parse(content) : undefined}
        onUpdate={(editor) => {
          const json = editor?.getJSON();
          onChange(JSON.stringify(json));
        }}
        disableLocalStorage={true}
        className="border border-gray-300 rounded-lg min-h-[300px]"
      />
    </div>
  );
}


