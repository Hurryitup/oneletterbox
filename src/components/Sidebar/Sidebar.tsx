import { NewsletterItem } from './NewsletterItem';
import { Category } from './Category';

export const Sidebar = () => (
  <div className="sidebar">
    <div className="sidebar-header">
      <h1>Newsletters</h1>
    </div>
    <div className="newsletter-list">
      <Category title="Technology" />
      <NewsletterItem 
        title="Stratechery"
        description="The Future of Tech"
        date="Dec 9"
        unreadCount={3}
        isActive={true}
      />
      <NewsletterItem 
        title="Not Boring"
        description="Innovation Insights"
        date="Dec 8"
        unreadCount={1}
      />
      <Category title="Engineering" />
      <NewsletterItem 
        title="The Pragmatic Engineer"
        description="Engineering at Scale"
        date="Dec 7"
      />
    </div>
  </div>
);