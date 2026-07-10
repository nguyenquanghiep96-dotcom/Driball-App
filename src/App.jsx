import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import BottomNav from './components/BottomNav';
import OrdersPage from './pages/OrdersPage';
import CreateOrderPage from './pages/CreateOrderPage';
import OrderDetailPage from './pages/OrderDetailPage';
import ProductsPage from './pages/ProductsPage';
import RevenuePage from './pages/RevenuePage';

function usePullToRefresh() {
  useEffect(() => {
    let startY = 0;
    
    const handleTouchStart = (e) => {
      const scrollable = document.querySelector('.app-main');
      if (scrollable && scrollable.scrollTop <= 0) {
        startY = e.touches[0].clientY;
      } else {
        startY = 0;
      }
    };

    const handleTouchEnd = (e) => {
      const scrollable = document.querySelector('.app-main');
      if (scrollable && scrollable.scrollTop <= 0 && startY > 0) {
        const endY = e.changedTouches[0].clientY;
        if (endY - startY > 150) {
          window.location.reload();
        }
      }
      startY = 0;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);
}

export default function App() {
  usePullToRefresh();
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="app-layout">
          <BottomNav />
          <div className="app-main">
            <Routes>
              <Route path="/" element={<OrdersPage />} />
              <Route path="/create" element={<CreateOrderPage />} />
              <Route path="/order/:id" element={<OrderDetailPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/revenue" element={<RevenuePage />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}
