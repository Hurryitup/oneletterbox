import React, { useState } from 'react';
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
  const activeNewsletter = newsletters.find(n => n.id === activeNewsletterId)!;

  return (
    <div className="app">
      <Sidebar 
        newsletters={newsletters}
        activeNewsletterId={activeNewsletterId}
        onNewsletterSelect={setActiveNewsletterId}
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