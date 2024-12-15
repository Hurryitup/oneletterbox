import React, { useEffect, useState, useCallback, useRef } from 'react';
import { ArticleMeta } from './ArticleMeta';
import axios, { AxiosError } from 'axios';
import he from 'he';
import utf8 from 'utf8';
import styles from './Article.module.css';
import { useArticleCache } from '../../contexts/ArticleCacheContext';
import api from '../../services/api';
import { Menu } from 'react-feather';

interface Issue {
  issueId: string;
  subject: string;
  sender: string;
  receivedAt: string;
  s3Location: string;
  status: string;
  archived: boolean;
  starred: boolean;
}

interface ArticleProps {
  issue: Issue;
  onToggleCollapse: () => void;
}

interface EmailContentResponse {
  content: string;
}

type ViewMode = 'reader' | 'original';

// Add this near the top of the file, after imports
const EMAIL_CONTENT_WRAPPER_CLASS = 'email-content-wrapper';

// Add this function to sanitize email content
const sanitizeEmailContent = (content: string): string => {
  return content
    // Remove all style tags and their contents
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    // Remove all link tags
    .replace(/<link[^>]*>/gi, '')
    // Remove meta tags
    .replace(/<meta[^>]*>/gi, '')
    // Remove inline styles
    .replace(/\sstyle="[^"]*"/gi, '')
    // Remove classes except our own
    .replace(/\sclass="(?!reader-content|newsletter-content)[^"]*"/gi, '')
    // Remove font tags but keep content
    .replace(/<\/?font[^>]*>/gi, '')
    // Remove width/height/align attributes
    .replace(/\s(width|height|align)="[^"]*"/gi, '')
    // Remove background colors and other style-related attributes
    .replace(/\s(bgcolor|background|color)="[^"]*"/gi, '')
    // Remove any remaining style-related attributes
    .replace(/\s(face|size)="[^"]*"/gi, '');
};

// Helper function to decode text with proper UTF-8 handling
const decodeText = (content: string): string => {
  try {
    // First decode quoted-printable
    const qpDecoded = content.replace(/=\r\n/g, '')
      .replace(/=([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16)));
    
    // Then decode UTF-8
    const utf8Decoded = utf8.decode(qpDecoded);
    
    // Finally decode HTML entities
    return he.decode(utf8Decoded);
  } catch (error) {
    console.error('Error decoding text:', error);
    // If UTF-8 decoding fails, try just HTML entity decoding
    try {
      return he.decode(content);
    } catch (e) {
      console.error('Error decoding HTML entities:', e);
      return content;
    }
  }
};

// Helper function to identify the main content section in a forwarded email
const findMainContent = (parts: string[]): { content: string; startIndex: number } => {
  let forwardedHeaderIndex = -1;
  let contentStartIndex = -1;
  
  // First find the forwarded message header
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    if (part.match(/[-]{3,}\s*Forwarded message\s*[-]{3,}/) ||
        part.match(/Begin forwarded message:/) ||
        (part.includes('From:') && part.includes('Date:') && part.includes('Subject:') && part.includes('To:'))) {
      forwardedHeaderIndex = i;
      break;
    }
  }

  // If we found a forwarded header, look for the actual content start
  if (forwardedHeaderIndex !== -1) {
    for (let i = forwardedHeaderIndex + 1; i < parts.length; i++) {
      const part = parts[i].trim();
      // Skip the forwarded email headers
      if (part.includes('From:') || part.includes('Date:') || 
          part.includes('Subject:') || part.includes('To:') ||
          part.includes('Content-Type:') || part.includes('Content-Transfer-Encoding:')) {
        continue;
      }
      // Found the start of actual content
      if (part.length > 0) {
        contentStartIndex = i;
        break;
      }
    }
  }

  // If we couldn't find forwarded content markers, treat it as a regular email
  if (contentStartIndex === -1) {
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim();
      if (!part.includes('Content-Type:') && 
          !part.includes('Content-Transfer-Encoding:') &&
          !part.includes('MIME-Version:') &&
          part.length > 0) {
        contentStartIndex = i;
        break;
      }
    }
  }

  // Combine all parts after the content start
  const contentParts = parts.slice(contentStartIndex).filter(part => {
    const trimmed = part.trim();
    // Filter out email footers and signatures
    return !trimmed.match(/^[-_]{3,}/) && // Signature separators
           !trimmed.match(/^Sent from/) && // Mobile email signatures
           !trimmed.includes('Content-Type:') &&
           !trimmed.includes('Content-Transfer-Encoding:') &&
           trimmed.length > 0;
  });

  return {
    content: contentParts.join('\n\n'),
    startIndex: contentStartIndex
  };
};

