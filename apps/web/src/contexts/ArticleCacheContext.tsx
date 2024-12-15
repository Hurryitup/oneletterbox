import React, { createContext, useContext, useState } from 'react';

interface CachedArticle {
  rawContent: string;
  parsedContent: {
    reader: string;
    original: string;
  };
}

interface ArticleCacheContextType {
  getCachedContent: (issueId: string) => CachedArticle | null;
  setCachedContent: (issueId: string, content: CachedArticle) => void;
  clearCache: () => void;
}

const ArticleCacheContext = createContext<ArticleCacheContextType | null>(null);

export const useArticleCache = () => {
  const context = useContext(ArticleCacheContext);
  if (!context) {
    throw new Error('useArticleCache must be used within an ArticleCacheProvider');
  }
  return context;
};

export const ArticleCacheProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cache, setCache] = useState<Record<string, CachedArticle>>({});

  const getCachedContent = (issueId: string) => {
    return cache[issueId] || null;
  };

  const setCachedContent = (issueId: string, content: CachedArticle) => {
    setCache(prev => ({
      ...prev,
      [issueId]: content,
    }));
  };

  const clearCache = () => {
    setCache({});
  };

  return (
    <ArticleCacheContext.Provider value={{ getCachedContent, setCachedContent, clearCache }}>
      {children}
    </ArticleCacheContext.Provider>
  );
}; 