import React, { useState, useEffect, useCallback } from 'react';
import { MockInternet, BankAccount, BankTransaction } from '../lib/internet';

interface GameSetup {
  playerName: string;
  computerName: string;
  rootPassword: string;
  userPassword: string;
  createdAt: string;
}

interface ChasteBankProps {
  setupData: GameSetup | null;
  mockInternet: MockInternet;
}

// Utility functions for other game systems to manage player money
export const bankUtils = {
  addMoney: (mockInternet: MockInternet, amount: number, description: string) => {
    try {
      return mockInternet.addBankTransaction('deposit', amount, description);
    } catch (error) {
      console.error('Failed to add money to bank account:', error);
      return false;
    }
  },

  spendMoney: (mockInternet: MockInternet, amount: number, description: string) => {
    try {
      return mockInternet.addBankTransaction('withdrawal', amount, description);
    } catch (error) {
      console.error('Failed to spend money from bank account:', error);
      return false;
    }
  },

  getBalance: (mockInternet: MockInternet) => {
    try {
      return mockInternet.getBankBalance();
    } catch (error) {
      console.error('Failed to get bank balance:', error);
      return 0;
    }
  }
};

export default function ChasteBank({ setupData, mockInternet }: ChasteBankProps) {
  const [account, setAccount] = useState<BankAccount | null>(() => mockInternet.getBankAccount());
  const [showCreateAccount, setShowCreateAccount] = useState(() => !mockInternet.getBankAccount());

  const createAccount = () => {
    if (!setupData) return;
    const newAccount = mockInternet.createBankAccount();
    setAccount(newAccount);
    setShowCreateAccount(false);
  };

  // Functions for automatic transactions (called by other game systems)
  const addMoney = (amount: number, description: string) => {
    if (!account) return;
    mockInternet.addBankTransaction('deposit', amount, description);
    setAccount(mockInternet.getBankAccount()); // Refresh state
  };

  const spendMoney = (amount: number, description: string) => {
    if (!account || amount > account.balance) return false;
    const success = mockInternet.addBankTransaction('withdrawal', amount, description);
    if (success) {
      setAccount(mockInternet.getBankAccount()); // Refresh state
    }
    return success;
  };

  if (showCreateAccount) {
    return (
      <div style={{
        fontFamily: 'Arial, sans-serif',
        margin: '0',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        color: '#212529',
        height: '100%',
        overflowY: 'auto'
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{
            backgroundColor: '#ffffff',
            border: '2px solid #007bff',
            borderRadius: '10px',
            padding: '30px',
            textAlign: 'center'
          }}>
            <h1 style={{ color: '#007bff', marginBottom: '20px' }}>Chaste Bank</h1>
            <h2 style={{ color: '#495057', marginBottom: '20px' }}>Open Your Account</h2>
            <p style={{ marginBottom: '30px', color: '#6c757d' }}>
              Welcome to Chaste Bank! Opening an account gives you $420 to start your journey.
            </p>
            <button
              onClick={createAccount}
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                padding: '12px 24px',
                fontSize: '16px',
                cursor: 'pointer',
                marginTop: '20px'
              }}
            >
              Open Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!account) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      margin: '0',
      padding: '20px',
      backgroundColor: '#f8f9fa',
      color: '#212529',
      height: '100%',
      overflowY: 'auto'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '2px solid #007bff',
          borderRadius: '10px',
          padding: '20px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <h1 style={{ color: '#007bff', margin: '0' }}>Chaste Bank</h1>
          <p style={{ color: '#6c757d', margin: '5px 0 0 0' }}>Secure Banking in the Digital Age</p>
        </div>

        {/* Account Info */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #dee2e6',
          borderRadius: '5px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h2 style={{ marginTop: '0', color: '#495057' }}>Account Information</h2>
          <p><strong>Account Number:</strong> {account.accountNumber}</p>
          <p><strong>Current Balance:</strong> ${account.balance.toFixed(2)}</p>
          <p><strong>Account Created:</strong> {new Date(account.createdAt).toLocaleDateString()}</p>
        </div>

        {/* Account Information */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #dee2e6',
          borderRadius: '5px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h2 style={{ marginTop: '0', color: '#495057' }}>Account Overview</h2>
          <p style={{ fontSize: '16px', color: '#6c757d', marginBottom: '15px' }}>
            Your account balance is automatically updated when you earn money from gameplay activities or make purchases online.
          </p>
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '15px',
            borderRadius: '5px',
            border: '1px solid #dee2e6'
          }}>
            <strong style={{ fontSize: '18px', color: '#28a745' }}>
              Current Balance: ${account.balance.toFixed(2)}
            </strong>
          </div>
        </div>

        {/* Transaction History */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #dee2e6',
          borderRadius: '5px',
          padding: '20px'
        }}>
          <h2 style={{ marginTop: '0', color: '#495057' }}>Transaction History</h2>
          {account && account.transactions.length === 0 ? (
            <p>No transactions yet.</p>
          ) : account ? (
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {account.transactions.map((transaction) => (
                <div key={transaction.id} style={{
                  borderBottom: '1px solid #dee2e6',
                  padding: '10px 0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{transaction.description}</div>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>
                      {new Date(transaction.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div style={{
                    color: transaction.type === 'deposit' ? '#28a745' :
                           transaction.type === 'withdrawal' ? '#dc3545' : '#ffc107',
                    fontWeight: 'bold'
                  }}>
                    {transaction.type === 'deposit' ? '+' : '-'}${transaction.amount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>Loading transactions...</p>
          )}
        </div>
      </div>
    </div>
  );
}