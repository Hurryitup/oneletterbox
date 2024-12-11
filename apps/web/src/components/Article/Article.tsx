import React from 'react';
import { ArticleMeta } from './ArticleMeta';

interface ArticleProps {
  title: string;
  newsletter: string;
  author: string;
  date: string;
  content: string[];
}

export const Article = ({ title, newsletter, author, date, content }: ArticleProps) => (
  <article className="article">
    <h1>{title}</h1>
    <ArticleMeta newsletter={newsletter} author={author} date={date} />
    <div className="content">
      {content.map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
    </div>
  </article>
);