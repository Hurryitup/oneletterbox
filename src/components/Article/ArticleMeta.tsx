interface ArticleMetaProps {
  newsletter: string;
  author: string;
  date: string;
}

export const ArticleMeta = ({ newsletter, author, date }: ArticleMetaProps) => (
  <div className="article-meta">
    {newsletter} • {author} • {date}
  </div>
);