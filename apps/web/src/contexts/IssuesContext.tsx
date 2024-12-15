import React, { createContext, useContext } from 'react';
import { useIssuesHook } from '../hooks/useIssues';
import type { Issue } from '../hooks/useIssues';

interface IssuesContextType {
  issues: Issue[];
  loading: boolean;
  error: string | null;
  availableSources: string[];
  refreshIssues: () => Promise<void>;
}

const IssuesContext = createContext<IssuesContextType | undefined>(undefined);

export function IssuesProvider({ children }: { children: React.ReactNode }) {
  const issuesData = useIssuesHook(); // Rename the hook to avoid naming conflict

  return (
    <IssuesContext.Provider value={issuesData}>
      {children}
    </IssuesContext.Provider>
  );
}

export function useIssues() {
  const context = useContext(IssuesContext);
  if (context === undefined) {
    throw new Error('useIssues must be used within an IssuesProvider');
  }
  return context;
} 