import React from 'react';
import { Sidebar } from './Sidebar/Sidebar';
import { Article } from './Article/Article';

export const Layout = () => {
  const sampleContent = [
    `The impact of AI on software development has been profound, yet we're only at the beginning of understanding its full potential. Today's analysis explores how AI is reshaping not just how we write code, but how we think about software development as a discipline.`,
    `Large Language Models (LLMs) have demonstrated remarkable capabilities in code generation, but their true value lies in augmenting rather than replacing human developers. The key insights from recent developments suggest three major trends that will shape the future of software development:`,
    `First, we're seeing a shift from code completion to code collaboration. Modern AI assistants don't just suggest the next line of code; they engage in a dialogue about architecture, patterns, and trade-offs. This fundamentally changes how developers approach problem-solving, enabling them to operate at a higher level of abstraction while maintaining precise control over implementation details.`,
  ];

  return (
    <div className="app">
      <Sidebar />
      <main className="main-content">
        <Article 
          title="AI and the Future of Software Development"
          newsletter="Stratechery"
          author="Ben Thompson"
          date="December 9, 2024"
          content={sampleContent}
        />
      </main>
    </div>
  );
};