import React from 'react';

interface ArticleMetaProps {
  newsletter: string;
  author: string;
  date: string;
}

export const ArticleMeta = ({ newsletter, author, date }: ArticleMetaProps) => (
  <div className="article-meta flex items-center gap-2 text-gray-600 text-sm">
    <span className="font-medium">{newsletter}</span>
    {author && (
      <>
        <span className="text-gray-400">•</span>
        <span>{author}</span>
      </>
    )}
    <span className="text-gray-400">•</span>
    <span>{date}</span>
  </div>
);