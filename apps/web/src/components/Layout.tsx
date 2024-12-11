import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar/Sidebar';
import { Article } from './Article/Article';

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

interface StoredPreferences {
  selectedCategory: string | null;
  selectedSource: string | null;
  sortOrder: 'desc' | 'asc';
}

export const Layout = () => {
  const newsletters: Newsletter[] = [
    {
      id: 'stratechery',
      category: 'Technology',
      title: 'Stratechery',
      description: 'The Future of Tech',
      date: 'Dec 9',
      unreadCount: 3,
      author: 'Ben Thompson',
      content: [
        `The impact of AI on software development has been profound, yet we're only at the beginning of understanding its full potential. Today's analysis explores how AI is reshaping not just how we write code, but how we think about software development as a discipline.`,
        `Large Language Models (LLMs) have demonstrated remarkable capabilities in code generation, but their true value lies in augmenting rather than replacing human developers. The key insights from recent developments suggest three major trends that will shape the future of software development:`,
        `First, we're seeing a shift from code completion to code collaboration. Modern AI assistants don't just suggest the next line of code; they engage in a dialogue about architecture, patterns, and trade-offs. This fundamentally changes how developers approach problem-solving, enabling them to operate at a higher level of abstraction while maintaining precise control over implementation details.`,
      ]
    },
    {
      id: 'notboring',
      category: 'Technology',
      title: 'Not Boring',
      description: 'Innovation Insights',
      date: 'Dec 8',
      unreadCount: 1,
      author: 'Packy McCormick',
      content: [
        `The intersection of technology and business strategy continues to evolve at a rapid pace.`,
        `Today's analysis explores the emerging trends in tech that are reshaping how companies approach innovation.`
      ]
    },
    {
      id: 'prageng',
      category: 'Engineering',
      title: 'The Pragmatic Engineer',
      description: 'Engineering at Scale',
      date: 'Dec 7',
      author: 'Gergely Orosz',
      content: [
        `Scaling engineering organizations presents unique challenges that go beyond technical solutions.`,
        `This week, we explore best practices for growing engineering teams while maintaining productivity and code quality.`
      ]
    }
  ];

  const [activeNewsletterId, setActiveNewsletterId] = useState(newsletters[0].id);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

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
      />
      <main className="main-content">
        <Article 
          title={activeNewsletter.title}
          newsletter={activeNewsletter.title}
          author={activeNewsletter.author}
          date={activeNewsletter.date}
          content={activeNewsletter.content}
        />
      </main>
    </div>
  );
};