// Helper function to extract and format newsletter content
const extractNewsletterContent = (rawContent: string, preserveImages: boolean = false): string => {
  try {
    // First decode the content
    let decodedContent = decodeText(rawContent);
    
    // Split into parts and find the actual newsletter content
    const parts = decodedContent.split(/\r?\n\r?\n/);
    let newsletterContent = '';
    let foundContent = false;
    
    // Find the part that contains the actual newsletter content
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      
      // Skip email headers and metadata
      if (part.includes('Content-Type:') || 
          part.includes('Content-Transfer-Encoding:') ||
          part.includes('MIME-Version:')) {
        continue;
      }

      // Check for forwarded message markers
      if (part.match(/[-]{3,}\s*Forwarded message\s*[-]{3,}/) ||
          part.match(/Begin forwarded message:/) ||
          (part.includes('From:') && part.includes('Date:') && part.includes('Subject:') && part.includes('To:'))) {
        // Skip this part and the next part (usually forwarding headers)
        i++;
        continue;
      }

      // Found content - add it to our newsletter content
      if (part.trim().length > 0) {
        foundContent = true;
        newsletterContent += part + '\n\n';
      }
    }

    // If we haven't found any content, try again without skipping forwarded headers
    if (!foundContent) {
      newsletterContent = parts.filter(part => 
        !part.includes('Content-Type:') && 
        !part.includes('Content-Transfer-Encoding:') &&
        part.trim().length > 0
      ).join('\n\n');
    }
    
    // Clean up the content
    newsletterContent = newsletterContent
      .replace(/\[image:[^\]]+\]/g, preserveImages ? '<div class="text-gray-400 text-sm my-4">[Image]</div>' : '')
      .trim();

    // Handle inline images in HTML content
    if (preserveImages) {
      // Convert data URIs to img tags
      newsletterContent = newsletterContent.replace(
        /src="data:image\/(jpeg|png|gif|webp);base64,([^"]+)"/g,
        'src="data:image/$1;base64,$2" class="max-w-full h-auto my-4 rounded shadow-sm"'
      );

      // Handle CID (Content-ID) images
      newsletterContent = newsletterContent.replace(
        /src="cid:([^"]+)"/g,
        'src="$1" class="max-w-full h-auto my-4 rounded shadow-sm"'
      );

      // Add styling to existing img tags that don't have our classes
      newsletterContent = newsletterContent.replace(
        /<img(?![^>]*class=)[^>]+>/g,
        (match) => match.replace('>', ' class="max-w-full h-auto my-4 rounded shadow-sm">')
      );
    } else {
      // Remove all img tags for reader view
      newsletterContent = newsletterContent.replace(/<img[^>]+>/g, '');
    }

    // Pre-process the content to ensure proper paragraph separation
    newsletterContent = newsletterContent
      // Normalize line endings
      .replace(/\r\n/g, '\n')
      // Normalize encoded spaces and special characters
      .replace(/=20/g, ' ')
      .replace(/=E2=80=99/g, "'")
      .replace(/=E2=80=9C/g, '"')
      .replace(/=E2=80=9D/g, '"')
      // Fix common encoding artifacts
      .replace(/(?<=[a-zA-Z0-9]);(?=\s|$)/g, ';') // Fix detached semicolons
      .replace(/(?<=[a-zA-Z0-9])\.(?=\s|$)/g, '.') // Fix detached periods
      // Ensure paragraphs are properly separated
      .replace(/([.!?;])\s*\n(?=[A-Z])/g, '$1\n\n') // Add double newline after sentence endings
      .replace(/\n{3,}/g, '\n\n') // Normalize multiple newlines to exactly two
      // Special handling for standalone phrases that might be headings
      .replace(/^([^\n.!?]{1,60})\n(?=[A-Z])/gm, '$1\n\n')
      // Clean up any remaining artifacts
      .trim();

    // Format the content with proper HTML structure
    const formattedContent = newsletterContent
      .split(/\n\n+/)                  // Split on multiple newlines
      .map(paragraph => {
        paragraph = paragraph.trim()
          // Join lines that were split mid-sentence
          .replace(/\n(?![A-Z])/g, ' ')
          // Clean up any remaining whitespace
          .replace(/\s+/g, ' ');

        if (!paragraph) return '';

        // Enhanced heading detection
        const isAllCaps = /^[A-Z0-9\s.,!?&-]+$/.test(paragraph);
        const hasNumberPrefix = /^\d+[\.\)]\s+/.test(paragraph);
        const isShortLine = paragraph.length < 60;
        const endsWithColon = paragraph.endsWith(':');
        const containsSentenceEnders = /[.!?]/.test(paragraph);
        const hasCommonHeadingWords = /(introduction|summary|conclusion|overview|background|analysis|update|key\s+points|highlights|in\s+brief)/i.test(paragraph);
        const isLikelyHeading = /^(?:[A-Z][a-z]+\s*)+$/.test(paragraph); // Title Case detection
        const hasInlineFormatting = paragraph.includes('<b>') || paragraph.includes('<strong>');
        const isStandalonePhrase = !containsSentenceEnders && paragraph.split(/\s+/).length <= 5;
        
        // Gmail/Apple Mail style heading detection
        if ((isShortLine || isStandalonePhrase) && !paragraph.includes('\n')) {
          // Remove any existing HTML tags for clean text analysis
          const cleanText = paragraph.replace(/<[^>]+>/g, '').trim();
          
          if (isAllCaps || (hasInlineFormatting && cleanText.length < 40)) {
            return `<h1>${cleanText}</h1>`;
          } else if (
            (isLikelyHeading && !containsSentenceEnders) || 
            (hasNumberPrefix && cleanText.length < 40) ||
            (hasCommonHeadingWords && !containsSentenceEnders) ||
            (endsWithColon && cleanText.length < 40) ||
            (isStandalonePhrase && cleanText.length < 40)
          ) {
            return `<h2>${cleanText}</h2>`;
          } else if (!containsSentenceEnders && cleanText.length < 45) {
            return `<h3>${cleanText}</h3>`;
          }
        }

        // Format paragraphs with proper spacing and handle special cases
        const formattedParagraph = paragraph
          .split('\n')
          .map(line => line.trim())
          .filter(line => line)
          .join(' ');

        // Check for list items
        if (hasNumberPrefix || /^[-•*]\s/.test(formattedParagraph)) {
          return `<li class="mb-3 leading-relaxed">${formattedParagraph.replace(/^\d+[\.\)]\s+|-\s+|•\s+|\*\s+/, '')}</li>`;
        }

        // Regular paragraphs
        return `<p class="mb-6 leading-relaxed">${formattedParagraph}</p>`;
      })
      .filter(p => p);                   // Remove empty paragraphs

    // Wrap lists in proper list elements
    const contentWithLists = formattedContent
      .join('\n')
      .replace(/<li.*?>(.*?)<\/li>\n(?=<li)/g, '<li class="mb-3 leading-relaxed">$1</li>\n')
      .replace(/(<li.*?>.*?<\/li>\n+)+/g, (match) => {
        if (match.includes('1.') || match.includes(')')) {
          return `<ol class="list-decimal pl-6 mb-6 space-y-2">\n${match}</ol>\n`;
        }
        return `<ul class="list-disc pl-6 mb-6 space-y-2">\n${match}</ul>\n`;
      });

    return `
      <div class="newsletter-content">
        ${contentWithLists}
      </div>
    `;
  } catch (error) {
    console.error("Error extracting newsletter content:", error);
    return '<div class="text-red-500">Error formatting newsletter content</div>';
  }
};

