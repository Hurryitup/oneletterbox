interface NewsletterItemProps {
  title: string;
  description: string;
  date: string;
  unreadCount?: number;
  isActive?: boolean;
}

export const NewsletterItem = ({
  title,
  description,
  date,
  unreadCount,
  isActive = false,
}: NewsletterItemProps) => (
  <div className={`newsletter-item ${unreadCount ? 'unread' : ''} ${isActive ? 'active' : ''}`}>
    <div>
      <h2>{title}</h2>
      <p>{date} • {description}</p>
    </div>
    {unreadCount && <span className="unread-count">{unreadCount}</span>}
  </div>
);