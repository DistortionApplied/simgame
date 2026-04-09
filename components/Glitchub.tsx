import React, { useState, useEffect } from 'react';
import { AVAILABLE_PACKAGES, PackageInfo } from '../lib/apt';

interface GameSetup {
  playerName: string;
  computerName: string;
  rootPassword: string;
  userPassword: string;
  createdAt: string;
}

interface GlitchubProps {
  setupData: GameSetup | null;
}

interface Repository {
  name: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  lastUpdated: string;
  package: PackageInfo;
}

export default function Glitchub({ setupData }: GlitchubProps) {
  const [installedPackages, setInstalledPackages] = useState<Record<string, any>>({});
  const [installing, setInstalling] = useState<string | null>(null);
  const playerName = setupData?.playerName || 'user';

  // Generate repository data once on mount
  const [repositories] = useState<Repository[]>(() => {
    return Object.values(AVAILABLE_PACKAGES).map(pkg => ({
      name: pkg.name,
      description: pkg.description,
      language: pkg.name === 'nano' ? 'C' : pkg.name === 'browser' ? 'TypeScript' : 'Shell',
      stars: Math.floor(Math.random() * 500) + 50,
      forks: Math.floor(Math.random() * 100) + 10,
      lastUpdated: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      package: pkg
    }));
  });

  // Load installed packages from localStorage
  useEffect(() => {
    const installedKey = `linux-sim-installed-packages-${playerName}`;
    const installed = JSON.parse(localStorage.getItem(installedKey) || '{}');
    setInstalledPackages(installed);
  }, [playerName]);

  // Simulate package installation
  const installPackage = (packageName: string) => {
    setInstalling(packageName);

    // Simulate installation delay
    setTimeout(() => {
      const installedKey = `linux-sim-installed-packages-${playerName}`;
      const installed = JSON.parse(localStorage.getItem(installedKey) || '{}');

      if (!installed[packageName]) {
        const pkg = AVAILABLE_PACKAGES[packageName];
        installed[packageName] = {
          ...pkg,
          installedAt: new Date().toISOString()
        };
        localStorage.setItem(installedKey, JSON.stringify(installed));
        setInstalledPackages(installed);
      }

      setInstalling(null);
    }, 2000); // 2 second installation simulation
  };

  const isInstalled = (packageName: string) => !!installedPackages[packageName];

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
      margin: 0,
      padding: 0,
      backgroundColor: '#0d1117',
      color: '#f0f6fc',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{
        borderBottom: '1px solid #30363d',
        padding: '16px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#161b22'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <svg height="32" viewBox="0 0 16 16" width="32" style={{ fill: '#f0f6fc' }}>
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-1.12-.82-.01-.82.83.06 1.43.88 1.43.88.66 1.08 1.72.77 2.14.59.07-.5.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
          </svg>
          <h1 style={{ color: '#f0f6fc', fontSize: '24px', fontWeight: 600, margin: 0 }}>GlitcHub</h1>
          <nav style={{ display: 'flex', gap: '16px', fontSize: '14px' }}>
            <a href="#" style={{ color: '#f0f6fc', textDecoration: 'none' }}>Product</a>
            <a href="#" style={{ color: '#f0f6fc', textDecoration: 'none' }}>Solutions</a>
            <a href="#" style={{ color: '#f0f6fc', textDecoration: 'none' }}>Open Source</a>
            <a href="#" style={{ color: '#f0f6fc', textDecoration: 'none' }}>Pricing</a>
          </nav>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input 
            type="text" 
            placeholder="Search or jump to..." 
            style={{ 
              background: '#21262d', 
              border: '1px solid #30363d', 
              borderRadius: '6px', 
              padding: '8px 12px', 
              color: '#f0f6fc',
              width: '200px',
              fontSize: '14px'
            }}
          />
          <button style={{ 
            background: '#238636', 
            color: '#f0f6fc', 
            border: 'none', 
            borderRadius: '6px', 
            padding: '8px 16px', 
            fontWeight: 500,
            fontSize: '14px',
            cursor: 'pointer'
          }}>
            Sign in
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div style={{ 
        padding: '80px 32px', 
        textAlign: 'center',
        background: 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)'
      }}>
        <h1 style={{ 
          fontSize: '48px', 
          fontWeight: 600, 
          color: '#f0f6fc', 
          marginBottom: '24px' 
        }}>
          Where devs build tools
        </h1>
        <p style={{ 
          fontSize: '20px', 
          color: '#c9d1d9', 
          marginBottom: '32px', 
          maxWidth: '600px', 
          marginLeft: 'auto', 
          marginRight: 'auto' 
        }}>
          Millions of developers build, ship, and maintain their software on GlitcHub—the largest and most advanced development platform in the world.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
          <button style={{ 
            background: '#238636', 
            color: '#f0f6fc', 
            border: 'none', 
            borderRadius: '6px', 
            padding: '12px 24px', 
            fontSize: '16px', 
            fontWeight: 500,
            cursor: 'pointer'
          }}>
            Browse Programs
          </button>
          <button style={{ 
            background: '#21262d', 
            color: '#f0f6fc', 
            border: '1px solid #30363d', 
            borderRadius: '6px', 
            padding: '12px 24px', 
            fontSize: '16px',
            cursor: 'pointer'
          }}>
            Create Repository
          </button>
        </div>
      </div>

      {/* Repositories Section */}
      <div style={{ padding: '40px 32px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ color: '#f0f6fc', marginBottom: '24px' }}>Explore Repositories</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {repositories.map((repo) => (
            <div key={repo.name} style={{
              backgroundColor: '#161b22',
              border: '1px solid #30363d',
              borderRadius: '6px',
              padding: '16px',
              transition: 'border-color 0.2s'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <svg height="16" viewBox="0 0 16 16" width="16" style={{ fill: '#f0f6fc', marginRight: '8px' }}>
                  <path d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z"/>
                </svg>
                <h3 style={{ color: '#58a6ff', margin: 0, fontSize: '18px' }}>{repo.name}</h3>
              </div>
              <p style={{ color: '#c9d1d9', marginBottom: '16px', fontSize: '14px' }}>{repo.description}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: '#8b949e' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ 
                    width: '12px', 
                    height: '12px', 
                    borderRadius: '50%', 
                    backgroundColor: repo.language === 'TypeScript' ? '#3178c6' : repo.language === 'C' ? '#555555' : '#89e051' 
                  }}></div>
                  {repo.language}
                </span>
                <span>⭐ {repo.stars}</span>
                <span>🍴 {repo.forks}</span>
                <span>Updated {repo.lastUpdated}</span>
              </div>
              <div style={{ marginTop: '16px' }}>
                <button 
                  onClick={() => installPackage(repo.name)}
                  disabled={isInstalled(repo.name) || installing === repo.name}
                  style={{
                    backgroundColor: isInstalled(repo.name) ? '#238636' : '#21262d',
                    color: '#f0f6fc',
                    border: '1px solid #30363d',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    cursor: isInstalled(repo.name) ? 'default' : 'pointer',
                    width: '100%',
                    opacity: installing === repo.name ? 0.6 : 1
                  }}
                >
                  {installing === repo.name ? 'Installing...' : isInstalled(repo.name) ? '✓ Installed' : 'Install Package'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ 
        backgroundColor: '#161b22', 
        borderTop: '1px solid #30363d', 
        padding: '40px 32px', 
        marginTop: '80px' 
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ color: '#f0f6fc', marginBottom: '16px' }}>Categories</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <a href="#" style={{ color: '#c9d1d9', textDecoration: 'none', fontSize: '14px' }}>Network Tools</a>
              <a href="#" style={{ color: '#c9d1d9', textDecoration: 'none', fontSize: '14px' }}>System Utilities</a>
              <a href="#" style={{ color: '#c9d1d9', textDecoration: 'none', fontSize: '14px' }}>Games</a>
              <a href="#" style={{ color: '#c9d1d9', textDecoration: 'none', fontSize: '14px' }}>Text Editors</a>
            </div>
          </div>
          <div>
            <h3 style={{ color: '#f0f6fc', marginBottom: '16px' }}>Popular Languages</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <a href="#" style={{ color: '#c9d1d9', textDecoration: 'none', fontSize: '14px' }}>Bash</a>
              <a href="#" style={{ color: '#c9d1d9', textDecoration: 'none', fontSize: '14px' }}>JavaScript</a>
              <a href="#" style={{ color: '#c9d1d9', textDecoration: 'none', fontSize: '14px' }}>Python</a>
              <a href="#" style={{ color: '#c9d1d9', textDecoration: 'none', fontSize: '14px' }}>TypeScript</a>
            </div>
          </div>
          <div>
            <h3 style={{ color: '#f0f6fc', marginBottom: '16px' }}>Resources</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <a href="#" style={{ color: '#c9d1d9', textDecoration: 'none', fontSize: '14px' }}>Documentation</a>
              <a href="#" style={{ color: '#c9d1d9', textDecoration: 'none', fontSize: '14px' }}>API</a>
              <a href="#" style={{ color: '#c9d1d9', textDecoration: 'none', fontSize: '14px' }}>Security</a>
              <a href="#" style={{ color: '#c9d1d9', textDecoration: 'none', fontSize: '14px' }}>Status</a>
            </div>
          </div>
          <div>
            <h3 style={{ color: '#f0f6fc', marginBottom: '16px' }}>Community</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <a href="#" style={{ color: '#c9d1d9', textDecoration: 'none', fontSize: '14px' }}>Forums</a>
              <a href="#" style={{ color: '#c9d1d9', textDecoration: 'none', fontSize: '14px' }}>Blog</a>
              <a href="#" style={{ color: '#c9d1d9', textDecoration: 'none', fontSize: '14px' }}>GlitcHub</a>
              <a href="#" style={{ color: '#c9d1d9', textDecoration: 'none', fontSize: '14px' }}>Twitter</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}