// Helper function to extract HTML content from multipart email
const extractHtmlContent = (rawContent: string): string => {
  // First try to get HTML content from multipart boundary
  const boundaryMatch = rawContent.match(/boundary="([^"]+)"/);
  if (boundaryMatch) {
    const boundary = boundaryMatch[1];
    const parts = rawContent.split('--' + boundary);
    
    // Find the HTML part (search from end to prioritize HTML over plain text)
    for (let i = parts.length - 1; i >= 0; i--) {
      const part = parts[i];
      if (part.includes('Content-Type: text/html')) {
        const contentStart = part.indexOf('\r\n\r\n');
        if (contentStart !== -1) {
          return part.substring(contentStart + 4);
        }
      }
    }
  }

  // If no HTML part found, check if the content is already HTML
  if (rawContent.toLowerCase().includes('<!doctype html') || 
      rawContent.toLowerCase().includes('<html') ||
      rawContent.includes('<body')) {
    // Try to extract body content
    const bodyMatch = rawContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      return bodyMatch[1];
    }
  }
  
  // If still no HTML found, return the raw content
  return rawContent;
};

// Helper function to clean HTML content
const cleanHtmlContent = (content: string): string => {
  return content
    // Remove comments
    .replace(/<!--[\s\S]*?-->/g, '')
    // Remove scripts
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove style tags
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // Remove tracking pixels
    .replace(/<img[^>]*(?:width|height)\s*=\s*["']?(?:1|0)\b[^>]*>/gi, '')
    // Remove empty paragraphs
    .replace(/<p[^>]*>(\s|&nbsp;)*<\/p>/gi, '')
    // Remove empty divs
    .replace(/<div[^>]*>(\s|&nbsp;)*<\/div>/gi, '')
    // Remove empty spans
    .replace(/<span[^>]*>(\s|&nbsp;)*<\/span>/gi, '')
    // Remove line breaks between tags
    .replace(/>\s+</g, '><')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
};

// Helper function to parse email content in reader mode
const parseReaderView = (rawContent: string): string => {
  try {
    // First try to get HTML content if available
    const boundaryMatch = rawContent.match(/boundary="([^"]+)"/);
    let content = '';
    
    if (boundaryMatch) {
      const boundary = boundaryMatch[1];
      const parts = rawContent.split('--' + boundary);
      
      // Find the HTML part
      for (let i = parts.length - 1; i >= 0; i--) {
        const part = parts[i];
        if (part.includes('Content-Type: text/html')) {
          const contentStart = part.indexOf('\r\n\r\n');
          if (contentStart !== -1) {
            content = part.substring(contentStart + 4);
            break;
          }
        }
      }
    }
    
    // If no HTML content found, use the raw content
    if (!content) {
      content = rawContent;
    }

    // First sanitize the content
    let processedContent = sanitizeEmailContent(content);

    // Then process for reader view (remove images and links)
    processedContent = processedContent
      // Remove tracking pixels and small images
      .replace(/<img[^>]*(?:width|height)\s*=\s*["']?(?:1|0)\b[^>]*>/gi, '')
      // Remove all other images
      .replace(/<img[^>]*>/gi, '')
      // Remove empty ad links and tracking pixels
      .replace(/<a[^>]*>(?:\s*|&nbsp;)*<\/a>/gi, '')
      .replace(/<a[^>]*>\s*<img[^>]*(?:width|height)\s*=\s*["']?(?:1|0)\b[^>]*>\s*<\/a>/gi, '')
      // Remove links but preserve text
      .replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, '$1');

    // Process the content for proper formatting
    return extractNewsletterContent(processedContent, false);
  } catch (error) {
    console.error("Error parsing email content:", error);
    return '<div class="text-red-500">Error parsing email content</div>';
  }
};

// Helper function to parse email content in original view
const parseOriginalView = (rawContent: string): string => {
  try {
    // Split content into parts based on multipart boundary if present
    const boundaryMatch = rawContent.match(/boundary="([^"]+)"/);
    if (boundaryMatch) {
      const boundary = boundaryMatch[1];
      const parts = rawContent.split('--' + boundary);
      
      // Find the HTML part
      let htmlPart = '';
      for (let i = parts.length - 1; i >= 0; i--) {
        const part = parts[i];
        if (part.includes('Content-Type: text/html')) {
          htmlPart = part;
          break;
        }
      }
      
      if (htmlPart) {
        // Extract just the HTML content, removing headers
        const contentStart = htmlPart.indexOf('\r\n\r\n');
        if (contentStart !== -1) {
          htmlPart = htmlPart.substring(contentStart + 4);
          
          // First sanitize the content
          let processedContent = sanitizeEmailContent(htmlPart);

          // Process the content for proper formatting while preserving images and links
          return extractNewsletterContent(processedContent, true);
        }
      }
    }
    
    // If no HTML part found, fall back to text formatting
    return extractNewsletterContent(rawContent, true);
  } catch (error) {
    console.error("Error parsing email content:", error);
    return '<div class="text-red-500">Error parsing email content</div>';
  }
};

const EmailContentContainer: React.FC<{ content: string; viewMode: ViewMode }> = ({ content, viewMode }) => {
  const isDarkMode = document.documentElement.classList.contains('dark');
  const computedStyle = getComputedStyle(document.documentElement);
  const cssVars = Array.from(computedStyle)
    .filter(prop => prop.startsWith('--'))
    .reduce((acc, prop) => {
      acc[prop] = computedStyle.getPropertyValue(prop);
      return acc;
    }, {} as Record<string, string>);

  const containerStyles = {
    contain: 'style layout',
    isolation: 'isolate',
    width: '100%',
    display: 'block'
  } as const;

  const cssVariables = `
    ${Object.entries(cssVars).map(([prop, value]) => `${prop}: ${value};`).join('\n')}
  `;

  const styles = `
    <style>
      .content-wrapper {
        --shadow-root-bg: ${viewMode === 'original' ? 'var(--bg-secondary)' : 'transparent'};
        --content-bg: ${viewMode === 'original' ? 'var(--bg-primary)' : 'transparent'};
        background: var(--shadow-root-bg);
        min-height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        ${cssVariables}
      }

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      .newsletter-content {
        color: var(--text-primary);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        font-size: 16px;
        line-height: 1.6;
        padding: 2rem;
        width: 100%;
        max-width: ${viewMode === 'original' ? '896px' : '680px'};
        margin: 0 auto;
        background: var(--content-bg);
        border-radius: ${viewMode === 'original' ? '8px' : '0'};
        box-shadow: ${viewMode === 'original' ? '0 1px 3px rgba(0, 0, 0, 0.05)' : 'none'};
      }

      .newsletter-content > * {
        margin-left: auto;
        margin-right: auto;
        max-width: 100%;
      }

      .reader-content {
        color: var(--text-primary);
        font-family: Charter, 'Bitstream Charter', 'Sitka Text', Cambria, serif;
        font-size: 1.125rem;
        line-height: 1.8;
        padding: 2rem;
        width: 100%;
        max-width: ${viewMode === 'original' ? '896px' : '680px'};
        margin: 0 auto;
      }

      h1, h2, h3 {
        color: var(--text-primary);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        line-height: 1.3;
        font-weight: 600;
        margin: 1.5em 0 0.75em;
        width: 100%;
      }

      h1:first-child,
      h2:first-child,
      h3:first-child {
        margin-top: 0;
      }

      h1 { font-size: 1.5rem; }
      h2 { font-size: 1.25rem; }
      h3 { font-size: 1.125rem; }

      p { 
        margin: 0 0 1em;
        padding: 0;
        color: var(--text-primary);
        width: 100%;
      }

      img {
        max-width: 100%;
        height: auto;
        display: block;
        margin: 1.5rem auto;
      }

      a {
        color: var(--link-primary);
        text-decoration: underline;
        text-underline-offset: 0.2em;
      }

      ul, ol {
        margin: 0 0 1em;
        padding-left: 2em;
        color: var(--text-primary);
        width: 100%;
      }

      li { margin-bottom: 0.5em; }

      table {
        width: 100%;
        border-collapse: collapse;
        margin: 1rem 0;
        color: var(--text-primary);
        border: none;
      }

      tr {
        border: none;
      }

      td, th {
        padding: 8px;
        border: none;
        vertical-align: top;
      }

      /* Fix table layout */
      table[id*="wrapper"] {
        border: none !important;
        border-collapse: collapse !important;
        width: 100% !important;
        max-width: ${viewMode === 'original' ? '896px' : '680px'} !important;
        margin: 0 auto !important;
      }

      table[id*="wrapper"] td {
        border: none !important;
        padding: 0 !important;
      }

      @media (max-width: 768px) {
        .newsletter-content,
        .reader-content {
          padding: 1.5rem;
          font-size: 15px;
        }
        
        .content-wrapper {
          padding: 0.5rem;
        }

        .newsletter-content {
          border-radius: ${viewMode === 'original' ? '6px' : '0'};
        }

        h1 { font-size: 1.375rem; }
        h2 { font-size: 1.25rem; }
        h3 { font-size: 1.125rem; }
      }

      @media (max-width: 480px) {
        .newsletter-content,
        .reader-content {
          padding: 1rem;
        }
        
        .content-wrapper {
          padding: 0.25rem;
        }
      }

      .dark a { 
        color: var(--link-primary-dark);
      }
    </style>
  `;

  return (
    <div 
      style={containerStyles}
      className={isDarkMode ? 'dark' : 'light'}
      dangerouslySetInnerHTML={{
        __html: `
          ${styles}
          <div class="content-wrapper">
            ${content}
          </div>
        `
      }}
    />
  );
};

export const Article: React.FC<ArticleProps> = ({ issue, onToggleCollapse }) => {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('original');
  const [isContentVisible, setIsContentVisible] = useState(false);
  const { getCachedContent, setCachedContent } = useArticleCache();

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchContent = async () => {
      // Check cache first
      const cachedContent = getCachedContent(issue.issueId);
      if (cachedContent) {
        if (isMounted) {
          const newContent = viewMode === 'reader' ? cachedContent.parsedContent.reader : cachedContent.parsedContent.original;
          setContent(newContent);
          setLoading(false);
          setError(null);
          setIsContentVisible(true);
        }
        return;
      }

      try {
        setLoading(true);
        setIsContentVisible(false);

        const response = await api.get(`/inboxes/${issue.issueId}/content`, {
          signal: controller.signal
        });
        
        if (!isMounted) return;

        const rawContent = response.data.content;
        const readerContent = parseReaderView(rawContent);
        const originalContent = parseOriginalView(rawContent);

        // Cache the content
        setCachedContent(issue.issueId, {
          rawContent,
          parsedContent: {
            reader: readerContent,
            original: originalContent,
          },
        });

        if (!isMounted) return;

        // Set the current view's content
        const newContent = viewMode === 'reader' ? readerContent : originalContent;
        setContent(newContent);
        setError(null);
        setLoading(false);
        setIsContentVisible(true);
      } catch (err) {
        if (!isMounted) return;
        
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }

        const errorMessage = err instanceof AxiosError 
          ? err.response?.data?.message || 'Failed to load email content'
          : 'Failed to load email content';
        setError(errorMessage);
        console.error('Error loading email content:', err);
        setLoading(false);
        setIsContentVisible(true);
      }
    };

    fetchContent();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [issue.issueId, viewMode, getCachedContent, setCachedContent]);

  const toggleViewMode = useCallback(() => {
    const cachedContent = getCachedContent(issue.issueId);
    if (cachedContent) {
      setIsContentVisible(false);
      // Small delay to allow fade out
      setTimeout(() => {
        const newMode = viewMode === 'reader' ? 'original' : 'reader';
        setViewMode(newMode);
      }, 300);
    } else {
      const newMode = viewMode === 'reader' ? 'original' : 'reader';
      setViewMode(newMode);
    }
  }, [viewMode, issue.issueId, getCachedContent]);

  return (
    <article className={styles.articleContainer}>
      <div className={styles.contentWrapper}>
        <div className={styles.header}>
          {/* Mobile top bar - only sticky part */}
          <div className={styles.topBar}>
            <div className={styles.topBarLeft}>
              <button 
                className={`${styles.hamburgerButton} md:hidden`}
                onClick={onToggleCollapse}
                aria-label="Toggle menu"
              >
                <Menu size={20} />
              </button>
              <h1 className={styles.topBarTitle}>
                OneLetterBox
              </h1>
            </div>
            <button
              onClick={toggleViewMode}
              className={styles.viewModeButton}
            >
              {viewMode === 'reader' ? 'Original View' : 'Reader View'}
            </button>
          </div>

          {/* Main header content - scrolls away */}
          <div className={styles.headerContent}>
            <div className={styles.titleArea}>
              <h1 className={styles.title}>
                {issue.subject}
              </h1>
              <div className={styles.meta}>
                <ArticleMeta 
                  newsletter={issue.sender}
                  author=""
                  date={new Date(issue.receivedAt).toLocaleString()}
                />
              </div>
            </div>
            {/* Desktop view mode button */}
            <button
              onClick={toggleViewMode}
              className={styles.viewModeButton}
            >
              {viewMode === 'reader' ? 'Original View' : 'Reader View'}
            </button>
          </div>
        </div>

        <div className="relative flex-grow">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-900 transition-colors duration-200">
              <div className="text-gray-600 dark:text-gray-300">Loading...</div>
            </div>
          )}

          <div 
            className={`${viewMode === 'reader' ? styles.readerViewContainer : styles.originalView} ${isContentVisible ? styles.visible : ''}`}
          >
            {error ? (
              <div className="text-red-600 dark:text-red-400 py-6 md:py-8">{error}</div>
            ) : content ? (
              <EmailContentContainer content={content} viewMode={viewMode} />
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
};