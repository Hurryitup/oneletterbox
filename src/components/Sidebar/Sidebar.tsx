import React from 'react';
import { NewsletterItem } from './NewsletterItem';
import { Category } from './Category';
import { GroupingControls } from './GroupingControls';

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
  onSortOrderChange
}: SidebarProps) => {
  const categories = Array.from(new Set(newsletters.map(n => n.category)));

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>Newsletters</h1>
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
    </div>
  );
};