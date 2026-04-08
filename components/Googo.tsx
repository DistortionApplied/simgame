import React, { useState } from 'react';
import { MockInternet } from '../lib/internet';

// Googo search page component
export const GoogoSearchPage: React.FC<{ onSearch: (q: string, lucky: boolean) => void }> = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent, lucky = false) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query, lucky);
    }
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', margin: '0', padding: '20px', backgroundColor: '#fff', color: '#202124', height: '100%', overflowY: 'auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{ color: '#4285f4', fontSize: '86px', fontWeight: 'normal', margin: '0' }}>Googo</h1>
      </div>
      <div style={{ textAlign: 'center' }}>
        <form onSubmit={(e) => handleSubmit(e)} style={{ display: 'inline-block' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Googo or type a URL"
            style={{ width: '100%', maxWidth: '584px', height: '44px', padding: '0 16px', border: '1px solid #dadce0', borderRadius: '24px', fontSize: '16px', outline: 'none', marginBottom: '24px' }}
            autoFocus
          />
          <div style={{ marginBottom: '24px' }}>
            <button
              type="submit"
              style={{ backgroundColor: '#f8f9fa', border: '1px solid #f8f9fa', borderRadius: '4px', color: '#3c4043', padding: '12px 24px', fontSize: '14px', cursor: 'pointer', margin: '0 6px' }}
            >
              Googo Search
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              style={{ backgroundColor: '#f8f9fa', border: '1px solid #f8f9fa', borderRadius: '4px', color: '#3c4043', padding: '12px 24px', fontSize: '14px', cursor: 'pointer', margin: '0 6px' }}
            >
              I&apos;m Feeling Lucky
            </button>
          </div>
        </form>
        <p style={{ fontSize: '13px', color: '#70757a', margin: '20px 0' }}>
          Googo offered in: <a href="#" style={{ color: '#1a0dab', textDecoration: 'none', margin: '0 5px' }}>Français</a> <a href="#" style={{ color: '#1a0dab', textDecoration: 'none', margin: '0 5px' }}>Español</a> <a href="#" style={{ color: '#1a0dab', textDecoration: 'none', margin: '0 5px' }}>Deutsch</a> <a href="#" style={{ color: '#1a0dab', textDecoration: 'none', margin: '0 5px' }}>日本語</a> <a href="#" style={{ color: '#1a0dab', textDecoration: 'none', margin: '0 5px' }}>中文</a>
        </p>
        <div style={{ backgroundColor: '#f2f2f2', borderTop: '1px solid #e4e4e4', padding: '15px 30px', fontSize: '14px', color: '#70757a', marginTop: '20px' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <span>
              <a href="#" style={{ color: '#70757a', textDecoration: 'none', margin: '0 10px' }}>About</a>
              <a href="#" style={{ color: '#70757a', textDecoration: 'none', margin: '0 10px' }}>Advertising</a>
              <a href="#" style={{ color: '#70757a', textDecoration: 'none', margin: '0 10px' }}>Business</a>
              <a href="#" style={{ color: '#70757a', textDecoration: 'none', margin: '0 10px' }}>How Search works</a>
            </span>
            <span style={{ float: 'right' }}>
              <a href="#" style={{ color: '#70757a', textDecoration: 'none', margin: '0 10px' }}>Privacy</a>
              <a href="#" style={{ color: '#70757a', textDecoration: 'none', margin: '0 10px' }}>Terms</a>
              <a href="#" style={{ color: '#70757a', textDecoration: 'none', margin: '0 10px' }}>Settings</a>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export function generateSearchResults(query: string, isLucky: boolean, mockInternet: MockInternet): string {
  if (!query.trim()) {
    return `<html><body><h1>Googo</h1><p>Please enter a search query.</p></body></html>`;
  }

  const allWebsites = mockInternet.getAllWebsites();
  const allServers = mockInternet.getAllServers();

  // Simple search: match domain or title, with special aliases
  const queryLower = query.toLowerCase();
  const matchingWebsites = allWebsites.filter(w => {
    const domainMatch = w.domain.toLowerCase().includes(queryLower);
    const titleMatch = w.title && w.title.toLowerCase().includes(queryLower);

    // Special aliases for renamed sites
    const aliases: Record<string, string[]> = {
      'spamazon.com': ['amazon', 'amazon.com', 'shopping', 'buy', 'store'],
      'glitchub.com': ['github', 'github.com', 'code', 'programming', 'git'],
      'slikipedia.org': ['wikipedia', 'wikipedia.org', 'info', 'information', 'wiki'],
      'readdit.com': ['reddit', 'reddit.com', 'social media', 'social', 'forum'],
      'viewtube.com': ['youtube', 'youtube.com', 'video', 'videos'],
      'facespace.com': ['facebook', 'facebook.com', 'social', 'social media'],
      'skitter.com': ['twitter', 'twitter.com', 'tweet', 'social']
    };

    const siteAliases = aliases[w.domain] || [];
    const aliasMatch = siteAliases.some(alias => queryLower.includes(alias));

    return domainMatch || titleMatch || aliasMatch;
  });

  const matchingServers = allServers.filter(s =>
    (s.hostname && s.hostname.toLowerCase().includes(query.toLowerCase())) ||
    s.ip.includes(query)
  );

  if (isLucky && matchingWebsites.length > 0) {
    // I'm Feeling Lucky: redirect to first result
    const firstResult = matchingWebsites[0];
    return `<html><head><meta http-equiv="refresh" content="0; url=http://${firstResult.domain}"></head><body><p>Redirecting to ${firstResult.domain}...</p></body></html>`;
  }

  // Build results page
  let results = `<html>
<head><title>Googo Search - ${query}</title></head>
<body style="font-family: Arial, sans-serif; margin: 20px;">
<h1>Googo Search Results</h1>
<p>Search query: <strong>${query}</strong></p>`;

  if (matchingWebsites.length > 0) {
    results += `<h2>Websites</h2><ul>`;
    matchingWebsites.slice(0, 10).forEach(w => {
      results += `<li><a href="http://${w.domain}">${w.title || w.domain}</a> - ${w.domain}</li>`;
    });
    results += `</ul>`;
  }

  if (matchingServers.length > 0) {
    results += `<h2>Servers</h2><ul>`;
    matchingServers.slice(0, 10).forEach(s => {
      results += `<li>${s.hostname || s.ip} (${s.ip})</li>`;
    });
    results += `</ul>`;
  }

  if (matchingWebsites.length === 0 && matchingServers.length === 0) {
    results += `<p>No results found for "${query}".</p>`;
  }

  results += `<p><a href="http://googo.com">Back to Googo</a></p></body></html>`;
  return results;
}