import React, { useEffect, useState, useCallback, useRef } from 'react';
import { NewsletterItem } from './NewsletterItem';
import { Category } from './Category';
import { GroupingControls } from './GroupingControls';
import { UserCircle, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';
import styles from './Sidebar.module.css';
import { extractSenderName } from '../../utils/email';

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
  isCollapsed?: boolean;
  onToggleCollapse: () => void;
  isMobileMenuOpen?: boolean;
  onMobileMenuClose: () => void;
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
  isCollapsed = false,
  onToggleCollapse,
  isMobileMenuOpen = false,
  onMobileMenuClose,
}: SidebarProps) => {
  const [width, setWidth] = useState(320);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const sidebarRef = useRef<HTMLElement>(null);
  const dragWidthRef = useRef(width);
  const rafRef = useRef<number>();

  // Update isMobile state on window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Only enable dragging on desktop
  const startResize = useCallback((e: React.MouseEvent) => {
    if (!isMobile) {
      setIsDragging(true);
      dragWidthRef.current = width;
      e.preventDefault();
      if (sidebarRef.current) {
        sidebarRef.current.classList.add(styles.resizing);
      }
    }
  }, [isMobile, width]);

  const stopResize = useCallback(() => {
    setIsDragging(false);
    if (sidebarRef.current) {
      sidebarRef.current.classList.remove(styles.resizing);
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isDragging && !isMobile) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      
      rafRef.current = requestAnimationFrame(() => {
        const newWidth = Math.min(Math.max(280, e.clientX), 600);
        dragWidthRef.current = newWidth;
        setWidth(newWidth);
      });
    }
  }, [isDragging, isMobile]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', resize);
      document.addEventListener('mouseup', stopResize);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
    }

    return () => {
      document.removeEventListener('mousemove', resize);
      document.removeEventListener('mouseup', stopResize);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isDragging, resize, stopResize]);

  // Ensure issues is an array before filtering
  const safeIssues = Array.isArray(issues) ? issues : [];
  
  // Filter issues based on selected source and category
  const filteredIssues = safeIssues.filter(issue => {
    if (selectedSource && issue.sender !== selectedSource) return false;
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

  // Format sources to use display names
  const formattedSources = availableSources.map(source => ({
    value: source,
    label: extractSenderName(source),
  }));

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`${styles.overlay} ${isMobileMenuOpen ? styles.visible : ''}`}
        onClick={onMobileMenuClose}
      />

      <aside 
        ref={sidebarRef}
        className={`${styles.sidebar} ${isCollapsed && !isMobile ? styles.collapsed : ''} ${isMobileMenuOpen ? styles.visible : ''}`}
        style={isMobile ? undefined : { width: isCollapsed ? undefined : `${width}px` }}
      >
        <div 
          className={`${styles.resizeHandle} ${isDragging ? styles.dragging : ''}`}
          onMouseDown={!isCollapsed && !isMobile ? startResize : undefined}
        />
        
        <div className={styles.sidebarHeader}>
          {!isCollapsed && (
            <h1>
              <button 
                onClick={onTitleClick}
                className={styles.titleButton}
              >
                OneLetterBox
              </button>
            </h1>
          )}
          <div className="flex items-center gap-2">
            {!isCollapsed && (
              <button 
                className={styles.profileButton}
                onClick={onProfileClick}
                aria-label="Account settings"
              >
                <UserCircle size={24} />
              </button>
            )}
            {isMobile ? (
              <button
                onClick={onMobileMenuClose}
                className={styles.closeButton}
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            ) : (
              <button
                onClick={onToggleCollapse}
                className={styles.collapseButton}
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
              </button>
            )}
          </div>
        </div>

        {(!isCollapsed || isMobile) && (
          <>
            <GroupingControls
              categories={availableCategories}
              sources={formattedSources}
              selectedCategory={selectedCategory}
              selectedSource={selectedSource}
              sortOrder={sortOrder}
              onCategoryChange={onCategoryChange}
              onSourceChange={onSourceChange}
              onSortOrderChange={onSortOrderChange}
            />
            <div className={styles.newsletterList}>
              {Object.entries(groupedIssues).map(([date, dateIssues]) => (
                <React.Fragment key={date}>
                  <div className={styles.category}>{date}</div>
                  {dateIssues.map(issue => (
                    <NewsletterItem 
                      key={issue.issueId}
                      title={issue.subject}
                      description={extractSenderName(issue.sender)}
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
          </>
        )}
      </aside>
    </>
  );
};