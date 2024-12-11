import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar/Sidebar';
import { Article } from './Article/Article';
import { Account } from './Account/Account';

interface Newsletter {
  id: string;
  category: string;
  title: string;
  description: string;
  date: string;
  unreadCount?: number;
  content: string[];
  author: string;
}

const STORAGE_KEY = 'newsletter-preferences';
const API_URL = 'http://localhost:3001';

interface StoredPreferences {
  selectedCategory: string | null;
  selectedSource: string | null;
  sortOrder: 'desc' | 'asc';
}

export const Layout = () => {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeNewsletterId, setActiveNewsletterId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [showAccount, setShowAccount] = useState(false);

  // Fetch newsletters from API
  useEffect(() => {
    const fetchNewsletters = async () => {
      try {
        const response = await fetch(`${API_URL}/api/newsletters`);
        if (!response.ok) {
          throw new Error('Failed to fetch newsletters');
        }
        const data = await response.json();
        setNewsletters(data);
        if (data.length > 0 && !activeNewsletterId) {
          setActiveNewsletterId(data[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchNewsletters();
  }, []);

  // Load preferences from localStorage
  useEffect(() => {
    const storedPrefs = localStorage.getItem(STORAGE_KEY);
    if (storedPrefs) {
      const prefs: StoredPreferences = JSON.parse(storedPrefs);
      setSelectedCategory(prefs.selectedCategory);
      setSelectedSource(prefs.selectedSource);
      setSortOrder(prefs.sortOrder);
    }
  }, []);

  // Save preferences to localStorage
  useEffect(() => {
    const prefs: StoredPreferences = {
      selectedCategory,
      selectedSource,
      sortOrder
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }, [selectedCategory, selectedSource, sortOrder]);

  const handleTitleClick = () => {
    if (showAccount) {
      setShowAccount(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  // Filter and sort newsletters
  const filteredNewsletters = newsletters
    .filter(n => !selectedCategory || n.category === selectedCategory)
    .filter(n => !selectedSource || n.title === selectedSource)
    .sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sortOrder === 'desc' 
        ? dateB.getTime() - dateA.getTime()
        : dateA.getTime() - dateB.getTime();
    });

  const activeNewsletter = newsletters.find(n => n.id === activeNewsletterId)!;
  const availableCategories = Array.from(new Set(newsletters.map(n => n.category)));
  const availableSources = Array.from(
    new Set(
      newsletters
        .filter(n => !selectedCategory || n.category === selectedCategory)
        .map(n => n.title)
    )
  );

  return (
    <div className="app">
      <Sidebar 
        newsletters={filteredNewsletters}
        activeNewsletterId={activeNewsletterId}
        onNewsletterSelect={setActiveNewsletterId}
        selectedCategory={selectedCategory}
        selectedSource={selectedSource}
        sortOrder={sortOrder}
        availableCategories={availableCategories}
        availableSources={availableSources}
        onCategoryChange={setSelectedCategory}
        onSourceChange={setSelectedSource}
        onSortOrderChange={setSortOrder}
        onProfileClick={() => setShowAccount(true)}
        onTitleClick={handleTitleClick}
      />
      <main className="main-content">
        {showAccount ? (
          <Account onBack={() => setShowAccount(false)} />
        ) : (
          <Article 
            title={activeNewsletter.title}
            newsletter={activeNewsletter.title}
            author={activeNewsletter.author}
            date={activeNewsletter.date}
            content={activeNewsletter.content}
          />
        )}
      </main>
    </div>
  );
};