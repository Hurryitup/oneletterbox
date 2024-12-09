import React from 'react';

interface NewsletterItemProps {
  title: string;
  description: string;
  date: string;
  unreadCount?: number;
  isActive?: boolean;
  onClick?: () => void;
}

export const NewsletterItem = ({ title, description, date, unreadCount, isActive, onClick }: NewsletterItemProps) => (
  <div className={`newsletter-item ${isActive ? 'active' : ''}`} onClick={onClick}>
    <div className="newsletter-info">
      <h3>{title}</h3>
      <p>{description}</p>
      <span className="date">{date}</span>
    </div>
    {unreadCount !== undefined && (
      <div className="unread-count">{unreadCount}</div>
    )}
  </div>
);