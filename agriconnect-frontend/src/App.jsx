import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import FarmerLayout from './layouts/FarmerLayout';
import BuyerLayout from './layouts/BuyerLayout';

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

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Farmer Routes */}
          <Route
            path="/farmer"
            element={
              <ProtectedRoute>
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
          </Route>

          {/* Root Redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
