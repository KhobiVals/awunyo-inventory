import { useState, useCallback } from 'react';

export const usePOS = (initialProducts, initialSales) => {
  const [products, setProducts] = useState(initialProducts);
  const [sales,    setSales]    = useState(initialSales);
  const [cart,     setCart]     = useState([]);

  const addToCart = useCallback((product, notify) => {
    if (product.stock === 0) {
      if (notify) notify('This product is out of stock.', 'error');
      return;
    }
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        // Don't exceed available stock
        if (existing.qty >= product.stock) {
          if (notify) notify(`Only ${product.stock} in stock.`, 'error');
          return prev;
        }
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCart(prev => prev.filter(i => i.id !== productId));
  }, []);

  const updateCartQty = useCallback((productId, qty) => {
    if (qty <= 0) {
      setCart(prev => prev.filter(i => i.id !== productId));
    } else {
      setCart(prev => prev.map(i => i.id === productId ? { ...i, qty } : i));
    }
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  return {
    products,
    setProducts,
    sales,
    setSales,
    cart,
    setCart,
    addToCart,
    removeFromCart,
    updateCartQty,
    clearCart,
  };
};
