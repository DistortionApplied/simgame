import React, { useState, useEffect, useCallback } from 'react';
import { getBankAccountKey, getFromStorage, setInStorage } from '../lib/storage';

interface GameSetup {
  playerName: string;
  computerName: string;
  rootPassword: string;
  userPassword: string;
  createdAt: string;
}

interface BankAccount {
  accountNumber: string;
  balance: number;
  transactions: Transaction[];
  createdAt: string;
}

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'transfer';
  amount: number;
  description: string;
  timestamp: string;
}

interface ChasteBankProps {
  setupData: GameSetup | null;
}

// Utility functions for other game systems to manage player money
export const bankUtils = {
  addMoney: (playerName: string, amount: number, description: string) => {
    try {
      const storageKey = `bank-account-${playerName}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const account = JSON.parse(stored);
        const transactionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const transaction = {
          id: transactionId,
          type: 'deposit',
          amount,
          description,
          timestamp: new Date().toISOString()
        };
        account.balance += amount;
        account.transactions = [transaction, ...account.transactions];
        localStorage.setItem(storageKey, JSON.stringify(account));
        return true;
      }
    } catch (error) {
      console.error('Failed to add money to bank account:', error);
    }
    return false;
  },

  spendMoney: (playerName: string, amount: number, description: string) => {
    try {
      const storageKey = `bank-account-${playerName}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const account = JSON.parse(stored);
        if (account.balance >= amount) {
          const transactionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const transaction = {
            id: transactionId,
            type: 'withdrawal',
            amount,
            description,
            timestamp: new Date().toISOString()
          };
          account.balance -= amount;
          account.transactions = [transaction, ...account.transactions];
          localStorage.setItem(storageKey, JSON.stringify(account));
          return true;
        }
      }
    } catch (error) {
      console.error('Failed to spend money from bank account:', error);
    }
    return false;
  },

  getBalance: (playerName: string) => {
    try {
      const storageKey = `bank-account-${playerName}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const account = JSON.parse(stored);
        return account.balance || 0;
      }
    } catch (error) {
      console.error('Failed to get bank balance:', error);
    }
    return 0;
  }
};

export default function ChasteBank({ setupData }: ChasteBankProps) {
  const [account, setAccount] = useState<BankAccount | null>(() => {
    const storageKey = getBankAccountKey(setupData?.playerName || 'user');
    return getFromStorage<BankAccount | null>(storageKey, null);
  });
  const [showCreateAccount, setShowCreateAccount] = useState(() => {
    const storageKey = getBankAccountKey(setupData?.playerName || 'user');
    return !getFromStorage<BankAccount | null>(storageKey, null);
  });

  const generateTransactionId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const saveAccount = (accountData: BankAccount) => {
    const storageKey = getBankAccountKey(setupData?.playerName || 'user');
    if (setInStorage(storageKey, accountData)) {
      setAccount(accountData);
    }
  };

  const createAccount = () => {
    if (!setupData) return;

    const newAccount: BankAccount = {
      accountNumber: generateAccountNumber(),
      balance: 420, // Starting balance
      transactions: [{
        id: generateTransactionId(),
        type: 'deposit',
        amount: 420,
        description: 'Welcome bonus - Account opening',
        timestamp: new Date().toISOString()
      }],
      createdAt: new Date().toISOString()
    };

    saveAccount(newAccount);
    setShowCreateAccount(false);
  };

  const generateAccountNumber = () => {
    return 'CB' + Math.random().toString().substr(2, 10);
  };

  const addTransaction = (type: 'deposit' | 'withdrawal' | 'transfer', amount: number, description: string) => {
    if (!account) return;

    const transaction: Transaction = {
      id: generateTransactionId(),
      type,
      amount,
      description,
      timestamp: new Date().toISOString()
    };

    const updatedAccount = {
      ...account,
      balance: type === 'deposit' ? account.balance + amount :
               type === 'withdrawal' ? account.balance - amount :
               account.balance - amount, // transfer out
      transactions: [transaction, ...account.transactions]
    };

    saveAccount(updatedAccount);
  };

  // Functions for automatic transactions (called by other game systems)
  const addMoney = (amount: number, description: string) => {
    if (!account) return;
    addTransaction('deposit', amount, description);
  };

  const spendMoney = (amount: number, description: string) => {
    if (!account || amount > account.balance) return false;
    addTransaction('withdrawal', amount, description);
    return true;
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
          {account.transactions.length === 0 ? (
            <p>No transactions yet.</p>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
}