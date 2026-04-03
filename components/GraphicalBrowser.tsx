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
    loadWebsite(currentUrl);
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

  // CSS parsing and application
  const parseCSS = (cssText: string): Record<string, Record<string, string>> => {
    const rules: Record<string, Record<string, string>> = {};

    try {
      // Simple CSS parser - handles basic selectors and properties
      const ruleRegex = /([^{]+)\s*\{\s*([^}]+)\s*\}/g;
      let match;

      while ((match = ruleRegex.exec(cssText)) !== null) {
        const selector = match[1].trim();
        const properties = match[2];

        // Parse properties
        const props: Record<string, string> = {};
        const propRegex = /([^:]+):\s*([^;]+);?/g;
        let propMatch;

        while ((propMatch = propRegex.exec(properties)) !== null) {
          const propName = propMatch[1].trim();
          const propValue = propMatch[2].trim();
          // Convert CSS property names to camelCase for React
          const camelProp = propName.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
          props[camelProp] = propValue;
        }

        rules[selector] = props;
      }
    } catch (error) {
      console.error('Error parsing CSS:', error);
    }

    return rules;
  };

  const extractStylesFromHTML = (html: string): { html: string; styles: Record<string, Record<string, string>> } => {
    const styles: Record<string, Record<string, string>> = {};

    // Extract <style> tags
    const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    let cleanedHtml = html.replace(styleRegex, (match, cssContent) => {
      const parsedStyles = parseCSS(cssContent);
      Object.assign(styles, parsedStyles);
      return ''; // Remove style tag from HTML
    });

    // Extract body content if it's a full HTML document
    const bodyRegex = /<body[^>]*>([\s\S]*?)<\/body>/i;
    const bodyMatch = cleanedHtml.match(bodyRegex);
    if (bodyMatch) {
      cleanedHtml = bodyMatch[1];
    }

    return { html: cleanedHtml, styles };
  };

  const applyCSSStyles = (
    elementStyles: Record<string, string>,
    attrs: Record<string, string>,
    cssRules: Record<string, Record<string, string>>,
    tagName: string
  ): Record<string, string> => {
    const combinedStyles = { ...elementStyles };

    // Apply CSS rules based on selectors
    Object.entries(cssRules).forEach(([selector, properties]) => {
      let matches = false;

      // Simple selector matching
      if (selector === tagName) {
        matches = true;
      } else if (selector.startsWith('.') && attrs.class?.split(' ').includes(selector.slice(1))) {
        matches = true;
      } else if (selector.startsWith('#') && attrs.id === selector.slice(1)) {
        matches = true;
      } else if (selector.startsWith(`${tagName}.`) && attrs.class?.split(' ').includes(selector.slice(tagName.length + 1))) {
        matches = true;
      } else if (selector.startsWith(`${tagName}#`) && attrs.id === selector.slice(tagName.length + 1)) {
        matches = true;
      }

      if (matches) {
        Object.assign(combinedStyles, properties);
      }
    });

    return combinedStyles;
  };

  // Helper functions for creating React elements
  const createH1Element = (content: React.ReactNode, key: number, attrs: Record<string, string>, cssRules: Record<string, Record<string, string>>, isLightTheme: boolean): React.ReactElement => {
    const baseStyles = {
      color: isLightTheme ? '#202124' : 'white',
      fontSize: '2.25rem',
      fontWeight: 'normal',
      margin: '0 0 1rem 0',
      textAlign: 'center' as const
    };
    const appliedStyles = applyCSSStyles(baseStyles, attrs, cssRules, 'h1');

    return (
      <h1
        key={key}
        style={appliedStyles}
      >
        {content}
      </h1>
    );
  };

  const createH2Element = (content: React.ReactNode, key: number, attrs: Record<string, string>, cssRules: Record<string, Record<string, string>>, isLightTheme: boolean): React.ReactElement => {
    const baseStyles = {
      color: isLightTheme ? '#202124' : 'white',
      fontSize: '1.875rem',
      fontWeight: 'normal',
      margin: '0 0 0.75rem 0'
    };
    const appliedStyles = applyCSSStyles(baseStyles, attrs, cssRules, 'h2');

    return (
      <h2
        key={key}
        style={appliedStyles}
      >
        {content}
      </h2>
    );
  };

  const createH3Element = (content: React.ReactNode, key: number, attrs: Record<string, string>, cssRules: Record<string, Record<string, string>>, isLightTheme: boolean): React.ReactElement => {
    const baseStyles = {
      color: isLightTheme ? '#202124' : 'white',
      fontSize: '1.5rem',
      fontWeight: 'normal',
      margin: '0 0 0.5rem 0'
    };
    const appliedStyles = applyCSSStyles(baseStyles, attrs, cssRules, 'h3');

    return (
      <h3
        key={key}
        style={appliedStyles}
      >
        {content}
      </h3>
    );
  };

  const createInputElement = (key: number, attrs: Record<string, string>, cssRules: Record<string, Record<string, string>>, isLightTheme: boolean): React.ReactElement => {
    const baseStyles = {
      width: '100%',
      padding: '0.75rem 1rem',
      border: `1px solid ${isLightTheme ? '#dadce0' : '#4b5563'}`,
      borderRadius: '0.25rem',
      fontSize: '1rem',
      outline: 'none',
      backgroundColor: isLightTheme ? 'white' : '#1f2937',
      color: isLightTheme ? '#202124' : 'white',
      margin: '0.5rem 0',
      boxSizing: 'border-box' as const
    };
    const appliedStyles = applyCSSStyles(baseStyles, attrs, cssRules, 'input');

    return (
      <input
        key={key}
        type={attrs.type || 'text'}
        placeholder={attrs.placeholder || ''}
        value={attrs.value || ''}
        style={appliedStyles}
        className="focus:ring-2 focus:ring-blue-500"
        readOnly
      />
    );
  };

  const createButtonElement = (content: React.ReactNode, key: number, attrs: Record<string, string>, cssRules: Record<string, Record<string, string>>, isLightTheme: boolean): React.ReactElement => {
    const baseStyles = {
      backgroundColor: isLightTheme ? '#f8f9fa' : '#374151',
      color: isLightTheme ? '#3c4043' : 'white',
      border: `1px solid ${isLightTheme ? '#f8f9fa' : '#4b5563'}`,
      borderRadius: '0.25rem',
      padding: '0.75rem 1.5rem',
      fontSize: '0.875rem',
      cursor: 'pointer',
      margin: '0 0.5rem'
    };
    const appliedStyles = applyCSSStyles(baseStyles, attrs, cssRules, 'button');

    return (
      <button
        key={key}
        style={appliedStyles}
        className="hover:opacity-80"
      >
        {content}
      </button>
    );
  };

  const createDivElement = (content: React.ReactNode, key: number, attrs: Record<string, string>, cssRules: Record<string, Record<string, string>>, isLightTheme: boolean): React.ReactElement => {
    const baseStyles = {
      textAlign: 'left' as const,
      padding: '0.5rem',
      margin: '0.25rem 0',
      color: isLightTheme ? '#202124' : '#d1d5db',
      fontSize: '0.875rem'
    };
    const appliedStyles = applyCSSStyles(baseStyles, attrs, cssRules, 'div');

    return (
      <div
        key={key}
        style={appliedStyles}
      >
        {content}
      </div>
    );
  };

  const createPElement = (content: React.ReactNode, key: number, attrs: Record<string, string>, cssRules: Record<string, Record<string, string>>, isLightTheme: boolean): React.ReactElement => {
    const baseStyles = {
      color: isLightTheme ? '#70757a' : '#d1d5db',
      fontSize: '0.875rem',
      margin: '0.5rem 0',
      textAlign: 'left' as const
    };
    const appliedStyles = applyCSSStyles(baseStyles, attrs, cssRules, 'p');

    return (
      <p
        key={key}
        style={appliedStyles}
      >
        {content}
      </p>
    );
  };

  const createAElement = (content: React.ReactNode, key: number, attrs: Record<string, string>, cssRules: Record<string, Record<string, string>>, isLightTheme: boolean): React.ReactElement => {
    const baseStyles = {
      color: isLightTheme ? '#1a0dab' : '#60a5fa',
      textDecoration: 'none',
      margin: '0 0.25rem'
    };
    const appliedStyles = applyCSSStyles(baseStyles, attrs, cssRules, 'a');

    return (
      <a
        key={key}
        href={attrs.href || '#'}
        title={attrs.href}
        style={appliedStyles}
        onClick={(e) => e.preventDefault()}
      >
        {content}
      </a>
    );
  };

  const createImgElement = (key: number, attrs: Record<string, string>, cssRules: Record<string, Record<string, string>>, isLightTheme: boolean): React.ReactElement => {
    const baseStyles = {
      display: 'inline-block',
      backgroundColor: '#e5e7eb',
      color: '#6b7280',
      padding: '1rem',
      borderRadius: '0.25rem',
      margin: '0.5rem 0',
      fontSize: '0.75rem',
      textAlign: 'center' as const
    };
    const appliedStyles = applyCSSStyles(baseStyles, attrs, cssRules, 'img');

    return (
      <div
        key={key}
        style={appliedStyles}
      >
        [Image: {attrs.alt || attrs.src || 'No alt text'}]
      </div>
    );
  };

  const createSpanElement = (content: React.ReactNode, key: number, attrs: Record<string, string>, cssRules: Record<string, Record<string, string>>, isLightTheme: boolean): React.ReactElement => {
    const baseStyles = {
      color: isLightTheme ? '#202124' : '#d1d5db'
    };
    const appliedStyles = applyCSSStyles(baseStyles, attrs, cssRules, 'span');

    return (
      <span
        key={key}
        style={appliedStyles}
      >
        {content}
      </span>
    );
  };

  const createStrongElement = (content: React.ReactNode, key: number, attrs: Record<string, string>, cssRules: Record<string, Record<string, string>>, isLightTheme: boolean): React.ReactElement => {
    const baseStyles = {
      fontWeight: 'bold',
      color: isLightTheme ? '#202124' : '#d1d5db'
    };
    const appliedStyles = applyCSSStyles(baseStyles, attrs, cssRules, 'strong');

    return (
      <strong
        key={key}
        style={appliedStyles}
      >
        {content}
      </strong>
    );
  };

  const createEmElement = (content: React.ReactNode, key: number, attrs: Record<string, string>, cssRules: Record<string, Record<string, string>>, isLightTheme: boolean): React.ReactElement => {
    const baseStyles = {
      fontStyle: 'italic',
      color: isLightTheme ? '#202124' : '#d1d5db'
    };
    const appliedStyles = applyCSSStyles(baseStyles, attrs, cssRules, 'em');

    return (
      <em
        key={key}
        style={appliedStyles}
      >
        {content}
      </em>
    );
  };

  const createBrElement = (key: number): React.ReactElement => (
    <br key={key} />
  );

  const createHrElement = (key: number): React.ReactElement => (
    <hr
      key={key}
      style={{
        border: 'none',
        borderTop: '1px solid #e5e7eb',
        margin: '1rem 0'
      }}
    />
  );

  const createUlElement = (content: React.ReactNode, key: number, attrs: Record<string, string>, cssRules: Record<string, Record<string, string>>, isLightTheme: boolean): React.ReactElement => {
    const baseStyles = {
      margin: '0.5rem 0',
      paddingLeft: '1.5rem',
      color: isLightTheme ? '#202124' : '#d1d5db'
    };
    const appliedStyles = applyCSSStyles(baseStyles, attrs, cssRules, 'ul');

    return (
      <ul
        key={key}
        style={appliedStyles}
      >
        {content}
      </ul>
    );
  };

  const createOlElement = (content: React.ReactNode, key: number, attrs: Record<string, string>, cssRules: Record<string, Record<string, string>>, isLightTheme: boolean): React.ReactElement => {
    const baseStyles = {
      margin: '0.5rem 0',
      paddingLeft: '1.5rem',
      color: isLightTheme ? '#202124' : '#d1d5db'
    };
    const appliedStyles = applyCSSStyles(baseStyles, attrs, cssRules, 'ol');

    return (
      <ol
        key={key}
        style={appliedStyles}
      >
        {content}
      </ol>
    );
  };

  const createLiElement = (content: React.ReactNode, key: number, attrs: Record<string, string>, cssRules: Record<string, Record<string, string>>, isLightTheme: boolean): React.ReactElement => {
    const baseStyles = {
      margin: '0.25rem 0',
      color: isLightTheme ? '#202124' : '#d1d5db'
    };
    const appliedStyles = applyCSSStyles(baseStyles, attrs, cssRules, 'li');

    return (
      <li
        key={key}
        style={appliedStyles}
      >
        {content}
      </li>
    );
  };

  const createTableElement = (content: React.ReactNode, key: number, attrs: Record<string, string>, cssRules: Record<string, Record<string, string>>, isLightTheme: boolean): React.ReactElement => {
    const baseStyles = {
      borderCollapse: 'collapse',
      width: '100%',
      margin: '0.5rem 0',
      backgroundColor: isLightTheme ? 'white' : '#1f2937',
      color: isLightTheme ? '#202124' : '#d1d5db'
    };
    const appliedStyles = applyCSSStyles(baseStyles, attrs, cssRules, 'table');

    return (
      <table
        key={key}
        style={appliedStyles}
      >
        {content}
      </table>
    );
  };

  const createTrElement = (content: React.ReactNode, key: number, attrs: Record<string, string>, cssRules: Record<string, Record<string, string>>, isLightTheme: boolean): React.ReactElement => {
    const appliedStyles = applyCSSStyles({}, attrs, cssRules, 'tr');

    return (
      <tr key={key} style={appliedStyles}>
        {content}
      </tr>
    );
  };

  const createTdElement = (content: React.ReactNode, key: number, attrs: Record<string, string>, cssRules: Record<string, Record<string, string>>, isLightTheme: boolean): React.ReactElement => {
    const baseStyles = {
      border: `1px solid ${isLightTheme ? '#e5e7eb' : '#374151'}`,
      padding: '0.5rem',
      textAlign: 'left' as const
    };
    const appliedStyles = applyCSSStyles(baseStyles, attrs, cssRules, 'td');

    return (
      <td
        key={key}
        style={appliedStyles}
      >
        {content}
      </td>
    );
  };

  const createThElement = (content: React.ReactNode, key: number, attrs: Record<string, string>, cssRules: Record<string, Record<string, string>>, isLightTheme: boolean): React.ReactElement => {
    const baseStyles = {
      border: `1px solid ${isLightTheme ? '#e5e7eb' : '#374151'}`,
      padding: '0.5rem',
      backgroundColor: isLightTheme ? '#f9fafb' : '#374151',
      fontWeight: 'bold',
      textAlign: 'left' as const
    };
    const appliedStyles = applyCSSStyles(baseStyles, attrs, cssRules, 'th');

    return (
      <th
        key={key}
        style={appliedStyles}
      >
        {content}
      </th>
    );
  };

  const createTextElement = (content: string, key: number, isLightTheme: boolean): React.ReactElement => (
    <span
      key={key}
      style={{
        color: isLightTheme ? '#202124' : '#d1d5db',
        margin: '0.125rem 0'
      }}
    >
      {content}
    </span>
  );

  // Parse HTML attributes from attribute string
  const parseAttributes = (attrString: string): Record<string, string> => {
    const attrs: Record<string, string> = {};
    const attrRegex = /(\w+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
    let match;

    while ((match = attrRegex.exec(attrString)) !== null) {
      const name = match[1];
      const value = match[2] || match[3] || match[4] || '';
      attrs[name] = value;
    }

    return attrs;
  };

  // Improved HTML parser for basic website rendering
  const parseHTML = (html: string, isLightTheme: boolean = false): React.ReactElement[] => {
    // Extract styles from HTML
    const { html: cleanHtml, styles: cssRules } = extractStylesFromHTML(html);
    const elements: React.ReactElement[] = [];
    let key = 0;

    try {
      // Simple recursive HTML parser
      const parseElement = (htmlChunk: string, cssRules: Record<string, Record<string, string>> = {}): React.ReactNode[] => {
        const result: React.ReactNode[] = [];
        let index = 0;

        while (index < htmlChunk.length) {
          // Find next tag
          const tagStart = htmlChunk.indexOf('<', index);
          if (tagStart === -1) {
            // No more tags, add remaining text
            const text = htmlChunk.slice(index).trim();
            if (text) {
              result.push(createTextElement(text, key++, isLightTheme));
            }
            break;
          }

          // Add text before tag
          if (tagStart > index) {
            const text = htmlChunk.slice(index, tagStart).trim();
            if (text) {
              result.push(createTextElement(text, key++, isLightTheme));
            }
          }

          // Find tag end
          const tagEnd = htmlChunk.indexOf('>', tagStart);
          if (tagEnd === -1) break;

          const tagContent = htmlChunk.slice(tagStart + 1, tagEnd);
          const isSelfClosing = tagContent.endsWith('/') || ['img', 'br', 'hr', 'input'].includes(tagContent.split(' ')[0]);

          if (tagContent.startsWith('/')) {
            // Closing tag - should not happen in our simple parser
            index = tagEnd + 1;
            continue;
          }

          const [tagName, ...attrParts] = tagContent.split(' ');
          const attrString = attrParts.join(' ').replace(/\/$/, '');
          const attrs = parseAttributes(attrString);

          if (isSelfClosing) {
            // Self-closing tag
            switch (tagName) {
              case 'input':
                result.push(createInputElement(key++, attrs, cssRules, isLightTheme));
                break;
              case 'img':
                result.push(createImgElement(key++, attrs, cssRules, isLightTheme));
                break;
              case 'br':
                result.push(createBrElement(key++));
                break;
              case 'hr':
                result.push(createHrElement(key++));
                break;
            }
          } else {
            // Find matching closing tag
            const closeTag = `</${tagName}>`;
            const closeIndex = htmlChunk.indexOf(closeTag, tagEnd);
            if (closeIndex === -1) {
              // No closing tag found, treat as text
              result.push(createTextElement(htmlChunk.slice(tagStart, tagEnd + 1), key++, isLightTheme));
            } else {
              // Parse content recursively
              const content = htmlChunk.slice(tagEnd + 1, closeIndex);
              const parsedContent = parseElement(content, cssRules);

              // Create element based on tag
              switch (tagName) {
                case 'h1':
                  if (parsedContent.length > 0) {
                    result.push(createH1Element(parsedContent, key++, attrs, cssRules, isLightTheme));
                  }
                  break;
                case 'h2':
                  if (parsedContent.length > 0) {
                    result.push(createH2Element(parsedContent, key++, attrs, cssRules, isLightTheme));
                  }
                  break;
                case 'h3':
                  if (parsedContent.length > 0) {
                    result.push(createH3Element(parsedContent, key++, attrs, cssRules, isLightTheme));
                  }
                  break;
                case 'div':
                  result.push(createDivElement(parsedContent, key++, attrs, cssRules, isLightTheme));
                  break;
                case 'p':
                  if (parsedContent.length > 0) {
                    result.push(createPElement(parsedContent, key++, attrs, cssRules, isLightTheme));
                  }
                  break;
                case 'a':
                  if (parsedContent.length > 0) {
                    result.push(createAElement(parsedContent, key++, attrs, cssRules, isLightTheme));
                  }
                  break;
                case 'button':
                  if (parsedContent.length > 0) {
                    result.push(createButtonElement(parsedContent, key++, attrs, cssRules, isLightTheme));
                  }
                  break;
                case 'span':
                  result.push(createSpanElement(parsedContent, key++, attrs, cssRules, isLightTheme));
                  break;
                case 'strong':
                case 'b':
                  result.push(createStrongElement(parsedContent, key++, attrs, cssRules, isLightTheme));
                  break;
                case 'em':
                case 'i':
                  result.push(createEmElement(parsedContent, key++, attrs, cssRules, isLightTheme));
                  break;
                case 'ul':
                  result.push(createUlElement(parsedContent, key++, attrs, cssRules, isLightTheme));
                  break;
                case 'ol':
                  result.push(createOlElement(parsedContent, key++, attrs, cssRules, isLightTheme));
                  break;
                case 'li':
                  result.push(createLiElement(parsedContent, key++, attrs, cssRules, isLightTheme));
                  break;
                case 'table':
                  result.push(createTableElement(parsedContent, key++, attrs, cssRules, isLightTheme));
                  break;
                case 'tr':
                  result.push(createTrElement(parsedContent, key++, attrs, cssRules, isLightTheme));
                  break;
                case 'td':
                  result.push(createTdElement(parsedContent, key++, attrs, cssRules, isLightTheme));
                  break;
                case 'th':
                  result.push(createThElement(parsedContent, key++, attrs, cssRules, isLightTheme));
                  break;
                case 'html':
                case 'head':
                case 'body':
                  // Document structure tags - render content directly
                  if (parsedContent.length > 0) {
                    result.push(...parsedContent);
                  }
                  break;
                case 'meta':
                case 'title':
                case 'link':
                  // Skip metadata tags
                  break;
                default:
                  // Unknown tag - render content directly
                  if (parsedContent.length > 0) {
                    result.push(...parsedContent);
                  }
                  break;

              }

              index = closeIndex + closeTag.length;
              continue;
            }
          }

          index = tagEnd + 1;
        }

        return result;
      };

      // Parse the entire HTML
      const parsedElements = parseElement(cleanHtml, cssRules);

      // Filter out empty text elements and return only ReactElements
      return parsedElements.filter((el): el is React.ReactElement =>
        React.isValidElement(el)
      );

    } catch (error) {
      console.error('Error parsing HTML:', error);
      // Return a simple fallback
      return [
        createH1Element('Error loading page', key++, {}, {}, isLightTheme),
        createPElement('The website content could not be displayed.', key++, {}, {}, isLightTheme)
      ];
    }
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