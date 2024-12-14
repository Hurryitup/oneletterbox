import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar } from './Sidebar/Sidebar';
import { Article } from './Article/Article';
import { Account } from './Account/Account';
import { useIssues } from '../hooks/useIssues';

interface Newsletter {
  id: string;
  category: string;
  title: string;
  description: string;
  date: string;
  author: string;
  content: string[];
}

export function Layout() {
  const [activeIssueId, setActiveIssueId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [showAccount, setShowAccount] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { issues, loading, error, availableSources, refreshIssues } = useIssues();

  // Set first issue as active when issues are loaded
  useEffect(() => {
    if (issues.length > 0 && !activeIssueId) {
      setActiveIssueId(issues[0].issueId);
    }
  }, [issues, activeIssueId]);

  const handleIssueSelect = (id: string) => {
    setActiveIssueId(id);
    setShowAccount(false);
  };

  const handleProfileClick = () => {
    setShowAccount(true);
  };

  const handleBackToIssues = () => {
    setShowAccount(false);
  };

  if (error) {
    return <div className="text-red-500">Error loading issues: {error}</div>;
  }

  const activeIssue = issues.find(issue => issue.issueId === activeIssueId);

  return (
    <div className="flex h-screen">
      <Sidebar
        issues={issues}
        activeIssueId={activeIssueId}
        onIssueSelect={handleIssueSelect}
        selectedCategory={selectedCategory}
        selectedSource={selectedSource}
        sortOrder={sortOrder}
        availableCategories={[]} // We're not using categories for now
        availableSources={availableSources}
        onCategoryChange={setSelectedCategory}
        onSourceChange={setSelectedSource}
        onSortOrderChange={setSortOrder}
        onProfileClick={handleProfileClick}
        onTitleClick={() => setShowAccount(false)}
      />
      <main className="flex-1 overflow-auto">
        {showAccount ? (
          <Account onBack={handleBackToIssues} />
        ) : loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="text-gray-600">Loading...</div>
          </div>
        ) : activeIssue ? (
          <Article issue={activeIssue} />
        ) : (
          <div className="flex justify-center items-center h-full">
            <div className="text-gray-600">No issue selected</div>
          </div>
        )}
      </main>
    </div>
  );
}