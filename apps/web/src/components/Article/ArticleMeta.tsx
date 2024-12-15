import React from 'react';
import styles from './Article.module.css';
import { extractSenderName } from '../../utils/email';

interface ArticleMetaProps {
  newsletter: string;
  author: string;
  date: string;
}

export const ArticleMeta: React.FC<ArticleMetaProps> = ({
  newsletter,
  author,
  date,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className={styles.emailAddress}>{extractSenderName(newsletter)}</span>
      {author && (
        <>
          <span className="text-gray-400">·</span>
          <span>{author}</span>
        </>
      )}
      <span className="text-gray-400">·</span>
      <time>{date}</time>
    </div>
  );
};