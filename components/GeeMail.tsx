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
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([]);

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
        read: false,
        starred: false,
        labels: ['inbox'],
        threadId: 'welcome'
      };
      mockInternet.addEmail(welcomeEmail);
      setEmails(mockInternet.getEmails());
    }
  }, [mockInternet, setupData]);

  // Filter emails based on current view and search
  React.useEffect(() => {
    let filtered = emails;
    if (currentView !== 'compose') {
      if (currentView === 'starred') {
        filtered = emails.filter(email => email.starred);
      } else {
        filtered = mockInternet.getEmailsByLabel(currentView);
      }
      if (searchQuery) {
        const playerEmail = `${setupData?.playerName || 'user'}@geemail.com`;
        filtered = mockInternet.searchEmails(searchQuery, playerEmail).filter(email =>
          filtered.some(f => f.id === email.id)
        );
      }
    }
    setFilteredEmails(filtered);
  }, [emails, currentView, searchQuery, mockInternet, setupData]);

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

  const handleComposeSubmit = useCallback(() => {
    if (!composeData.to || !composeData.subject || !composeData.body) return;

    const senderEmail = `${setupData?.playerName || 'user'}@geemail.com`;
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