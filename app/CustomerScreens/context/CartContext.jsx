import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [menu,setMenu] = useState([]);

  useEffect(() => {
   const fetchMenu = async () => {
    const m = await AsyncStorage.getItem('storeMenu');
    setMenu(m);
   }

   fetchMenu();
  },[menu])

  const addToCart = (item) => {
    setCartItems(prevItems => {
      // Check if item already exists in the cart
      const existingItem = prevItems.find(i => i._id === item._id);

      if (existingItem) {
        // Increment quantity for existing item
        return prevItems.map(i =>
          i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }

      // Add new item to the cart with initial quantity
      return [...prevItems, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId) => {
    setCartItems(prevItems =>
      prevItems.filter(item => item._id !== itemId)
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(item._id);
      return;
    }
    setCartItems(prevItems =>
      prevItems.map(item =>
        item._id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  // Function to increase quantity
  const increaseQuantity = (itemId) => {
    setCartItems(prevItems =>
      prevItems.map(item =>
        item._id === itemId ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  // Function to decrease quantity
  const decreaseQuantity = (itemId) => {
   setCartItems(prevItems =>
    prevItems.map(item =>
      item._id === itemId ? { ...item, quantity: item.quantity - 1 } : item
    )
  );
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      increaseQuantity,
      decreaseQuantity,
      clearCart,
      cartCount: cartItems.reduce((sum, item) => sum + item.quantity, 0)
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
