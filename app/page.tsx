"use client";

import { useState } from 'react';
import Terminal from '../components/Terminal';
import BootScreen from '../components/BootScreen';
import LoginPrompt from '../components/LoginPrompt';
import SetupWizard from '../components/SetupWizard';
import NanoEditor from '../components/NanoEditor';
import SnakeGame from '../components/SnakeGame';
import GraphicalBrowser from '../components/GraphicalBrowser';
import GeeMail from '../components/GeeMail';
import { MockInternet } from '../lib/internet';

interface GameSetup {
  playerName: string;
  computerName: string;
  rootPassword: string;
  userPassword: string;
  createdAt: string;
}

type GameState = 'boot' | 'login' | 'setup' | 'playing' | 'editing' | 'snake' | 'browsing' | 'geemail';

interface EditorState {
  filePath: string;
  content: string;
}

export default function Home() {
  const [gameState, setGameState] = useState<GameState>('boot');
  const [setupData, setSetupData] = useState<GameSetup | null>(null);
  const [editorState, setEditorState] = useState<EditorState | null>(null);
  const [browserUrl, setBrowserUrl] = useState<string>('');
  const [mockInternet, setMockInternet] = useState<MockInternet | null>(null);

  const handleStartNewGame = () => {
    setGameState('setup');
  };

  const handleSetupComplete = (data: Omit<GameSetup, 'createdAt'>) => {
    const completeSetup: GameSetup = {
      ...data,
      createdAt: new Date().toISOString()
    };

    // Save setup data with username
    const key = `linux-sim-setup-${data.playerName}`;
    localStorage.setItem(key, JSON.stringify(completeSetup));
    setSetupData(completeSetup);

    // Clear existing filesystem and internet data for this user
    localStorage.removeItem(`linux-sim-filesystem-${data.playerName}`);
    localStorage.removeItem(`linux-sim-internet-${data.playerName}`);
    localStorage.removeItem(`bank-account-${data.playerName}`);

    setMockInternet(new MockInternet(completeSetup));
    setGameState('playing');
  };

  const handleBootComplete = () => {
    setGameState('login');
  };

  const handleLoginSuccess = (data: GameSetup) => {
    setSetupData(data);
    setMockInternet(new MockInternet(data));
    setGameState('playing');
  };

  const handleBackToLogin = () => {
    setGameState('login');
  };

  const handleReboot = () => {
    setSetupData(null);
    setGameState('boot');
  };

  const handleOpenEditor = (filePath: string, content: string) => {
    setEditorState({ filePath, content });
    setGameState('editing');
  };

  const handleOpenSnake = () => {
    setGameState('snake');
  };

  const handleOpenBrowser = (url: string) => {
    setBrowserUrl(url);
    setGameState('browsing');
  };

  const handleExitBrowser = () => {
    setGameState('playing');
  };

  const handleOpenGeeMail = () => {
    setGameState('geemail');
  };

  const handleExitGeeMail = () => {
    setGameState('playing');
  };

  const handleSaveFile = async (content: string) => {
    try {
      // Import filesystem dynamically to avoid circular dependencies
      const { FakeFileSystem } = await import('../lib/filesystem');
      const fs = new FakeFileSystem(setupData);
      const result = fs.writeFile(editorState!.filePath, content);
      if (result.success) {
        fs.saveToLocalStorage(); // Save the filesystem state
        return null; // Success
      } else {
        return result.error || 'Failed to save file';
      }
    } catch (error) {
      return 'Error saving file';
    }
  };

  const handleExitEditor = () => {
    setEditorState(null);
    setGameState('playing');
  };

  const handleExitSnake = () => {
    setGameState('playing');
  };

  if (gameState === 'boot') {
    return <BootScreen onBootComplete={handleBootComplete} />;
  }

  if (gameState === 'login') {
    return <LoginPrompt onLoginSuccess={handleLoginSuccess} onStartNewGame={handleStartNewGame} />;
  }

  if (gameState === 'setup') {
    return (
      <SetupWizard
        onComplete={handleSetupComplete}
        onBack={handleBackToLogin}
      />
    );
  }

  if (gameState === 'playing') {
    return <Terminal setupData={setupData} onOpenEditor={handleOpenEditor} onOpenSnake={handleOpenSnake} onOpenBrowser={handleOpenBrowser} onOpenGeeMail={handleOpenGeeMail} onReboot={handleReboot} />;
  }

  if (gameState === 'editing' && editorState) {
    return (
      <NanoEditor
        filePath={editorState.filePath}
        initialContent={editorState.content}
        onSave={handleSaveFile}
        onExit={handleExitEditor}
      />
    );
  }

  if (gameState === 'snake') {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: '#000', zIndex: 999 }}>
        <SnakeGame onExit={handleExitSnake} />
      </div>
    );
  }

  if (gameState === 'browsing' && mockInternet) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: '#000', zIndex: 999 }}>
        <GraphicalBrowser initialUrl={browserUrl} onClose={handleExitBrowser} mockInternet={mockInternet} setupData={setupData} />
      </div>
    );
  }

  if (gameState === 'geemail') {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: '#000', zIndex: 999 }}>
        <GeeMail onClose={handleExitGeeMail} setupData={setupData} mockInternet={mockInternet!} />
      </div>
    );
  }

  return null;
}