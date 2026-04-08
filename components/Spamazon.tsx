import React, { useState, useEffect, useCallback } from 'react';
import { bankUtils } from './ChasteBank';

interface GameSetup {
  playerName: string;
  computerName: string;
  rootPassword: string;
  userPassword: string;
  createdAt: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface SpamazonProps {
  setupData: GameSetup | null;
}

const products: Product[] = [
  { id: '1', name: 'Virtual Hacking Tool', price: 50, description: 'Enhance your terminal capabilities' },
  { id: '2', name: 'Game Upgrade Pack', price: 25, description: 'Unlock new game features' },
  { id: '3', name: 'Digital Art Collection', price: 15, description: 'Beautiful simulated artwork' },
  { id: '4', name: 'Software Package', price: 30, description: 'Additional tools for your system' },
];

export default function Spamazon({ setupData }: SpamazonProps) {
  const [showCart, setShowCart] = useState(false);
  const [purchaseMessage, setPurchaseMessage] = useState<string | null>(null);
  const playerName = setupData?.playerName || 'user';

  const [cart, setCart] = useState<CartItem[]>(() => {
    const storedCart = localStorage.getItem(`spamazon-cart-${playerName}`);
    return storedCart ? JSON.parse(storedCart) : [];
  });

  const saveCart = (newCart: CartItem[]) => {
    localStorage.setItem(`spamazon-cart-${playerName}`, JSON.stringify(newCart));
    setCart(newCart);
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    if (existingItem) {
      const updatedCart = cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
      saveCart(updatedCart);
    } else {
      saveCart([...cart, { product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId: string) => {
    const updatedCart = cart.filter(item => item.product.id !== productId);
    saveCart(updatedCart);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    const updatedCart = cart.map(item =>
      item.product.id === productId
        ? { ...item, quantity }
        : item
    );
    saveCart(updatedCart);
  };

  const getTotal = () => {
    return cart.reduce((total, item) => total + item.product.price * item.quantity, 0);
  };

  const checkout = () => {
    const total = getTotal();
    const balance = bankUtils.getBalance(playerName);
    if (balance >= total) {
      bankUtils.spendMoney(playerName, total, `Purchase from Spamazon - ${cart.length} items`);
      setCart([]);
      localStorage.removeItem(`spamazon-cart-${playerName}`);
      setPurchaseMessage(`Purchase successful! $${total.toFixed(2)} deducted from your account.`);
      setTimeout(() => setPurchaseMessage(null), 5000);
    } else {
      setPurchaseMessage('Insufficient funds. Please check your bank balance.');
      setTimeout(() => setPurchaseMessage(null), 5000);
    }
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', margin: 0, backgroundColor: '#EAEDED', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#232F3E', padding: '10px 20px', color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FF9900', marginRight: '20px' }}>Spamazon</div>
          <div style={{ flex: 1, maxWidth: '600px' }}>
            <input type="text" placeholder="Search Spamazon" style={{ width: '100%', padding: '8px', border: 'none', borderRadius: '4px 0 0 4px', height: '38px' }} />
            <button style={{ backgroundColor: '#FF9900', border: 'none', padding: '8px 12px', borderRadius: '0 4px 4px 0', height: '38px', cursor: 'pointer' }}>Search</button>
          </div>
          <div style={{ marginLeft: '20px' }}>
            <a href="#" style={{ color: 'white', textDecoration: 'none' }}>Hello, Sign in Account & Lists</a>
          </div>
          <div style={{ marginLeft: '20px' }}>
            <button onClick={() => setShowCart(!showCart)} style={{ color: 'white', background: 'none', border: 'none', textDecoration: 'none', cursor: 'pointer' }}>
              🛒 Cart ({cart.reduce((total, item) => total + item.quantity, 0)})
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ backgroundColor: '#37475A', padding: '8px 20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex' }}>
          <a href="#" style={{ color: 'white', textDecoration: 'none', marginRight: '20px' }}>All</a>
          <a href="#" style={{ color: 'white', textDecoration: 'none', marginRight: '20px' }}>Today&apos;s Deals</a>
          <a href="#" style={{ color: 'white', textDecoration: 'none', marginRight: '20px' }}>Customer Service</a>
          <a href="#" style={{ color: 'white', textDecoration: 'none', marginRight: '20px' }}>Registry</a>
          <a href="#" style={{ color: 'white', textDecoration: 'none', marginRight: '20px' }}>Gift Cards</a>
          <a href="#" style={{ color: 'white', textDecoration: 'none', marginRight: '20px' }}>Sell</a>
        </div>
      </div>

      {/* Purchase Message */}
      {purchaseMessage && (
        <div style={{ backgroundColor: purchaseMessage.includes('successful') ? '#d4edda' : '#f8d7da', color: purchaseMessage.includes('successful') ? '#155724' : '#721c24', padding: '10px', textAlign: 'center', border: `1px solid ${purchaseMessage.includes('successful') ? '#c3e6cb' : '#f5c6cb'}` }}>
          {purchaseMessage}
        </div>
      )}

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '20px auto', padding: '0 20px' }}>
        {showCart ? (
          <div>
            <h2>Shopping Cart</h2>
            {cart.length === 0 ? (
              <p>Your cart is empty.</p>
            ) : (
              <div>
                {cart.map(item => (
                  <div key={item.product.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ddd', padding: '10px 0' }}>
                    <div>
                      <h3>{item.product.name}</h3>
                      <p>{item.product.description}</p>
                      <p>${item.product.price.toFixed(2)} each</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} style={{ padding: '5px 10px', marginRight: '10px' }}>-</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} style={{ padding: '5px 10px', marginLeft: '10px' }}>+</button>
                      <button onClick={() => removeFromCart(item.product.id)} style={{ marginLeft: '20px', backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Remove</button>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: '20px', textAlign: 'right' }}>
                  <h3>Total: ${getTotal().toFixed(2)}</h3>
                  <button onClick={checkout} style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer' }}>Checkout</button>
                </div>
              </div>
            )}
            <button onClick={() => setShowCart(false)} style={{ marginTop: '20px', backgroundColor: '#6c757d', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer' }}>Back to Shopping</button>
          </div>
        ) : (
          <div>
            <h2>Featured Products</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
              {products.map(product => (
                <div key={product.id} style={{ background: 'white', border: '1px solid #DDD', borderRadius: '4px', padding: '20px', textAlign: 'center' }}>
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                  <p style={{ color: '#B12704', fontWeight: 'bold', fontSize: '18px' }}>${product.price.toFixed(2)}</p>
                  <button onClick={() => addToCart(product)} style={{ backgroundColor: '#FF9900', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer' }}>Add to Cart</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ backgroundColor: '#232F3E', color: 'white', padding: '20px', textAlign: 'center', marginTop: '40px' }}>
        <p>&copy; 2026 Spamazon. All rights reserved. | <a href="#" style={{ color: '#FF9900', textDecoration: 'none' }}>Privacy Policy</a> | <a href="#" style={{ color: '#FF9900', textDecoration: 'none' }}>Terms of Service</a></p>
      </div>
    </div>
  );
}