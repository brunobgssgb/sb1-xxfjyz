import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout/Layout';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { Customers } from './pages/Customers/Customers';
import { Apps } from './pages/Apps/Apps';
import { RechargeCodes } from './pages/RechargeCodes/RechargeCodes';
import { Orders } from './pages/Orders/Orders';
import { SystemUsers } from './pages/Admin/Users/SystemUsers';
import { Profile } from './pages/Profile/Profile';
import { Login } from './pages/Auth/Login';
import { Register } from './pages/Auth/Register';
import { PasswordRecovery } from './pages/Auth/PasswordRecovery';
import { PrivateRoute } from './components/PrivateRoute';
import { useAuthStore } from './store/useAuthStore';

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/" replace /> : <Login />
        } />
        <Route path="/register" element={
          isAuthenticated ? <Navigate to="/" replace /> : <Register />
        } />
        <Route path="/recuperar-senha" element={
          isAuthenticated ? <Navigate to="/" replace /> : <PasswordRecovery />
        } />
        
        <Route path="/" element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="perfil" element={<Profile />} />
          <Route path="clientes" element={<Customers />} />
          <Route path="aplicativos" element={<Apps />} />
          <Route path="codigos" element={<RechargeCodes />} />
          <Route path="pedidos" element={<Orders />} />
          
          {/* Rotas administrativas */}
          <Route path="admin">
            <Route path="usuarios" element={
              <PrivateRoute requireAdmin>
                <SystemUsers />
              </PrivateRoute>
            } />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;