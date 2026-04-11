import React from 'react';

interface GameSetup {
  playerName: string;
  computerName: string;
  rootPassword: string;
  userPassword: string;
  createdAt: string;
}

interface SkitterProps {
  setupData: GameSetup | null;
}

export default function Skitter({ setupData }: SkitterProps) {
  console.log('Skitter component rendered for domain skitter.com');
  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#1d9bf0',
      color: '#fff',
      minHeight: '100vh',
      padding: '20px',
      textAlign: 'center'
    }}>
      <h1>Skitter - The Mock Social Network</h1>
      <p>Welcome to Skitter, the simulated Twitter-like platform in the Grey Hack universe.</p>
      <p>This component is rendering correctly.</p>
      <div style={{ marginTop: '20px' }}>
        <p>Mock tweets and features coming soon...</p>
      </div>
    </div>
  );
}