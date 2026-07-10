import { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { DEFAULT_PRODUCTS, PRINT_PACKAGES, DEFAULT_BRAND_COSTS } from '../utils/constants';
import { generateId, getToday } from '../utils/calculations';
import * as db from '../lib/supabaseService';
import { TextShimmer } from '../components/TextShimmer';

const AppContext = createContext();

const initialState = {
  orders: [],
  products: DEFAULT_PRODUCTS,
  printPackages: PRINT_PACKAGES,
  brandCosts: DEFAULT_BRAND_COSTS,
  operatingCosts: {},
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_STATE':
      return { ...state, ...action.payload };

    case 'ADD_ORDER': {
      const newOrder = { ...action.payload, id: generateId(), createdAt: action.payload.createdAt || getToday() };
      // Async save to Supabase
      db.upsertOrder(newOrder).catch(e => console.error('Failed to save order:', e));
      return {
        ...state,
        orders: [newOrder, ...state.orders],
      };
    }

    case 'UPDATE_ORDER': {
      const updatedOrders = state.orders.map(o =>
        o.id === action.payload.id ? { ...o, ...action.payload } : o
      );
      const updatedOrder = updatedOrders.find(o => o.id === action.payload.id);
      if (updatedOrder) {
        db.upsertOrder(updatedOrder).catch(e => console.error('Failed to update order:', e));
      }
      return { ...state, orders: updatedOrders };
    }

    case 'DELETE_ORDER':
      db.deleteOrder(action.payload).catch(e => console.error('Failed to delete order:', e));
      return {
        ...state,
        orders: state.orders.filter(o => o.id !== action.payload),
      };

    case 'ADD_PRODUCT': {
      const newProduct = { ...action.payload, id: generateId() };
      db.upsertProduct(newProduct).catch(e => console.error('Failed to save product:', e));
      return {
        ...state,
        products: [...state.products, newProduct],
      };
    }

    case 'UPDATE_PRODUCT': {
      const updatedProducts = state.products.map(p =>
        p.id === action.payload.id ? { ...p, ...action.payload } : p
      );
      const updatedProduct = updatedProducts.find(p => p.id === action.payload.id);
      if (updatedProduct) {
        db.upsertProduct(updatedProduct).catch(e => console.error('Failed to update product:', e));
      }
      return { ...state, products: updatedProducts };
    }

    case 'DELETE_PRODUCT':
      db.deleteProduct(action.payload).catch(e => console.error('Failed to delete product:', e));
      return {
        ...state,
        products: state.products.filter(p => p.id !== action.payload),
      };

    case 'ADD_PRINT_PACKAGE':
      return {
        ...state,
        printPackages: [...state.printPackages, { ...action.payload, id: generateId() }],
      };

    case 'UPDATE_PRINT_PACKAGE':
      return {
        ...state,
        printPackages: state.printPackages.map(p =>
          p.id === action.payload.id ? { ...p, ...action.payload } : p
        ),
      };

    case 'DELETE_PRINT_PACKAGE':
      return {
        ...state,
        printPackages: state.printPackages.filter(p => p.id !== action.payload),
      };

    case 'UPDATE_BRAND_COSTS': {
      const updated = action.payload;
      // Sync each to Supabase
      updated.forEach(bc => db.upsertBrandCost(bc).catch(e => console.error('Failed to save brand cost:', e)));
      return { ...state, brandCosts: updated };
    }

    case 'UPDATE_OPERATING_COSTS': {
      const { month, costs } = action.payload;
      db.upsertOperatingCosts(month, costs).catch(e => console.error('Failed to save operating costs:', e));
      return {
        ...state,
        operatingCosts: {
          ...state.operatingCosts,
          [month]: costs,
        },
      };
    }

    case 'LOAD_STATE':
      return { ...initialState, ...action.payload };

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function init() {
      try {
        // Try migration first
        await db.migrateFromLocalStorage();

        // Load all data from Supabase
        const data = await db.loadAllData();

        dispatch({
          type: 'SET_STATE',
          payload: {
            products: data.products.length > 0 ? data.products : DEFAULT_PRODUCTS,
            orders: data.orders || [],
            brandCosts: data.brandCosts.length > 0 ? data.brandCosts : DEFAULT_BRAND_COSTS,
            operatingCosts: data.operatingCosts || {},
          },
        });
      } catch (e) {
        console.error('Failed to load from Supabase:', e);
        setError(e.message);

        // Fallback to localStorage
        try {
          const saved = localStorage.getItem('driball_data');
          if (saved) {
            const localData = JSON.parse(saved);
            dispatch({ type: 'SET_STATE', payload: localData });
          }
        } catch (localErr) {
          console.error('Failed to load from localStorage too:', localErr);
        }
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--color-bg)',
        color: 'var(--color-label-secondary)',
        fontFamily: 'var(--font-family)',
      }}>
        <TextShimmer style={{ fontSize: 24, fontWeight: 600 }}>
          Xin chào!
        </TextShimmer>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--color-bg)',
        color: 'var(--color-label)',
        fontFamily: 'var(--font-family)',
        flexDirection: 'column', gap: 12, padding: 24,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 48 }}>⚠️</div>
        <div style={{ fontSize: 16, fontWeight: 600 }}>Không kết nối được Supabase</div>
        <div style={{ fontSize: 13, color: 'var(--color-label-secondary)', maxWidth: 300 }}>
          {error}
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: 8, padding: '8px 24px',
            background: 'var(--color-blue)', color: '#fff',
            border: 'none', borderRadius: 8,
            fontFamily: 'var(--font-family)', fontSize: 14, fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
