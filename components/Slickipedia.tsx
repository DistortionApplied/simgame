import React, { useState, useEffect } from 'react';

interface SlickipediaProps {
  setupData: any;
  mockInternet: any;
  initialUrl?: string;
}

interface Article {
  title: string;
  content: string;
  links: string[];
  lastModified: string;
  views: number;
}

const mockArticles: Record<string, Article> = {
  'Main_Page': {
    title: 'Main Page',
    content: `
      <div class="mw-parser-output">
        <div class="main-page-welcome">
          <h1>Welcome to <span class="nowrap">Slickipedia</span></h1>
          <p class="main-page-tagline">the free encyclopedia that <a href="?title=Anyone">anyone</a> can edit.</p>
        </div>

        <div class="main-page-content">
          <div class="main-page-left">
            <h2>From today's featured article</h2>
            <div class="featured-article">
              <h3><a href="?title=Hacking">Hacking</a></h3>
              <p>Hacking is the practice of modifying the features of a system, in order to accomplish a goal outside of the creator's original purpose. The term is often associated with computer security, but it can also refer to more general creative problem-solving.</p>
            </div>
          </div>

          <div class="main-page-right">
            <h2>Did you know...</h2>
            <ul>
              <li>...that the first computer hacker was <a href="?title=Alan_Turing">Alan Turing</a>?</li>
              <li>...that <a href="?title=Linux">Linux</a> is a free and open-source operating system?</li>
              <li>...that <a href="?title=Cryptography">cryptography</a> is essential for computer security?</li>
            </ul>
          </div>
        </div>
      </div>
    `,
    links: ['Hacking', 'Alan_Turing', 'Linux', 'Cryptography'],
    lastModified: '2026-04-10T12:00:00Z',
    views: 1250000
  },

  'Hacking': {
    title: 'Hacking',
    content: `
      <div class="mw-parser-output">
        <p><b>Hacking</b> is the practice of modifying the features of a system, in order to accomplish a goal outside of the creator's original purpose. The term is often associated with <a href="?title=Computer_security">computer security</a>, but it can also refer to more general creative problem-solving.</p>

        <h2>History</h2>
        <p>The term "hacking" originated in the 1950s at the <a href="?title=Massachusetts_Institute_of_Technology">Massachusetts Institute of Technology</a> (MIT), where it referred to clever or elegant solutions to technical problems. The original hackers were computer programmers who experimented with systems to learn how they worked.</p>

        <h2>Types of hacking</h2>
        <ul>
          <li><b>White hat hacking</b>: Ethical hacking performed with permission</li>
          <li><b>Black hat hacking</b>: Malicious hacking without authorization</li>
          <li><b>Grey hat hacking</b>: Hacking that may be illegal but not malicious</li>
        </ul>

        <h2>Computer security</h2>
        <p>In the context of computer security, hacking refers to unauthorized access to computer systems. This can involve exploiting vulnerabilities in software, social engineering, or other techniques.</p>

        <h2>See also</h2>
        <ul>
          <li><a href="?title=Computer_security">Computer security</a></li>
          <li><a href="?title=Social_engineering">Social engineering</a></li>
          <li><a href="?title=Cryptography">Cryptography</a></li>
        </ul>
      </div>
    `,
    links: ['Computer_security', 'Massachusetts_Institute_of_Technology', 'Social_engineering', 'Cryptography'],
    lastModified: '2026-04-09T15:30:00Z',
    views: 890000
  },

  'Computer_security': {
    title: 'Computer security',
    content: `
      <div class="mw-parser-output">
        <p><b>Computer security</b>, also known as cybersecurity or IT security, is the protection of computer systems and networks from information disclosure, theft of or damage to their hardware, software, or electronic data, as well as from the disruption or misdirection of the services they provide.</p>

        <h2>Core concepts</h2>
        <ul>
          <li><b>Confidentiality</b>: Ensuring information is accessible only to authorized parties</li>
          <li><b>Integrity</b>: Protecting information from unauthorized modification</li>
          <li><b>Availability</b>: Ensuring systems remain accessible when needed</li>
        </ul>

        <h2>Common threats</h2>
        <ul>
          <li><a href="?title=Malware">Malware</a> infections</li>
          <li><a href="?title=Phishing">Phishing</a> attacks</li>
          <li><a href="?title=Denial-of-service_attack">Denial-of-service attacks</a></li>
          <li>Unauthorized access attempts</li>
        </ul>

        <h2>Defense strategies</h2>
        <p>Computer security involves implementing various defensive measures including firewalls, antivirus software, encryption, and regular security audits.</p>
      </div>
    `,
    links: ['Malware', 'Phishing', 'Denial-of-service_attack'],
    lastModified: '2026-04-08T10:15:00Z',
    views: 650000
  },

  'Linux': {
    title: 'Linux',
    content: `
      <div class="mw-parser-output">
        <p><b>Linux</b> is a family of open-source Unix-like operating systems based on the Linux kernel, an operating system kernel first released on September 17, 1991, by <a href="?title=Linus_Torvalds">Linus Torvalds</a>.</p>

        <h2>History</h2>
        <p>Linux was originally developed as a free operating system for Intel x86-based personal computers. It has since been ported to more computer hardware platforms than any other operating system.</p>

        <h2>Features</h2>
        <ul>
          <li>Open source and free</li>
          <li>Highly customizable</li>
          <li>Strong security features</li>
          <li>Package management systems</li>
          <li>Command-line interface</li>
        </ul>

        <h2>Distributions</h2>
        <p>Linux distributions (distros) are variants of Linux that package the kernel with supporting software and libraries. Popular distributions include Ubuntu, Fedora, Debian, and Arch Linux.</p>
      </div>
    `,
    links: ['Linus_Torvalds'],
    lastModified: '2026-04-07T14:20:00Z',
    views: 1200000
  },

  'Cryptography': {
    title: 'Cryptography',
    content: `
      <div class="mw-parser-output">
        <p><b>Cryptography</b> or cryptology is the practice and study of techniques for secure communication in the presence of third parties called adversaries. More generally, cryptography is about constructing and analyzing protocols that prevent third parties or the public from reading private messages.</p>

        <h2>History</h2>
        <p>The first known use of cryptography was in ancient Egypt around 1900 BC. Modern cryptography emerged in the 1970s with the development of public-key cryptography.</p>

        <h2>Types</h2>
        <ul>
          <li><b>Symmetric cryptography</b>: Uses the same key for encryption and decryption</li>
          <li><b>Asymmetric cryptography</b>: Uses different keys for encryption and decryption</li>
          <li><b>Hash functions</b>: One-way functions that convert input to fixed-size output</li>
        </ul>

        <h2>Applications</h2>
        <ul>
          <li>Secure communication</li>
          <li>Digital signatures</li>
          <li>Password storage</li>
          <li>Blockchain technology</li>
        </ul>
      </div>
    `,
    links: [],
    lastModified: '2026-04-06T09:45:00Z',
    views: 780000
  }
};

