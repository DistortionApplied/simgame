"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MockInternet, Website } from '../lib/internet';

interface GraphicalBrowserProps {
  initialUrl: string;
  onClose: () => void;
  mockInternet: MockInternet;
}

interface BrowserTab {
  url: string;
  title: string;
}

export default function GraphicalBrowser({ initialUrl, onClose, mockInternet }: GraphicalBrowserProps) {
  const [currentUrl, setCurrentUrl] = useState(initialUrl);
  const [urlInput, setUrlInput] = useState(initialUrl);
  const [currentWebsite, setCurrentWebsite] = useState<Website | null>(null);
  const [history, setHistory] = useState<string[]>([initialUrl]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [tabs, setTabs] = useState<BrowserTab[]>([{ url: initialUrl, title: 'New Tab' }]);
  const [activeTab, setActiveTab] = useState(0);
  const [windowPosition, setWindowPosition] = useState({ x: 100, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const dragOffsetRef = useRef(dragOffset);

  // Determine if the current website should be rendered in light mode
  const isLightTheme = currentWebsite?.domain === 'google.com' || currentWebsite?.domain === 'wikipedia.org';

  const loadWebsite = useCallback((url: string) => {
    // Remove http:// if present
    const domain = url.replace(/^https?:\/\//, '');

    // Try to resolve domain
    const ip = mockInternet.resolveDomain(domain);
    if (!ip) {
      setCurrentWebsite({
        domain,
        ip: '',
        content: `<html><body><h1>Error</h1><p>Unable to resolve host '${domain}'</p></body></html>`,
        type: 'static',
        title: 'Error'
      });
      return;
    }

    const website = mockInternet.getWebsiteByDomain(domain);
    if (!website) {
      setCurrentWebsite({
        domain,
        ip,
        content: `<html><body><h1>404 Not Found</h1><p>Page not found for '${domain}'</p></body></html>`,
        type: 'static',
        title: '404 Not Found'
      });
      return;
    }

    setCurrentWebsite(website);
    setUrlInput(url);
  }, [mockInternet]);

  // Load website content when URL changes
  useEffect(() => {
    dragOffsetRef.current = dragOffset;
  }, [dragOffset]);

  useEffect(() => {
    loadWebsite(currentUrl); // eslint-disable-line react-hooks/set-state-in-effect
  }, [currentUrl, loadWebsite]);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigateTo(urlInput);
  };

  const navigateTo = (url: string) => {
    setCurrentUrl(url);
    // Add to history if different from current
    if (history[historyIndex] !== url) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(url);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
    // Update active tab
    const newTabs = [...tabs];
    newTabs[activeTab] = { ...newTabs[activeTab], url, title: currentWebsite?.title || url };
    setTabs(newTabs);
  };

  const goBack = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setCurrentUrl(history[historyIndex - 1]);
    }
  };

  const goForward = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setCurrentUrl(history[historyIndex + 1]);
    }
  };

  const refresh = () => {
    loadWebsite(currentUrl);
  };

  const addTab = () => {
    const newTab = { url: 'about:blank', title: 'New Tab' };
    setTabs([...tabs, newTab]);
    setActiveTab(tabs.length);
  };

  const closeTab = (index: number) => {
    if (tabs.length > 1) {
      const newTabs = tabs.filter((_, i) => i !== index);
      setTabs(newTabs);
      if (activeTab >= index && activeTab > 0) {
        setActiveTab(activeTab - 1);
      } else if (activeTab === index) {
        setActiveTab(Math.min(activeTab, newTabs.length - 1));
      }
    }
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - windowPosition.x,
      y: e.clientY - windowPosition.y,
    });
  }, [windowPosition]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      setWindowPosition({
        x: e.clientX - dragOffsetRef.current.x,
        y: e.clientY - dragOffsetRef.current.y,
      });
    }
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Helper functions for creating React elements
  const createH1Element = (content: string, key: number, isLightTheme: boolean): React.ReactElement => (
    <h1
      key={key}
      style={{
        color: isLightTheme ? '#202124' : 'white',
        fontSize: '2.25rem',
        fontWeight: 'normal',
        margin: '0 0 1rem 0',
        textAlign: 'center'
      }}
    >
      {content}
    </h1>
  );

  const createInputElement = (placeholder: string, key: number, isLightTheme: boolean): React.ReactElement => (
    <input
      key={key}
      type="text"
      placeholder={placeholder}
      style={{
        width: '100%',
        padding: '0.75rem 1rem',
        border: `1px solid ${isLightTheme ? '#dadce0' : '#4b5563'}`,
        borderRadius: '1.5rem',
        fontSize: '1rem',
        outline: 'none',
        backgroundColor: isLightTheme ? 'white' : '#1f2937',
        color: isLightTheme ? '#202124' : 'white',
        margin: '0 auto 1.5rem',
        display: 'block',
        boxSizing: 'border-box'
      }}
      className="focus:ring-2 focus:ring-blue-500"
    />
  );

  const createButtonElement = (content: string, key: number, isLightTheme: boolean): React.ReactElement => (
    <button
      key={key}
      style={{
        backgroundColor: isLightTheme ? '#f8f9fa' : '#374151',
        color: isLightTheme ? '#3c4043' : 'white',
        border: `1px solid ${isLightTheme ? '#f8f9fa' : '#4b5563'}`,
        borderRadius: '0.25rem',
        padding: '0.75rem 1.5rem',
        fontSize: '0.875rem',
        cursor: 'pointer',
        margin: '0 0.5rem'
      }}
      className="hover:opacity-80"
    >
      {content}
    </button>
  );

  const createDivElement = (content: string, key: number, isFooter: boolean, isLightTheme: boolean): React.ReactElement => (
    <div
      key={key}
      style={{
        textAlign: isFooter ? 'center' : 'left',
        padding: isFooter ? '1rem' : '0',
        margin: '0.5rem 0',
        color: isLightTheme ? '#70757a' : '#d1d5db',
        fontSize: '0.875rem',
        position: isFooter ? 'fixed' : 'static',
        bottom: isFooter ? '0' : 'auto',
        left: isFooter ? '0' : 'auto',
        right: isFooter ? '0' : 'auto',
        backgroundColor: isFooter ? (isLightTheme ? '#f2f2f2' : '#1f2937') : 'transparent',
        borderTop: isFooter ? `1px solid ${isLightTheme ? '#e4e4e4' : '#374151'}` : 'none'
      }}
    >
      {content}
    </div>
  );

  const createPElement = (content: string, key: number, isLightTheme: boolean): React.ReactElement => (
    <p
      key={key}
      style={{
        color: isLightTheme ? '#70757a' : '#d1d5db',
        fontSize: '0.875rem',
        margin: '0.5rem 0',
        textAlign: 'center'
      }}
    >
      {content}
    </p>
  );

  const createAElement = (content: string, key: number, isLightTheme: boolean): React.ReactElement => (
    <a
      key={key}
      href="#"
      style={{
        color: isLightTheme ? '#1a0dab' : '#60a5fa',
        textDecoration: 'none',
        margin: '0 0.25rem'
      }}
      onClick={(e) => e.preventDefault()}
    >
      {content}
    </a>
  );

  const createTextElement = (content: string, key: number, isLightTheme: boolean): React.ReactElement => (
    <div
      key={key}
      style={{
        color: isLightTheme ? '#202124' : '#d1d5db',
        margin: '0.25rem 0'
      }}
    >
      {content}
    </div>
  );

  // Improved HTML parser for basic website rendering
  const parseHTML = (html: string, isLightTheme: boolean = false): React.ReactElement[] => {
    const elements: React.ReactElement[] = [];
    let key = 0;

    try {
      // Clean up the HTML - remove extra whitespace
      const cleanHtml = html.replace(/\s+/g, ' ').trim();

      // Process the HTML using regex to find complete tags
      const tagRegex = /<(\w+)([^>]*)>(.*?)<\/\1>/g;
      let match;
      let lastIndex = 0;

      while ((match = tagRegex.exec(cleanHtml)) !== null) {
        // Add any text before this tag
        if (match.index > lastIndex) {
          const textBefore = cleanHtml.slice(lastIndex, match.index).trim();
          if (textBefore) {
            elements.push(createTextElement(textBefore, key++, isLightTheme));
          }
        }

        const tagName = match[1];
        const attrs = match[2];
        const content = match[3].trim();

        // Create appropriate element based on tag
        switch (tagName) {
          case 'h1':
            if (content) {
              elements.push(createH1Element(content, key++, isLightTheme));
            }
            break;
          case 'input':
            const placeholder = attrs.match(/placeholder="([^"]*)"/)?.[1] || '';
            elements.push(createInputElement(placeholder, key++, isLightTheme));
            break;
          case 'button':
            if (content) {
              elements.push(createButtonElement(content, key++, isLightTheme));
            }
            break;
          case 'div':
            if (content) {
              const isFooter = attrs.includes('position: fixed') || attrs.includes('footer');
              elements.push(createDivElement(content, key++, isFooter, isLightTheme));
            }
            break;
          case 'p':
            if (content) {
              elements.push(createPElement(content, key++, isLightTheme));
            }
            break;
        }

        lastIndex = tagRegex.lastIndex;
      }

      // Handle any remaining text
      if (lastIndex < cleanHtml.length) {
        const remainingText = cleanHtml.slice(lastIndex).trim();
        if (remainingText) {
          elements.push(createTextElement(remainingText, key++, isLightTheme));
        }
      }

      // Handle self-closing tags (like input if not caught above)
      const selfClosingRegex = /<(\w+)([^>]*)\/?>/g;
      const remainingHtml = cleanHtml.replace(tagRegex, '');
      let selfMatch;

      while ((selfMatch = selfClosingRegex.exec(remainingHtml)) !== null) {
        const tagName = selfMatch[1];
        const attrs = selfMatch[2];

        if (tagName === 'input') {
          const placeholder = attrs.match(/placeholder="([^"]*)"/)?.[1] || '';
          elements.push(createInputElement(placeholder, key++, isLightTheme));
        }
      }

    } catch (error) {
      console.error('Error parsing HTML:', error);
      // Return a simple fallback
      return [
        createH1Element('Google', key++, isLightTheme),
        createInputElement('Search Google or type a URL', key++, isLightTheme),
        createButtonElement('Google Search', key++, isLightTheme),
        createButtonElement('I\'m Feeling Lucky', key++, isLightTheme)
      ];
    }

    return elements.length > 0 ? elements : [<div key="fallback">Content not available</div>];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50">
      <div
        className="bg-gray-900 w-full max-w-6xl h-5/6 rounded-lg shadow-2xl flex flex-col absolute border border-gray-700"
        style={{
          left: `${windowPosition.x}px`,
          top: `${windowPosition.y}px`,
          transform: isDragging ? 'rotate(1deg)' : 'none',
          transition: isDragging ? 'none' : 'transform 0.1s',
        }}
      >
        {/* Title bar */}
        <div
          className="bg-gray-800 text-white px-4 py-2 rounded-t-lg flex justify-between items-center cursor-move"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="ml-4 font-semibold">SimWeb Browser</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="text-white hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-gray-800 px-2 py-1 flex items-center border-b border-gray-700">
          {tabs.map((tab, index) => (
            <div
              key={index}
              className={`px-3 py-1 mr-1 rounded-t cursor-pointer flex items-center text-white ${
                activeTab === index ? 'bg-gray-900 border-t border-l border-r border-gray-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
              onClick={() => setActiveTab(index)}
            >
              <span className="text-sm mr-2">{tab.title}</span>
              {tabs.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(index);
                  }}
                  className="text-gray-400 hover:text-white ml-2"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button onClick={addTab} className="px-2 py-1 text-gray-400 hover:text-white">+</button>
        </div>

        {/* Navigation bar */}
        <div className="bg-gray-800 px-4 py-2 flex items-center space-x-2 border-b border-gray-700">
          <button
            onClick={goBack}
            disabled={historyIndex <= 0}
            className="px-2 py-1 bg-gray-600 text-white rounded disabled:opacity-50 hover:bg-gray-500"
          >
            ←
          </button>
          <button
            onClick={goForward}
            disabled={historyIndex >= history.length - 1}
            className="px-2 py-1 bg-gray-600 text-white rounded disabled:opacity-50 hover:bg-gray-500"
          >
            →
          </button>
          <button onClick={refresh} className="px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-500">
            ↻
          </button>
          <form onSubmit={handleUrlSubmit} className="flex-1 flex">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="flex-1 px-3 py-1 bg-gray-700 text-white border border-gray-600 rounded-l focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Enter URL..."
            />
            <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded-r hover:bg-blue-700">
              Go
            </button>
          </form>
        </div>

        {/* Content area */}
        <div className={`flex-1 overflow-auto p-4 ${isLightTheme ? 'bg-white text-black' : 'bg-gray-900 text-white'}`}>
          {currentWebsite ? (
            <div className="max-w-4xl mx-auto">
              {parseHTML(currentWebsite.content, isLightTheme)}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              Loading...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}