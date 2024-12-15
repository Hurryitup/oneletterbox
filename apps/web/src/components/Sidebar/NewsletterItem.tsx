import React from 'react';
import { Star, Archive } from 'lucide-react';
import styles from './Sidebar.module.css';

interface NewsletterItemProps {
  title: string;
  description: string;
  date: string;
  unreadCount?: number;
  isActive: boolean;
  onClick: () => void;
  starred?: boolean;
  archived?: boolean;
}

export const NewsletterItem = ({
  title,
  description,
  date,
  unreadCount,
  isActive,
  onClick,
  starred,
  archived,
}: NewsletterItemProps) => (
  <button
    className={`${styles.newsletterItem} ${isActive ? styles.active : ''}`}
    onClick={onClick}
  >
    <div className={styles.newsletterContent}>
      <div className={styles.newsletterHeader}>
        <h3 className={styles.newsletterTitle}>{title}</h3>
        <div className={styles.newsletterMeta}>
          {starred && <Star className="text-yellow-500" size={16} />}
          {archived && <Archive className="text-gray-400 dark:text-gray-500" size={16} />}
          {unreadCount !== undefined && (
            <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
      </div>
      <p className={styles.description}>{description}</p>
      <span className={styles.date}>{date}</span>
    </div>
  </button>
);