const generateArticle = (title: string): Article => {
  const topics = [
    'Computer Science', 'Programming', 'Security', 'Networking', 'Operating Systems',
    'Artificial Intelligence', 'Machine Learning', 'Data Structures', 'Algorithms', 'Databases'
  ];

  const randomTopic = topics[Math.floor(Math.random() * topics.length)];

  return {
    title: title.replace(/_/g, ' '),
    content: `
      <div class="mw-parser-output">
        <p><b>${title.replace(/_/g, ' ')}</b> is a concept in ${randomTopic.toLowerCase()}. This article provides an overview of the topic.</p>

        <h2>Overview</h2>
        <p>${title.replace(/_/g, ' ')} refers to various techniques and methodologies used in ${randomTopic.toLowerCase()}. It encompasses both theoretical foundations and practical applications.</p>

        <h2>Applications</h2>
        <p>The applications of ${title.replace(/_/g, ' ')} are diverse and include:</p>
        <ul>
          <li>Academic research</li>
          <li>Industrial applications</li>
          <li>Educational purposes</li>
          <li>Professional development</li>
        </ul>

        <h2>See also</h2>
        <ul>
          <li><a href="?title=Computer_Science">Computer Science</a></li>
          <li><a href="?title=Programming">Programming</a></li>
          <li><a href="?title=${randomTopic.replace(/\s+/g, '_')}">${randomTopic}</a></li>
        </ul>
      </div>
    `,
    links: ['Computer_Science', 'Programming', randomTopic.replace(/\s+/g, '_')],
    lastModified: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    views: Math.floor(Math.random() * 500000) + 10000
  };
};

