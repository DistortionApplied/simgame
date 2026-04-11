"use client";

import React, { useState, useCallback, useRef } from 'react';
import { MockInternet, Email } from '../lib/internet';

interface GameSetup {
  playerName: string;
  computerName: string;
  rootPassword: string;
  userPassword: string;
  createdAt: string;
}

interface GeeMailProps {
  onClose?: () => void;
  setupData: GameSetup | null;
  mockInternet: MockInternet;
  isWebsite?: boolean;
}

export default function GeeMail({ onClose, setupData, mockInternet, isWebsite = false }: GeeMailProps) {
  // Website mode state
  const [accountForm, setAccountForm] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  // App mode state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });
  const [loginError, setLoginError] = useState('');
  const [currentView, setCurrentView] = useState<'inbox' | 'sent' | 'trash' | 'archive' | 'starred' | 'compose'>('inbox');
  const [emails, setEmails] = useState<Email[]>([]);
  const [filteredEmails, setFilteredEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [composeData, setComposeData] = useState({
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    body: ''
  });
  const [windowPosition, setWindowPosition] = useState({ x: 100, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffsetRef = useRef<{ x: number; y: number } | null>(null);
  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([]);

  // Website mode functions
  const handleAccountCreation = (e: React.FormEvent) => {
    e.preventDefault();

    if (!accountForm.username || !accountForm.password) {
      setMessage('Username and password are required');
      setMessageType('error');
      return;
    }

    if (accountForm.password !== accountForm.confirmPassword) {
      setMessage('Passwords do not match');
      setMessageType('error');
      return;
    }

    const email = `${accountForm.username}@geemail.com`;

    // Check if account already exists
    if (mockInternet.getEmailAccount(email)) {
      setMessage('An account with this email already exists');
      setMessageType('error');
      return;
    }

    // Create the account
    const success = mockInternet.createEmailAccount({
      email,
      password: accountForm.password,
      displayName: accountForm.username, // Use username as display name
      createdAt: new Date().toISOString()
    });

    if (success) {
      setMessage(`Account created successfully! Your email address ${email} is now ready to use with the GeeMail desktop app.`);
      setMessageType('success');

      // Send welcome email with login instructions
      const welcomeEmail = {
        id: Date.now().toString(),
        from: 'admin@geemail.com',
        to: email,
        cc: [],
        bcc: [],
        subject: 'Welcome to GeeMail - Your Account is Ready!',
        body: `Welcome to GeeMail!

Your email account has been successfully created and is ready to use!

📧 Your Email Address: ${email}
🔐 Your Password: ${accountForm.password}

To start using GeeMail:

1. Install the desktop app: apt install geemail
2. Open the app and sign in with your new email address
3. Start sending and receiving emails!

Your account includes:
• Unlimited email storage
• Secure encryption
• Web and desktop access

Happy emailing!

- The GeeMail Team
admin@geemail.com`,
        timestamp: new Date().toISOString(),
        read: false,
        starred: false,
        labels: ['inbox'],
        threadId: Date.now().toString(),
        attachments: []
      };

      mockInternet.addEmail(welcomeEmail);

      // Clear form on success
      setAccountForm({
        username: '',
        password: '',
        confirmPassword: ''
      });
    } else {
      setMessage('Failed to create account. Please try again.');
      setMessageType('error');
    }
  };

  const handleInstall = () => {
    setMessage('To install GeeMail, run: apt install geemail');
    setMessageType('success');
  };

  // Load emails when logged in
  React.useEffect(() => {
    if (!isLoggedIn || !currentUserEmail) return;

    const currentEmails = mockInternet.getEmails();
    setEmails(currentEmails);
  }, [mockInternet, isLoggedIn, currentUserEmail]);

  // Filter emails based on current view and search
  React.useEffect(() => {
    if (!currentUserEmail) return;

    let filtered = emails;
    if (currentView !== 'compose') {
      if (currentView === 'starred') {
        filtered = emails.filter(email => email.starred);
      } else {
        filtered = mockInternet.getEmailsByLabel(currentView);
      }
      if (searchQuery) {
        filtered = mockInternet.searchEmails(searchQuery, currentUserEmail).filter(email =>
          filtered.some(f => f.id === email.id)
        );
      }
    }
    setFilteredEmails(filtered);
  }, [emails, currentView, searchQuery, mockInternet, currentUserEmail]);

  // Collect email suggestions
  React.useEffect(() => {
    const allEmails = new Set<string>();
    emails.forEach(email => {
      allEmails.add(email.from);
      allEmails.add(email.to);
      if (email.cc) email.cc.forEach(cc => allEmails.add(cc));
      if (email.bcc) email.bcc.forEach(bcc => allEmails.add(bcc));
    });
    setEmailSuggestions(Array.from(allEmails).filter(email => email.includes('@')));
  }, [emails]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginForm.email || !loginForm.password) {
      setLoginError('Email and password are required');
      return;
    }

    const success = mockInternet.authenticateEmailAccount(loginForm.email, loginForm.password);
    if (success) {
      setCurrentUserEmail(loginForm.email);
      setIsLoggedIn(true);
      setLoginForm({ email: '', password: '' });
    } else {
      setLoginError('Invalid email or password');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUserEmail(null);
    setEmails([]);
    setFilteredEmails([]);
    setSelectedEmail(null);
    setCurrentView('inbox');
    setSearchQuery('');
    setComposeData({ to: '', cc: '', bcc: '', subject: '', body: '' });
  };

  const handleComposeSubmit = useCallback(() => {
    if (!composeData.to || !composeData.subject || !composeData.body || !currentUserEmail) return;

    const senderEmail = currentUserEmail;
    const timestamp = new Date().toISOString();
    const threadId = Date.now().toString();

    // Parse recipients
    const toRecipients = composeData.to.split(',').map(s => s.trim()).filter(s => s);
    const ccRecipients = composeData.cc ? composeData.cc.split(',').map(s => s.trim()).filter(s => s) : [];
    const bccRecipients = composeData.bcc ? composeData.bcc.split(',').map(s => s.trim()).filter(s => s) : [];

    const allRecipients = [...toRecipients, ...ccRecipients, ...bccRecipients];

    // Create sent email for sender
    const sentEmail: Email = {
      id: `${threadId}-sent`,
      from: senderEmail,
      to: composeData.to,
      cc: ccRecipients,
      bcc: bccRecipients,
      subject: composeData.subject,
      body: composeData.body,
      timestamp,
      read: true,
      starred: false,
      labels: ['sent'],
      threadId
    };

    mockInternet.addEmail(sentEmail);

    // Create inbox emails for each recipient
    allRecipients.forEach((recipient, index) => {
      const inboxEmail: Email = {
        id: `${threadId}-inbox-${index}`,
        from: senderEmail,
        to: recipient,
        cc: recipient === composeData.to ? ccRecipients : [],
        bcc: [],
        subject: composeData.subject,
        body: composeData.body,
        timestamp,
        read: false,
        starred: false,
        labels: ['inbox'],
        threadId
      };

      mockInternet.addEmail(inboxEmail);
    });

    setEmails(mockInternet.getEmails());
    setComposeData({ to: '', cc: '', bcc: '', subject: '', body: '' });
    setCurrentView('inbox');
  }, [composeData, currentUserEmail, mockInternet]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    dragOffsetRef.current = {
      x: e.clientX - windowPosition.x,
      y: e.clientY - windowPosition.y
    };
  }, [windowPosition]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragOffsetRef.current) return;
    setWindowPosition({
      x: e.clientX - dragOffsetRef.current.x,
      y: e.clientY - dragOffsetRef.current.y
    });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Website mode - show landing page
  if (isWebsite) {
    return (
      <div style={{
      fontFamily: '"Google Sans", Roboto, RobotoDraft, Helvetica, Arial, sans-serif',
      backgroundColor: '#fff',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        borderBottom: '1px solid #e8eaed',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center'
      }}>
        <span style={{
          fontSize: '20px',
          fontWeight: '400',
          color: '#ea4335',
          letterSpacing: '-0.5px'
        }}>
          GeeMail
        </span>
      </div>

      {/* Main Content */}
      <div style={{
        flex: '1',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '24px 16px',
        maxWidth: '400px',
        margin: '0 auto',
        width: '100%'
      }}>
        {/* Title */}
        <h1 style={{
          fontSize: '24px',
          fontWeight: '400',
          color: '#202124',
          margin: '0 0 8px 0',
          textAlign: 'center',
          letterSpacing: '0.25px'
        }}>
          Create your GeeMail Account
        </h1>

        {/* Account Creation Form */}
        <form onSubmit={handleAccountCreation} style={{ width: '100%', maxWidth: '360px' }}>
          {message && (
            <div style={{
              padding: '12px 16px',
              marginBottom: '16px',
              borderRadius: '4px',
              backgroundColor: messageType === 'success' ? '#e8f5e8' : '#fce8e6',
              color: messageType === 'success' ? '#1e4620' : '#c62828',
              fontSize: '14px',
              lineHeight: '1.4',
              border: `1px solid ${messageType === 'success' ? '#4caf50' : '#ef5350'}`
            }}>
              {message}
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={accountForm.username}
                onChange={(e) => setAccountForm({...accountForm, username: e.target.value})}
                placeholder=""
                style={{
                  width: '100%',
                  padding: '20px 16px 4px 16px',
                  border: '1px solid #dadce0',
                  borderRadius: '4px',
                  fontSize: '16px',
                  backgroundColor: '#fff',
                  color: '#202124',
                  outline: 'none',
                  boxSizing: 'border-box',
                  height: '56px'
                }}
                onFocus={(e) => (e.target as HTMLElement).style.borderColor = '#1a73e8'}
                onBlur={(e) => (e.target as HTMLElement).style.borderColor = '#dadce0'}
                required
              />
              <label style={{
                position: 'absolute',
                left: '16px',
                top: accountForm.username ? '8px' : '16px',
                fontSize: accountForm.username ? '12px' : '16px',
                color: accountForm.username ? '#1a73e8' : '#5f6368',
                pointerEvents: 'none',
                transition: 'all 0.2s ease',
                backgroundColor: '#fff',
                padding: '0 4px'
              }}>
                Username
              </label>
              <div style={{
                position: 'absolute',
                right: '16px',
                top: '16px',
                fontSize: '14px',
                color: '#5f6368'
              }}>
                @geemail.com
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                value={accountForm.password}
                onChange={(e) => setAccountForm({...accountForm, password: e.target.value})}
                placeholder=""
                style={{
                  width: '100%',
                  padding: '20px 16px 4px 16px',
                  border: '1px solid #dadce0',
                  borderRadius: '4px',
                  fontSize: '16px',
                  backgroundColor: '#fff',
                  color: '#202124',
                  outline: 'none',
                  boxSizing: 'border-box',
                  height: '56px'
                }}
                onFocus={(e) => (e.target as HTMLElement).style.borderColor = '#1a73e8'}
                onBlur={(e) => (e.target as HTMLElement).style.borderColor = '#dadce0'}
                required
              />
              <label style={{
                position: 'absolute',
                left: '16px',
                top: accountForm.password ? '8px' : '16px',
                fontSize: accountForm.password ? '12px' : '16px',
                color: accountForm.password ? '#1a73e8' : '#5f6368',
                pointerEvents: 'none',
                transition: 'all 0.2s ease',
                backgroundColor: '#fff',
                padding: '0 4px'
              }}>
                Password
              </label>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                value={accountForm.confirmPassword}
                onChange={(e) => setAccountForm({...accountForm, confirmPassword: e.target.value})}
                placeholder=""
                style={{
                  width: '100%',
                  padding: '20px 16px 4px 16px',
                  border: '1px solid #dadce0',
                  borderRadius: '4px',
                  fontSize: '16px',
                  backgroundColor: '#fff',
                  color: '#202124',
                  outline: 'none',
                  boxSizing: 'border-box',
                  height: '56px'
                }}
                onFocus={(e) => (e.target as HTMLElement).style.borderColor = '#1a73e8'}
                onBlur={(e) => (e.target as HTMLElement).style.borderColor = '#dadce0'}
                required
              />
              <label style={{
                position: 'absolute',
                left: '16px',
                top: accountForm.confirmPassword ? '8px' : '16px',
                fontSize: accountForm.confirmPassword ? '12px' : '16px',
                color: accountForm.confirmPassword ? '#1a73e8' : '#5f6368',
                pointerEvents: 'none',
                transition: 'all 0.2s ease',
                backgroundColor: '#fff',
                padding: '0 4px'
              }}>
                Confirm password
              </label>
            </div>
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '12px 24px',
              backgroundColor: '#1a73e8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              textTransform: 'none',
              letterSpacing: '0.25px',
              transition: 'all 0.2s ease',
              height: '40px'
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.backgroundColor = '#1557b0';
              (e.target as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.3)';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.backgroundColor = '#1a73e8';
              (e.target as HTMLElement).style.boxShadow = 'none';
            }}
          >
            Next
          </button>
        </form>

        {/* Footer */}
        <div style={{
          marginTop: '24px',
          textAlign: 'center'
        }}>
          <p style={{
            fontSize: '12px',
            color: '#5f6368',
            margin: '0',
            lineHeight: '1.5'
          }}>
            By creating an account, you agree to GeeMail&apos;s{' '}
            <a href="#" style={{ color: '#1a73e8', textDecoration: 'none' }}>Terms of Service</a>{' '}
            and{' '}
            <a href="#" style={{ color: '#1a73e8', textDecoration: 'none' }}>Privacy Policy</a>
          </p>
        </div>
      </div>

          {/* Download Section */}
        <div style={{
          background: 'white',
          padding: '30px',
          borderRadius: '10px',
          textAlign: 'center',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          maxWidth: '600px',
          margin: '0 auto 40px auto'
        }}>
          <h2 style={{ color: '#333', marginTop: '0' }}>Download GeeMail Desktop Application</h2>
          <p style={{ margin: '20px 0', color: '#666' }}>
            Get the full GeeMail experience with advanced features!
          </p>

          <div style={{
            background: '#f8f9fa',
            padding: '20px',
            borderRadius: '5px',
            margin: '20px 0'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>Installation Instructions:</h4>
            <p style={{ margin: '0', color: '#666', fontFamily: 'monospace', background: 'white', padding: '10px', borderRadius: '3px', border: '1px solid #ddd' }}>
              apt install geemail
            </p>
            <p style={{ margin: '10px 0 0 0', fontSize: '14px', color: '#666' }}>
              Run this command in your terminal to install GeeMail
            </p>
          </div>

          <button
            onClick={handleInstall}
            style={{
              padding: '15px 30px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            Install GeeMail Desktop App
          </button>
        </div>
    </div>
  );
}

  // App mode - show login or email interface
  if (!isLoggedIn) {
    return (
      <div
        style={{
          position: 'fixed',
          left: `${windowPosition.x}px`,
          top: `${windowPosition.y}px`,
          width: '800px',
          height: '600px',
          backgroundColor: '#2d3748',
          border: '2px solid #4a5568',
          borderRadius: '8px',
          zIndex: 1000,
          fontFamily: 'monospace',
          color: '#e2e8f0',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Window Header */}
        <div
          style={{
            backgroundColor: '#1a202c',
            padding: '8px 12px',
            borderBottom: '1px solid #4a5568',
            borderRadius: '6px 6px 0 0',
            cursor: 'move',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
          onMouseDown={handleMouseDown}
        >
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#e53e3e',
                cursor: 'pointer'
              }}
              onClick={onClose}
            />
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#38a169',
                cursor: 'pointer'
              }}
            />
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#3182ce',
                cursor: 'pointer'
              }}
            />
            <span style={{ color: '#e2e8f0', fontSize: '14px', marginLeft: '8px' }}>
              GeeMail - Login
            </span>
          </div>
        </div>

        {/* Login Content */}
        <div style={{
          flex: 1,
          padding: '16px',
          overflowY: 'auto',
          backgroundColor: '#2d3748',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#e2e8f0', marginBottom: '16px' }}>Sign in to GeeMail</h2>
          <p style={{ color: '#a0aec0', marginBottom: '24px', maxWidth: '500px' }}>
            Enter your GeeMail credentials to access your email. Create an account at geemail.com if you don't have one.
          </p>
          <form onSubmit={handleLogin} style={{ width: '100%', maxWidth: '360px' }}>
            {loginError && (
              <div style={{
                padding: '12px 16px',
                marginBottom: '16px',
                borderRadius: '4px',
                backgroundColor: '#fce8e6',
                color: '#c62828',
                fontSize: '14px',
                lineHeight: '1.4',
                border: '1px solid #ef5350'
              }}>
                {loginError}
              </div>
            )}
            <div style={{ marginBottom: '16px' }}>
              <input
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                placeholder="Email address"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #4a5568',
                  borderRadius: '4px',
                  fontSize: '16px',
                  backgroundColor: '#1a202c',
                  color: '#e2e8f0',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                required
              />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                placeholder="Password"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #4a5568',
                  borderRadius: '4px',
                  fontSize: '16px',
                  backgroundColor: '#1a202c',
                  color: '#e2e8f0',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                required
              />
            </div>
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '12px 24px',
                backgroundColor: '#1a73e8',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                textTransform: 'none',
                letterSpacing: '0.25px',
                transition: 'all 0.2s ease',
                height: '40px'
              }}
            >
              Sign In
            </button>
          </form>
          <button
            onClick={onClose}
            style={{
              marginTop: '16px',
              backgroundColor: '#4a5568',
              color: '#e2e8f0',
              border: '1px solid #4a5568',
              borderRadius: '4px',
              padding: '8px 16px',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: `${windowPosition.x}px`,
        top: `${windowPosition.y}px`,
        width: '800px',
        height: '600px',
        backgroundColor: '#2d3748',
        border: '2px solid #4a5568',
        borderRadius: '8px',
        zIndex: 1000,
        fontFamily: 'monospace',
        color: '#e2e8f0',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Window Header - only show when not in website mode */}
      {!isWebsite && (
        <div
          style={{
            backgroundColor: '#1a202c',
            padding: '8px 12px',
            borderBottom: '1px solid #4a5568',
            borderRadius: '6px 6px 0 0',
            cursor: 'move',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
          onMouseDown={handleMouseDown}
        >
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#e53e3e',
                cursor: 'pointer'
              }}
              onClick={onClose}
            />
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#38a169',
                cursor: 'pointer'
              }}
            />
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#3182ce',
                cursor: 'pointer'
              }}
            />
            <span style={{ color: '#e2e8f0', fontSize: '14px', marginLeft: '8px' }}>
            GeeMail - {currentView === 'inbox' ? 'Inbox' : currentView === 'compose' ? 'Compose' : 'Mail'}
          </span>
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: '#e53e3e',
              color: '#e2e8f0',
              border: '1px solid #e53e3e',
              borderRadius: '4px',
              padding: '4px 8px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Logout
          </button>
        </div>
      </div>
      )}

      {/* Toolbar */}
      <div style={{
        backgroundColor: '#2d3748',
        padding: '8px 12px',
        borderBottom: '1px solid #4a5568',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {/* Search Bar */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="Search emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              padding: '4px 8px',
              backgroundColor: '#1a202c',
              border: '1px solid #4a5568',
              borderRadius: '4px',
              color: '#e2e8f0',
              fontFamily: 'monospace'
            }}
          />
          <button
            onClick={() => setCurrentView('compose')}
            style={{
              backgroundColor: currentView === 'compose' ? '#4a5568' : '#1a202c',
              color: '#e2e8f0',
              border: '1px solid #4a5568',
              borderRadius: '4px',
              padding: '4px 12px',
              cursor: 'pointer'
            }}
          >
            Compose
          </button>
        </div>

        {/* Label Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { key: 'inbox', label: 'Inbox' },
            { key: 'sent', label: 'Sent' },
            { key: 'starred', label: 'Starred' },
            { key: 'archive', label: 'Archive' },
            { key: 'trash', label: 'Trash' }
          ].map(({ key, label }) => {
            const count = key === 'starred'
              ? emails.filter(e => e.starred).length
              : mockInternet.getEmailsByLabel(key).length;
            return (
              <button
                key={key}
                onClick={() => setCurrentView(key as any)}
                style={{
                  backgroundColor: currentView === key ? '#4a5568' : '#1a202c',
                  color: '#e2e8f0',
                  border: '1px solid #4a5568',
                  borderRadius: '4px',
                  padding: '4px 12px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        {currentView === 'inbox' ? (
          <div style={{ display: 'flex', width: '100%' }}>
            {/* Email List */}
            <div style={{
              width: '300px',
              borderRight: '1px solid #4a5568',
              overflowY: 'auto',
              backgroundColor: '#1a202c'
            }}>
              {filteredEmails.map(email => (
                <div
                  key={email.id}
                  onClick={() => {
                    setSelectedEmail(email);
                    if (!email.read) {
                      mockInternet.markEmailAsRead(email.id, true);
                      setEmails(mockInternet.getEmails());
                    }
                  }}
                  style={{
                    padding: '12px',
                    borderBottom: '1px solid #2d3748',
                    cursor: 'pointer',
                    backgroundColor: selectedEmail?.id === email.id ? '#2d3748' : 'transparent',
                    fontWeight: email.read ? 'normal' : 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      mockInternet.starEmail(email.id, !email.starred);
                      setEmails(mockInternet.getEmails());
                    }}
                    style={{
                      color: email.starred ? '#ffd700' : '#718096',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    ★
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', marginBottom: '4px' }}>{email.from}</div>
                    <div style={{ fontSize: '12px', color: '#a0aec0', marginBottom: '4px' }}>{email.subject}</div>
                    <div style={{ fontSize: '11px', color: '#718096' }}>
                      {new Date(email.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Email Content */}
            <div style={{
              flex: 1,
              padding: '16px',
              overflowY: 'auto',
              backgroundColor: '#2d3748'
            }}>
              {selectedEmail ? (
                <div>
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
                      {selectedEmail.subject}
                    </div>
                    <div style={{ color: '#a0aec0', marginBottom: '4px' }}>
                      From: {selectedEmail.from}
                    </div>
                    <div style={{ color: '#a0aec0', marginBottom: '4px' }}>
                      To: {selectedEmail.to}
                    </div>
                    {selectedEmail.cc && selectedEmail.cc.length > 0 && (
                      <div style={{ color: '#a0aec0', marginBottom: '4px' }}>
                        CC: {selectedEmail.cc.join(', ')}
                      </div>
                    )}
                    <div style={{ color: '#a0aec0', fontSize: '12px' }}>
                      {new Date(selectedEmail.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5', marginBottom: '16px' }}>
                    {selectedEmail.body}
                  </div>
                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => {
                        // Reply functionality - set compose with reply data
                        setComposeData({
                          to: selectedEmail.from,
                          cc: '',
                          bcc: '',
                          subject: selectedEmail.subject.startsWith('Re: ') ? selectedEmail.subject : `Re: ${selectedEmail.subject}`,
                          body: `\n\n--- Original Message ---\nFrom: ${selectedEmail.from}\nTo: ${selectedEmail.to}\nDate: ${new Date(selectedEmail.timestamp).toLocaleString()}\n\n${selectedEmail.body}`
                        });
                        setCurrentView('compose');
                      }}
                      style={{
                        backgroundColor: '#4a5568',
                        color: '#e2e8f0',
                        border: '1px solid #4a5568',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Reply
                    </button>
                    <button
                      onClick={() => {
                        // Forward functionality
                        setComposeData({
                          to: '',
                          cc: '',
                          bcc: '',
                          subject: selectedEmail.subject.startsWith('Fwd: ') ? selectedEmail.subject : `Fwd: ${selectedEmail.subject}`,
                          body: `\n\n--- Forwarded Message ---\nFrom: ${selectedEmail.from}\nTo: ${selectedEmail.to}\nDate: ${new Date(selectedEmail.timestamp).toLocaleString()}\nSubject: ${selectedEmail.subject}\n\n${selectedEmail.body}`
                        });
                        setCurrentView('compose');
                      }}
                      style={{
                        backgroundColor: '#4a5568',
                        color: '#e2e8f0',
                        border: '1px solid #4a5568',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Forward
                    </button>
                    <button
                      onClick={() => {
                        mockInternet.starEmail(selectedEmail.id, !selectedEmail.starred);
                        setEmails(mockInternet.getEmails());
                      }}
                      style={{
                        backgroundColor: selectedEmail.starred ? '#ffd700' : '#4a5568',
                        color: selectedEmail.starred ? '#000' : '#e2e8f0',
                        border: '1px solid #4a5568',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      {selectedEmail.starred ? 'Unstar' : 'Star'}
                    </button>
                    <button
                      onClick={() => {
                        mockInternet.archiveEmail(selectedEmail.id);
                        setEmails(mockInternet.getEmails());
                        setSelectedEmail(null);
                      }}
                      style={{
                        backgroundColor: '#4a5568',
                        color: '#e2e8f0',
                        border: '1px solid #4a5568',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Archive
                    </button>
                    <button
                      onClick={() => {
                        mockInternet.moveEmailToTrash(selectedEmail.id);
                        setEmails(mockInternet.getEmails());
                        setSelectedEmail(null);
                      }}
                      style={{
                        backgroundColor: '#e53e3e',
                        color: '#e2e8f0',
                        border: '1px solid #e53e3e',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ color: '#a0aec0', textAlign: 'center', marginTop: '100px' }}>
                  Select an email to read
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Compose View */
          <div style={{ padding: '16px', width: '100%', height: '100%', backgroundColor: '#2d3748', overflowY: 'auto' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', color: '#e2e8f0' }}>To:</label>
              <input
                type="text"
                value={composeData.to}
                onChange={(e) => setComposeData(prev => ({ ...prev, to: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    const currentValue = e.currentTarget.value.toLowerCase();
                    const suggestion = emailSuggestions.find(email =>
                      email.toLowerCase().startsWith(currentValue)
                    );
                    if (suggestion) {
                      setComposeData(prev => ({ ...prev, to: suggestion }));
                    }
                  }
                }}
                placeholder="recipient@geemail.com"
                list="emailList"
                style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: '#1a202c',
                  border: '1px solid #4a5568',
                  borderRadius: '4px',
                  color: '#e2e8f0',
                  fontFamily: 'monospace'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', color: '#e2e8f0' }}>CC:</label>
              <input
                type="text"
                value={composeData.cc}
                onChange={(e) => setComposeData(prev => ({ ...prev, cc: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    const currentValue = e.currentTarget.value.toLowerCase();
                    const suggestion = emailSuggestions.find(email =>
                      email.toLowerCase().startsWith(currentValue)
                    );
                    if (suggestion) {
                      setComposeData(prev => ({ ...prev, cc: suggestion }));
                    }
                  }
                }}
                placeholder="cc@geemail.com (optional)"
                list="emailList"
                style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: '#1a202c',
                  border: '1px solid #4a5568',
                  borderRadius: '4px',
                  color: '#e2e8f0',
                  fontFamily: 'monospace'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', color: '#e2e8f0' }}>BCC:</label>
              <input
                type="text"
                value={composeData.bcc}
                onChange={(e) => setComposeData(prev => ({ ...prev, bcc: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    const currentValue = e.currentTarget.value.toLowerCase();
                    const suggestion = emailSuggestions.find(email =>
                      email.toLowerCase().startsWith(currentValue)
                    );
                    if (suggestion) {
                      setComposeData(prev => ({ ...prev, bcc: suggestion }));
                    }
                  }
                }}
                placeholder="bcc@geemail.com (optional)"
                list="emailList"
                style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: '#1a202c',
                  border: '1px solid #4a5568',
                  borderRadius: '4px',
                  color: '#e2e8f0',
                  fontFamily: 'monospace'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', color: '#e2e8f0' }}>Subject:</label>
              <input
                type="text"
                value={composeData.subject}
                onChange={(e) => setComposeData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Email subject"
                style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: '#1a202c',
                  border: '1px solid #4a5568',
                  borderRadius: '4px',
                  color: '#e2e8f0',
                  fontFamily: 'monospace'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', color: '#e2e8f0' }}>Message:</label>
              <textarea
                value={composeData.body}
                onChange={(e) => setComposeData(prev => ({ ...prev, body: e.target.value }))}
                placeholder="Type your message here..."
                rows={12}
                style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: '#1a202c',
                  border: '1px solid #4a5568',
                  borderRadius: '4px',
                  color: '#e2e8f0',
                  fontFamily: 'monospace',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setCurrentView('inbox')}
                style={{
                  backgroundColor: '#4a5568',
                  color: '#e2e8f0',
                  border: '1px solid #4a5568',
                  borderRadius: '4px',
                  padding: '8px 16px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleComposeSubmit}
                style={{
                  backgroundColor: '#38a169',
                  color: '#e2e8f0',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px 16px',
                  cursor: 'pointer'
                }}
              >
                Send
              </button>
            </div>
            <datalist id="emailList">
              {emailSuggestions.map(email => (
                <option key={email} value={email} />
              ))}
            </datalist>
          </div>
        )}
      </div>
    </div>
  );
}