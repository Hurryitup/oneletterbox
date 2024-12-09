import { ArticleMeta } from './ArticleMeta';

interface ArticleProps {
  title: string;
  newsletter: string;
  author: string;
  date: string;
  content: string[];
}

export const Article = ({ title, newsletter, author, date, content }: ArticleProps) => (
  <div className="article">
    <h1>{title}</h1>
    <ArticleMeta newsletter={newsletter} author={author} date={date} />
    <div className="article-content">
      {content.map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
    </div>
  </div>
);