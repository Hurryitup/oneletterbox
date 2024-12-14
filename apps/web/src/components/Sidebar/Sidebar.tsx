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
}

interface Issue {
  issueId: string;
  sender: string;
  subject: string;
  receivedAt: string;
  s3Location: string;
  status: string;
  archived: boolean;
  starred: boolean;
}

interface SidebarProps {
  issues?: Issue[];
  activeIssueId?: string;
  onIssueSelect: (id: string) => void;
  selectedCategory: string | null;
  selectedSource: string | null;
  sortOrder?: 'desc' | 'asc';
  availableCategories?: string[];
  availableSources?: string[];
  onCategoryChange: (category: string | null) => void;
  onSourceChange: (source: string | null) => void;
  onSortOrderChange: (order: 'desc' | 'asc') => void;
  onProfileClick: () => void;
  onTitleClick: () => void;
}

export const Sidebar = ({ 
  issues = [],
  activeIssueId = '',
  onIssueSelect,
  selectedCategory = null,
  selectedSource = null,
  sortOrder = 'desc',
  availableCategories = [],
  availableSources = [],
  onCategoryChange,
  onSourceChange,
  onSortOrderChange,
  onProfileClick,
  onTitleClick,
}: SidebarProps) => {
  // Ensure issues is an array before filtering
  const safeIssues = Array.isArray(issues) ? issues : [];
  
  // Filter issues based on selected source and category
  const filteredIssues = safeIssues.filter(issue => {
    if (selectedSource && issue.sender !== selectedSource) return false;
    // You might want to implement category filtering based on your needs
    return true;
  });

  // Sort issues based on sortOrder
  const sortedIssues = [...filteredIssues].sort((a, b) => {
    const comparison = new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime();
    return sortOrder === 'desc' ? comparison : -comparison;
  });

  // Group issues by date
  const groupedIssues = sortedIssues.reduce((acc, issue) => {
    const date = new Date(issue.receivedAt).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(issue);
    return acc;
  }, {} as Record<string, Issue[]>);

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
        {Object.entries(groupedIssues).map(([date, dateIssues]) => (
          <React.Fragment key={date}>
            <Category title={date} />
            {dateIssues.map(issue => (
              <NewsletterItem 
                key={issue.issueId}
                title={issue.subject}
                description={issue.sender}
                date={new Date(issue.receivedAt).toLocaleTimeString()}
                isActive={issue.issueId === activeIssueId}
                onClick={() => onIssueSelect(issue.issueId)}
                starred={issue.starred}
                archived={issue.archived}
              />
            ))}
          </React.Fragment>
        ))}
      </div>
    </aside>
  );
};