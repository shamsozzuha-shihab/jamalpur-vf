import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NoticeProvider } from './contexts/NoticeContext';
import { SocketProvider } from './contexts/SocketContext';
import { GalleryProvider } from './contexts/GalleryContext';
import { NewsProvider } from './contexts/NewsContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import './App.css';

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Notice = lazy(() => import('./pages/Notice'));
const Login = lazy(() => import('./pages/Login'));
const Registration = lazy(() => import('./pages/Registration'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const FormPage = lazy(() => import('./pages/FormPage'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const AdminSettings = lazy(() => import('./pages/AdminSettings'));

// Loading component
const PageLoader = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    flexDirection: 'column',
    gap: '1rem'
  }}>
    <div style={{
      width: '50px',
      height: '50px',
      border: '4px solid #f3f3f3',
      borderTop: '4px solid #d4af37',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }}></div>
    <p style={{color: '#666', fontSize: '1rem', fontWeight: 500}}>Loading...</p>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <NoticeProvider>
          <GalleryProvider>
            <NewsProvider>
              <Router>
          <div className="App">
            <Navbar />
            <main className="main-content">
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/notice" element={<Notice />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Registration />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password/:token" element={<ResetPassword />} />
                  <Route
                    path="/form"
                    element={
                      <ProtectedRoute>
                        <FormPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <AdminRoute>
                        <AdminPanel />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/admin/settings"
                    element={
                      <AdminRoute>
                        <AdminSettings />
                      </AdminRoute>
                    }
                  />
                </Routes>
              </Suspense>
            </main>
            <Footer />
          </div>
              </Router>
            </NewsProvider>
          </GalleryProvider>
        </NoticeProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
