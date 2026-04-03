"use client";

import React, { useState, useCallback } from 'react';
import { MockInternet, Email } from '../lib/internet';

interface GameSetup {
  playerName: string;
  computerName: string;
  rootPassword: string;
  userPassword: string;
  createdAt: string;
}

interface GeeMailProps {
  onClose: () => void;
  setupData: GameSetup | null;
  mockInternet: MockInternet;
}

export default function GeeMail({ onClose, setupData, mockInternet }: GeeMailProps) {
  const [currentView, setCurrentView] = useState<'inbox' | 'compose'>('inbox');
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [composeData, setComposeData] = useState({
    to: '',
    subject: '',
    body: ''
  });
  const [windowPosition, setWindowPosition] = useState({ x: 100, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Load emails from mock internet and initialize account
  React.useEffect(() => {
    if (!setupData?.playerName) return;

    const playerEmail = `${setupData.playerName}@geemail.com`;

    // Create account if it doesn't exist
    if (!mockInternet.getEmailAccount(playerEmail)) {
      mockInternet.createEmailAccount({
        email: playerEmail,
        password: setupData.userPassword, // Use the user's login password
        displayName: setupData.playerName,
        createdAt: new Date().toISOString()
      });
    }

    const currentEmails = mockInternet.getEmails();
    setEmails(currentEmails);

    // Create welcome email if no emails exist for this user
    if (currentEmails.length === 0) {
      const welcomeEmail: Email = {
        id: 'welcome',
        from: 'admin@geemail.com',
        to: playerEmail,
        subject: 'Welcome to GeeMail!',
        body: 'Welcome to your virtual email service. This is a simulated email system within the game.\n\nYou can now send emails to other players and explore the virtual internet.\n\nHappy hacking!',
        timestamp: new Date().toISOString(),
        read: false
      };
      mockInternet.addEmail(welcomeEmail);
      setEmails(mockInternet.getEmails());
    }
  }, [mockInternet, setupData]);

  const handleComposeSubmit = useCallback(() => {
    if (!composeData.to || !composeData.subject || !composeData.body) return;

    const newEmail: Email = {
      id: Date.now().toString(),
      from: `${setupData?.playerName || 'user'}@geemail.com`,
      to: composeData.to,
      subject: composeData.subject,
      body: composeData.body,
      timestamp: new Date().toISOString(),
      read: true
    };

    mockInternet.addEmail(newEmail);
    setEmails(mockInternet.getEmails());
    setComposeData({ to: '', subject: '', body: '' });
    setCurrentView('inbox');
  }, [composeData, setupData, mockInternet]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - windowPosition.x,
      y: e.clientY - windowPosition.y
    });
  }, [windowPosition]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    setWindowPosition({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y
    });
  }, [isDragging, dragOffset]);

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

  return (
    <div
      style={{
        position: 'fixed',
        left: windowPosition.x,
        top: windowPosition.y,
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
            GeeMail - {currentView === 'inbox' ? 'Inbox' : 'Compose'}
          </span>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{
        backgroundColor: '#2d3748',
        padding: '8px 12px',
        borderBottom: '1px solid #4a5568',
        display: 'flex',
        gap: '8px'
      }}>
        <button
          onClick={() => setCurrentView('inbox')}
          style={{
            backgroundColor: currentView === 'inbox' ? '#4a5568' : '#1a202c',
            color: '#e2e8f0',
            border: '1px solid #4a5568',
            borderRadius: '4px',
            padding: '4px 12px',
            cursor: 'pointer'
          }}
        >
          Inbox ({emails.length})
        </button>
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
              {emails.map(email => (
                <div
                  key={email.id}
                  onClick={() => setSelectedEmail(email)}
                  style={{
                    padding: '12px',
                    borderBottom: '1px solid #2d3748',
                    cursor: 'pointer',
                    backgroundColor: selectedEmail?.id === email.id ? '#2d3748' : 'transparent',
                    fontWeight: email.read ? 'normal' : 'bold'
                  }}
                >
                  <div style={{ fontSize: '14px', marginBottom: '4px' }}>{email.from}</div>
                  <div style={{ fontSize: '12px', color: '#a0aec0', marginBottom: '4px' }}>{email.subject}</div>
                  <div style={{ fontSize: '11px', color: '#718096' }}>
                    {new Date(email.timestamp).toLocaleString()}
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
                    <div style={{ color: '#a0aec0', fontSize: '12px' }}>
                      {new Date(selectedEmail.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                    {selectedEmail.body}
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
          <div style={{ padding: '16px', width: '100%', backgroundColor: '#2d3748' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', color: '#e2e8f0' }}>To:</label>
              <input
                type="text"
                value={composeData.to}
                onChange={(e) => setComposeData(prev => ({ ...prev, to: e.target.value }))}
                placeholder="recipient@geemail.com"
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
          </div>
        )}
      </div>
    </div>
  );
}