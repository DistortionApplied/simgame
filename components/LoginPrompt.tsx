"use client";

import { useState } from 'react';

interface GameSetup {
  playerName: string;
  computerName: string;
  rootPassword: string;
  userPassword: string;
  createdAt: string;
}

interface LoginPromptProps {
  onLoginSuccess: (data: GameSetup) => void;
  onStartNewGame: () => void;
}

export default function LoginPrompt({ onLoginSuccess, onStartNewGame }: LoginPromptProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [stage, setStage] = useState<'username' | 'password' | 'select'>('username');
  const [mode, setMode] = useState<'login' | 'delete'>('login');
  const [error, setError] = useState('');
  const [availableUsers, setAvailableUsers] = useState<string[]>([]);

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      setStage('password');
      setError('');
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError(mode === 'login' ? 'Login incorrect' : 'Delete failed');
      // Reset to username prompt
      setStage('username');
      setPassword('');
      return;
    }

    // Backdoor for testing: username 'test' and password 'admin'
    if (username === 'test' && password === 'admin' && mode === 'login') {
      const backdoorSetup: GameSetup = {
        playerName: 'testuser',
        computerName: 'testserver',
        rootPassword: 'rootpass',
        userPassword: 'userpass',
        createdAt: new Date().toISOString()
      };
      // Save the backdoor setup manually since onLoginSuccess doesn't save it
      const setupKey = `linux-sim-setup-${backdoorSetup.playerName}`;
      localStorage.setItem(setupKey, JSON.stringify(backdoorSetup));
      // Clear any existing filesystem and packages for this user
      const filesystemKey = `linux-sim-filesystem-${backdoorSetup.playerName}`;
      const packagesKey = `linux-sim-installed-packages-${backdoorSetup.playerName}`;
      localStorage.removeItem(filesystemKey);
      localStorage.removeItem(packagesKey);
      onLoginSuccess(backdoorSetup);
      return;
    }
    // Backdoor for testing: username 'test' and password 'admin'
    if (username === 'test' && password === 'admin' && mode === 'login') {
      const backdoorSetup: GameSetup = {
        playerName: 'testuser',
        computerName: 'testserver',
        rootPassword: 'rootpass',
        userPassword: 'userpass',
        createdAt: new Date().toISOString()
      };
      onLoginSuccess(backdoorSetup);
      return;
    }

    const setupKey = `linux-sim-setup-${username}`;
    const filesystemKey = `linux-sim-filesystem-${username}`;
    const savedSetup = localStorage.getItem(setupKey);

    if (savedSetup) {
      try {
        const setupData: GameSetup = JSON.parse(savedSetup);
        // For simplicity, check if password matches userPassword
        // In a real system, this would be hashed
        if (password === setupData.userPassword) {
          if (mode === 'login') {
            onLoginSuccess(setupData);
          } else {
            // Delete mode
            localStorage.removeItem(setupKey);
            localStorage.removeItem(filesystemKey);
            setError('');
            setMode('login');
            setUsername('');
            setPassword('');
            setStage('username');
            // Show success message briefly
            setTimeout(() => setError(`Account '${username}' deleted successfully.`), 100);
          }
        } else {
          setError(mode === 'login' ? 'Login incorrect' : 'Password incorrect');
          // Reset to username prompt on failure
          setStage('username');
          setPassword('');
          // Keep username for convenience, or clear it
          // setUsername('');
        }
      } catch (error) {
        setError('Invalid saved data');
      }
    } else {
      setError(mode === 'login' ? 'Login incorrect' : 'User not found');
      // Reset to username prompt on failure
      setStage('username');
      setPassword('');
    }
  };

  const getAvailableUsers = () => {
    const users: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('linux-sim-setup-')) {
        const username = key.replace('linux-sim-setup-', '');
        users.push(username);
      }
    }
    return users.sort();
  };

  const handleNewUser = () => {
    onStartNewGame();
  };

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono p-4 flex flex-col justify-center">
      <div className="max-w-md mx-auto w-full">
        <div className="mb-8">
          <div className="text-xl mb-4">
            {mode === 'login' ? 'Welcome to Linux Sim!' : 'Delete User Account'}
          </div>
          <div className="text-sm text-green-300 mb-4">
            * Documentation: https://help.ubuntu.com
          </div>
          <div className="text-sm text-green-300 mb-4">
            * Support: https://ubuntu.com/advantage
          </div>
        </div>

        {stage === 'username' ? (
          <form onSubmit={handleUsernameSubmit} className="mb-4">
            <div className="flex items-center mb-2">
              <span className="mr-2">
                {mode === 'login' ? 'Linux Sim login:' : 'Username to delete:'}
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-transparent border-none outline-none text-green-400 caret-green-400 flex-1"
                autoFocus
                spellCheck="false"
                autoCorrect="off"
                autoComplete="off"
              />
            </div>
          </form>
        ) : stage === 'select' ? (
          <div className="mb-4">
            <div className="text-green-400 mb-2">Available accounts:</div>
            {availableUsers.length === 0 ? (
              <div className="text-red-400">No saved accounts found.</div>
            ) : (
              <div className="space-y-1">
                {availableUsers.map((user) => (
                  <button
                    key={user}
                    onClick={() => {
                      setUsername(user);
                      setStage('password');
                      setError('');
                    }}
                    className="block w-full text-left text-green-400 hover:text-green-200 underline"
                  >
                    {user}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="mb-4">
            <div className="flex items-center mb-2">
              <span className="mr-2">
                {mode === 'login' ? 'Password:' : 'Confirm password:'}
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent border-none outline-none text-green-400 caret-green-400 flex-1"
                autoFocus
                spellCheck="false"
                autoCorrect="off"
                autoComplete="off"
              />
            </div>
          </form>
        )}

        {error && (
          <div className="text-red-400 mb-4">{error}</div>
        )}

        {mode === 'login' ? (
          <div className="text-sm text-green-300 space-y-2">
            <div>
              <button
                onClick={handleNewUser}
                className="underline hover:text-green-100"
              >
                Create new user account
              </button>
            </div>
            <div>
            <button
              onClick={() => {
                setMode('delete');
                setAvailableUsers(getAvailableUsers());
                setUsername('');
                setPassword('');
                setStage('select');
                setError('');
              }}
              className="underline hover:text-red-300"
            >
              Delete user account
            </button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-green-300">
            <button
              onClick={() => {
                setMode('login');
                setUsername('');
                setPassword('');
                setStage('username');
                setError('');
              }}
              className="underline hover:text-green-100 mr-4"
            >
              Back to login
            </button>
            {stage === 'select' && (
              <button
                onClick={() => {
                  setStage('select');
                  setUsername('');
                  setPassword('');
                  setError('');
                }}
                className="underline hover:text-green-100"
              >
                Back to account list
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}