import React, { useEffect, useState } from 'react';
import { ArticleMeta } from './ArticleMeta';
import axios, { AxiosError } from 'axios';
import he from 'he';
import utf8 from 'utf8';

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
}

interface EmailContentResponse {
  content: string;
}

type ViewMode = 'reader' | 'original';

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

// Helper function to extract and format newsletter content
const extractNewsletterContent = (rawContent: string, preserveImages: boolean = false): string => {
  try {
    // First decode the content
    let decodedContent = decodeText(rawContent);
    
    // Split into parts and find the actual newsletter content
    const parts = decodedContent.split(/\r?\n\r?\n/);
    let newsletterContent = '';
    
    // Find the part that contains the actual newsletter content
    // Usually after the forwarded message headers and before any footers
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      // Skip email headers and forwarded message headers
      if (part.includes('Content-Type:') || 
          part.includes('Content-Transfer-Encoding:') ||
          part.match(/[-]{3,}\s*Forwarded message\s*[-]{3,}/) ||
          part.includes('From:') && part.includes('Date:') && part.includes('Subject:')) {
        continue;
      }
      
      // Found the content - add it to our newsletter content
      newsletterContent += part + '\n\n';
    }

    // Clean up the content
    newsletterContent = newsletterContent
      .replace(/\[image:[^\]]+\]/g, preserveImages ? '<div class="text-gray-400 text-sm my-4">[Image]</div>' : '') // Replace image placeholders
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

    // Format the content with proper HTML structure
    const formattedContent = newsletterContent
      .split(/\n{2,}/)                  // Split on paragraph breaks
      .map(paragraph => {
        paragraph = paragraph.trim();
        if (!paragraph) return '';
        
        // Format headings (like "Special purpose vehicles")
        if (paragraph.length < 50 && !paragraph.includes('.') && !paragraph.includes(':')) {
          return `<h2 class="text-2xl font-bold mt-8 mb-4">${paragraph}</h2>`;
        }
        
        // Format paragraphs with proper spacing
        return `<p class="mb-6 leading-relaxed">${
          paragraph
            .split('\n')
            .map(line => line.trim())
            .filter(line => line)
            .join(' ')
        }</p>`;
      })
      .filter(p => p)                   // Remove empty paragraphs
      .join('\n');

    return `
      <div class="newsletter-content">
        ${formattedContent}
      </div>
    `;
  } catch (error) {
    console.error("Error extracting newsletter content:", error);
    return '<div class="text-red-500">Error formatting newsletter content</div>';
  }
};

// Helper function to parse email content in reader mode
const parseReaderView = (rawContent: string): string => {
  try {
    // Use monospace formatting for the reader view, no images
    const content = extractNewsletterContent(rawContent, false);
    return `<div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; line-height: 1.6;">${content}</div>`;
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
      
      // Find the last part that contains HTML content (usually the richest format)
      let htmlPart = '';
      for (let i = parts.length - 1; i >= 0; i--) {
        const part = parts[i];
        if (part.includes('Content-Type: text/html') || 
            part.includes('Content-Type: multipart/alternative')) {
          htmlPart = part;
          break;
        }
      }
      
      if (htmlPart) {
        // Extract just the HTML content, removing headers
        const contentStart = htmlPart.indexOf('\r\n\r\n');
        if (contentStart !== -1) {
          htmlPart = htmlPart.substring(contentStart + 4);
        }
        return extractNewsletterContent(htmlPart, true);
      }
    }
    
    // If no multipart boundary found, just use the original parsing
    return extractNewsletterContent(rawContent, true);
  } catch (error) {
    console.error("Error parsing email content:", error);
    return '<div class="text-red-500">Error parsing email content</div>';
  }
};

export const Article: React.FC<ArticleProps> = ({ issue }) => {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('original');
  const [rawContent, setRawContent] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        const response = await axios.get<EmailContentResponse>(
          `http://localhost:3001/api/inboxes/${issue.issueId}/content`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );
        
        setRawContent(response.data.content);
        // Parse based on current view mode
        const parsedContent = viewMode === 'reader' 
          ? parseReaderView(response.data.content)
          : parseOriginalView(response.data.content);
        setContent(parsedContent);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof AxiosError 
          ? err.response?.data?.message || 'Failed to load email content'
          : 'Failed to load email content';
        setError(errorMessage);
        console.error('Error loading email content:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [issue.issueId, viewMode]);

  const toggleViewMode = () => {
    const newMode = viewMode === 'reader' ? 'original' : 'reader';
    setViewMode(newMode);
    if (rawContent) {
      const parsedContent = newMode === 'reader' 
        ? parseReaderView(rawContent)
        : parseOriginalView(rawContent);
      setContent(parsedContent);
    }
  };

  return (
    <article className="article p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">{issue.subject}</h1>
        <button
          onClick={toggleViewMode}
          className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-sm font-medium"
        >
          {viewMode === 'reader' ? 'Original View' : 'Reader View'}
        </button>
      </div>
      <ArticleMeta 
        newsletter={issue.sender}
        author=""
        date={new Date(issue.receivedAt).toLocaleString()}
      />
      <div className="content mt-8">
        {loading ? (
          <div className="text-gray-500">Loading email content...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : content ? (
          <div 
            className={`prose prose-lg max-w-none ${viewMode === 'reader' ? 'reader-view' : 'original-view'}`}
            dangerouslySetInnerHTML={{ __html: content }} 
          />
        ) : (
          <div className="text-gray-500">No content available</div>
        )}
      </div>
    </article>
  );
};