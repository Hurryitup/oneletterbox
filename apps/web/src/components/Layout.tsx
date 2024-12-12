import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar } from './Sidebar/Sidebar';
import { Account } from './Account/Account';
import axios from 'axios';

interface Newsletter {
  id: string;
  category: string;
  title: string;
  description: string;
  date: string;
  unreadCount?: number;
  author: string;
  content: string[];
}

export function Layout() {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [activeNewsletterId, setActiveNewsletterId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [showAccount, setShowAccount] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNewsletters = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/newsletters', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        setNewsletters(response.data);
        if (response.data.length > 0) {
          setActiveNewsletterId(response.data[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch newsletters:', error);
      }
    };

    fetchNewsletters();
  }, []);

  // Reset selected source when category changes
  useEffect(() => {
    setSelectedSource(null);
  }, [selectedCategory]);

  const handleNewsletterSelect = (id: string) => {
    setActiveNewsletterId(id);
    setShowAccount(false);
  };

  const handleProfileClick = () => {
    setShowAccount(true);
    setActiveNewsletterId('');
  };

  const handleTitleClick = () => {
    setShowAccount(false);
    setActiveNewsletterId('');
  };

  const filteredNewsletters = newsletters
    .filter(newsletter => {
      if (selectedCategory && newsletter.category !== selectedCategory) {
        return false;
      }
      if (selectedSource && newsletter.title !== selectedSource) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

  const activeNewsletter = newsletters.find(n => n.id === activeNewsletterId);
  const availableCategories = Array.from(new Set(newsletters.map(n => n.category)));
  
  // Filter sources based on selected category
  const availableSources = Array.from(
    new Set(
      newsletters
        .filter(n => !selectedCategory || n.category === selectedCategory)
        .map(n => n.title)
    )
  );

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        newsletters={filteredNewsletters}
        activeNewsletterId={activeNewsletterId}
        onNewsletterSelect={handleNewsletterSelect}
        selectedCategory={selectedCategory}
        selectedSource={selectedSource}
        sortOrder={sortOrder}
        availableCategories={availableCategories}
        availableSources={availableSources}
        onCategoryChange={setSelectedCategory}
        onSourceChange={setSelectedSource}
        onSortOrderChange={setSortOrder}
        onProfileClick={handleProfileClick}
        onTitleClick={handleTitleClick}
      />
      <main className="flex-1 overflow-auto p-8">
        {showAccount ? (
          <Account onBack={() => setShowAccount(false)} />
        ) : activeNewsletter ? (
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-4">{activeNewsletter.title}</h1>
            <div className="text-gray-600 mb-8">
              <span className="mr-4">By {activeNewsletter.author}</span>
              <span>{activeNewsletter.date}</span>
            </div>
            {activeNewsletter.content.map((paragraph, index) => (
              <p key={index} className="mb-4 text-gray-800 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-600">
            Select a newsletter to start reading
          </div>
        )}
      </main>
    </div>
  );
}