export default function Slickipedia({ setupData, mockInternet, initialUrl = 'https://slickipedia.org/wiki/Main_Page' }: SlickipediaProps) {
  // Initialize current article from URL
  const getInitialArticle = () => {
    try {
      const url = new URL(initialUrl);
      return url.searchParams.get('title') || 'Main_Page';
    } catch {
      return 'Main_Page';
    }
  };

  const [currentArticle, setCurrentArticle] = useState<string>(getInitialArticle);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const getArticle = (title: string): Article => {
    return mockArticles[title] || generateArticle(title);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setCurrentArticle(searchQuery.trim().replace(/\s+/g, '_'));
      setSearchQuery('');
    }
  };

  const handleLinkClick = (title: string) => {
    setIsLoading(true);
    setTimeout(() => {
      setCurrentArticle(title);
      setIsLoading(false);
    }, 300);
  };

  const article = getArticle(currentArticle);

  const handleContentClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'A') {
      e.preventDefault();
      const href = target.getAttribute('href');
      if (href && href.startsWith('?title=')) {
        const title = href.split('=')[1];
        handleLinkClick(title);
      }
    }
  };

  return (
    <div style={{ fontFamily: 'sans-serif', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #a2a9b1', padding: '0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 15px' }}>
          {/* Top bar */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '5px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginRight: '20px' }}>
              <div style={{ width: '50px', height: '50px', backgroundColor: '#3366cc', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '24px', fontWeight: 'bold' }}>
                W
              </div>
              <div style={{ marginLeft: '10px' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#000' }}>Slickipedia</div>
                <div style={{ fontSize: '12px', color: '#666' }}>The Free Encyclopedia</div>
              </div>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: '400px', marginRight: '20px' }}>
              <div style={{ display: 'flex' }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Slickipedia"
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #a2a9b1',
                    borderRight: 'none',
                    borderRadius: '2px 0 0 2px',
                    fontSize: '14px'
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#3366cc',
                    color: 'white',
                    border: '1px solid #3366cc',
                    borderRadius: '0 2px 2px 0',
                    cursor: 'pointer'
                  }}
                >
                  Search
                </button>
              </div>
            </form>

            {/* Navigation links */}
            <div style={{ display: 'flex', gap: '15px' }}>
              <a href="#" onClick={() => handleLinkClick('Main_Page')} style={{ color: '#3366cc', textDecoration: 'none' }}>Main page</a>
              <a href="#" style={{ color: '#3366cc', textDecoration: 'none' }}>Random article</a>
              <a href="#" style={{ color: '#3366cc', textDecoration: 'none' }}>About Slickipedia</a>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 15px' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <div>Loading...</div>
          </div>
        ) : (
          <>
            {/* Article header */}
            <div style={{ marginBottom: '20px' }}>
              <h1 style={{ margin: '0 0 10px 0', fontSize: '28px', color: '#000' }}>{article.title}</h1>
              <div style={{ fontSize: '12px', color: '#666' }}>
                From Slickipedia, the free encyclopedia
                {article.lastModified && (
                  <> | This page was last edited on {new Date(article.lastModified).toLocaleDateString()}</>
                )}
                {article.views && (
                  <> | Page views in the past 30 days: {article.views.toLocaleString()}</>
                )}
              </div>
            </div>

            {/* Article content */}
            <div
              style={{ lineHeight: '1.6', fontSize: '14px' }}
              dangerouslySetInnerHTML={{ __html: article.content }}
              onClick={handleContentClick}
            />
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{ backgroundColor: '#f8f9fa', borderTop: '1px solid #a2a9b1', marginTop: '40px', padding: '20px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 15px', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#666' }}>
            This page is a simulated Slickipedia article. Content is generated for demonstration purposes.
          </div>
        </div>
      </div>
    </div>
  );
}