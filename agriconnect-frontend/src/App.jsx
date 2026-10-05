import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import FarmerLayout from './layouts/FarmerLayout';
import BuyerLayout from './layouts/BuyerLayout';
import MiddlemanLayout from './layouts/MiddlemanLayout';
import AdminLayout from './layouts/AdminLayout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import FarmerDashboard from './pages/FarmerDashboard';
import MyCrops from './pages/MyCrops';
import AddCrop from './pages/AddCrop';
import EditCrop from './pages/EditCrop';
import CropDetails from './pages/CropDetails';
import Marketplace from './pages/Marketplace';
import MarketplaceCropDetails from './pages/MarketplaceCropDetails';
import Cart from './pages/Cart';
import MyOrders from './pages/MyOrders';
import OrderDetails from './pages/OrderDetails';
import FarmerOrders from './pages/FarmerOrders';
import Profile from './pages/Profile';

// Middleman / Field Coordinator Pages
import MiddlemanDashboard from './pages/MiddlemanDashboard';
import CollectedFarmers from './pages/CollectedFarmers';
import AddFarmer from './pages/AddFarmer';
import EditFarmer from './pages/EditFarmer';
import CoordinatorOrders from './pages/CoordinatorOrders';
import AdminDashboard from './pages/AdminDashboard';
import AdminUserDetails from './pages/AdminUserDetails';
import AdminCropDetails from './pages/AdminCropDetails';
import AdminMarketPrices from './pages/AdminMarketPrices';
import MarketPrices from './pages/MarketPrices';
import Notifications from './pages/Notifications';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users/:id" element={<AdminUserDetails />} />
            <Route path="crops/:id" element={<AdminCropDetails />} />
            <Route path="market-prices" element={<AdminMarketPrices />} />
          </Route>

          {/* Protected Farmer Routes */}
          <Route
            path="/farmer"
            element={
              <ProtectedRoute allowedRoles={['ROLE_FARMER']}>
                <FarmerLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<FarmerDashboard />} />
            <Route path="crops" element={<MyCrops />} />
            <Route path="crops/add" element={<AddCrop />} />
            <Route path="crops/edit/:id" element={<EditCrop />} />
            <Route path="crops/:id" element={<CropDetails />} />
            <Route path="orders" element={<FarmerOrders />} />
            <Route path="market-prices" element={<MarketPrices />} />
          </Route>

          {/* Protected Buyer Routes */}
          <Route
            path="/marketplace"
            element={
              <ProtectedRoute allowedRoles={['ROLE_BUYER', 'ROLE_FARMER']}>
                <BuyerLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Marketplace />} />
            <Route path="crops/:id" element={<MarketplaceCropDetails />} />
            <Route path="cart" element={<Cart />} />
            <Route path="orders" element={<MyOrders />} />
            <Route path="orders/:id" element={<OrderDetails />} />
            <Route path="profile" element={<Profile />} />
            <Route path="market-prices" element={<MarketPrices />} />
          </Route>

          {/* Protected Middleman / Field Coordinator Routes */}
          <Route
            path="/middleman"
            element={
              <ProtectedRoute allowedRoles={['ROLE_MIDDLEMAN', 'ROLE_ADMIN']}>
                <MiddlemanLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<MiddlemanDashboard />} />
            <Route path="farmers" element={<CollectedFarmers />} />
            <Route path="farmers/add" element={<AddFarmer />} />
            <Route path="farmers/edit/:id" element={<EditFarmer />} />
            <Route path="orders" element={<CoordinatorOrders />} />
          </Route>

          {/* Notification history. Deliberately outside every role layout: it is its own page
              with a Back link, so the sidebar bell has somewhere to lead. Open to all four
              roles because the backend scopes the content to the signed-in account anyway. */}
          <Route
            path="/notifications"
            element={
              <ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_FARMER', 'ROLE_BUYER', 'ROLE_MIDDLEMAN']}>
                <Notifications />
              </ProtectedRoute>
            }
          />

          {/* Root Redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
