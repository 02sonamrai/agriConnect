import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import FarmerLayout from './layouts/FarmerLayout';
import BuyerLayout from './layouts/BuyerLayout';
import MiddlemanLayout from './layouts/MiddlemanLayout';

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

// Middleman / Field Coordinator Pages
import MiddlemanDashboard from './pages/MiddlemanDashboard';
import CollectedFarmers from './pages/CollectedFarmers';
import AddFarmer from './pages/AddFarmer';
import EditFarmer from './pages/EditFarmer';

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
