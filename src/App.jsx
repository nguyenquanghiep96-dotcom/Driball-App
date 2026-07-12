import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import BottomNav from './components/BottomNav';
import OrdersPage from './pages/OrdersPage';
import CreateOrderPage from './pages/CreateOrderPage';
import OrderDetailPage from './pages/OrderDetailPage';
import ProductsPage from './pages/ProductsPage';
import RevenuePage from './pages/RevenuePage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import { useApp } from './context/AppContext';

function Main() {
  const { user } = useApp();

  if (!user) {
    return <LoginPage />;
  }

  return (
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
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Main />
    </AppProvider>
  );
}
