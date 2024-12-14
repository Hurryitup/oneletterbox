import React from 'react';
import { Star, Archive } from 'lucide-react';

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
    className={`newsletter-item ${isActive ? 'active' : ''} ${archived ? 'archived' : ''}`}
    onClick={onClick}
  >
    <div className="newsletter-content">
      <div className="newsletter-header">
        <h3>{title}</h3>
        <div className="newsletter-meta">
          {starred && <Star className="text-yellow-500" size={16} />}
          {archived && <Archive className="text-gray-500" size={16} />}
          {unreadCount !== undefined && (
            <span className="unread-count">{unreadCount}</span>
          )}
        </div>
      </div>
      <p className="description">{description}</p>
      <span className="date">{date}</span>
    </div>
  </button>
);