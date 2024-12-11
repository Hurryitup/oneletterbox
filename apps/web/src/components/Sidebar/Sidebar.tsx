import React from 'react';
import { NewsletterItem } from './NewsletterItem';
import { Category } from './Category';
import { GroupingControls } from './GroupingControls';
import { UserCircle } from 'lucide-react';
import './Sidebar.css';

interface Newsletter {
  id: string;
  category: string;
  title: string;
  description: string;
  date: string;
  unreadCount?: number;
}

interface SidebarProps {
  newsletters: Newsletter[];
  activeNewsletterId: string;
  onNewsletterSelect: (id: string) => void;
  selectedCategory: string | null;
  selectedSource: string | null;
  sortOrder: 'desc' | 'asc';
  availableCategories: string[];
  availableSources: string[];
  onCategoryChange: (category: string | null) => void;
  onSourceChange: (source: string | null) => void;
  onSortOrderChange: (order: 'desc' | 'asc') => void;
  onProfileClick: () => void;
  onTitleClick: () => void;
}

export const Sidebar = ({ 
  newsletters, 
  activeNewsletterId, 
  onNewsletterSelect,
  selectedCategory,
  selectedSource,
  sortOrder,
  availableCategories,
  availableSources,
  onCategoryChange,
  onSourceChange,
  onSortOrderChange,
  onProfileClick,
  onTitleClick
}: SidebarProps) => {
  const categories = Array.from(new Set(newsletters.map(n => n.category)));

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>
          <button 
            onClick={onTitleClick}
            className="title-button"
          >
            OneLetterBox
          </button>
        </h1>
        <button 
          className="profile-button"
          onClick={onProfileClick}
          aria-label="Account settings"
        >
          <UserCircle size={24} />
        </button>
      </div>
      <div className="controls-container">
        <GroupingControls
          categories={availableCategories}
          sources={availableSources}
          selectedCategory={selectedCategory}
          selectedSource={selectedSource}
          sortOrder={sortOrder}
          onCategoryChange={onCategoryChange}
          onSourceChange={onSourceChange}
          onSortOrderChange={onSortOrderChange}
        />
      </div>
      <div className="newsletter-list">
        {categories.map(category => (
          <React.Fragment key={category}>
            <Category title={category.toUpperCase()} />
            {newsletters
              .filter(n => n.category === category)
              .map(newsletter => (
                <NewsletterItem 
                  key={newsletter.id}
                  title={newsletter.title}
                  description={newsletter.description}
                  date={newsletter.date}
                  unreadCount={newsletter.unreadCount}
                  isActive={newsletter.id === activeNewsletterId}
                  onClick={() => onNewsletterSelect(newsletter.id)}
                />
              ))}
          </React.Fragment>
        ))}
      </div>
    </aside>
  );
};