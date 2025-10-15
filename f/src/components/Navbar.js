import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaBars, FaTimes, FaUser, FaSignOutAlt, FaUserShield } from 'react-icons/fa';
import Logo from './Logo';
import './Navbar.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();


  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
      <Link to="/" className="navbar-brand">
        <Logo size={95} showText={false} />
        <span className="brand-text">THE JAMALPUR CHAMBER OF COMMERCE AND INDUSTRY</span>
      </Link>

          <div className={`navbar-menu ${isMenuOpen ? 'active' : ''}`}>
            <Link to="/" className="navbar-link" onClick={() => setIsMenuOpen(false)}>
              Home
            </Link>
            <Link to="/about" className="navbar-link" onClick={() => setIsMenuOpen(false)}>
              About
            </Link>
            <Link to="/notice" className="navbar-link" onClick={() => setIsMenuOpen(false)}>
              Notice
            </Link>
            
            {user ? (
              <div className="navbar-user">
                <Link to="/form" className="navbar-link" onClick={() => setIsMenuOpen(false)}>
                  Form
                </Link>
                {isAdmin() && (
                  <Link to="/admin" className="navbar-link admin-link" onClick={() => setIsMenuOpen(false)}>
                    <FaUserShield /> Admin
                  </Link>
                )}
                <div className="user-menu">
                  <span className="user-name">
                    <FaUser /> {user.name}
                    {isAdmin() && <span className="admin-badge">Admin</span>}
                  </span>
                  <button onClick={handleLogout} className="logout-btn">
                    <FaSignOutAlt /> Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="navbar-auth">
                <Link to="/login" className="btn btn-outline" onClick={() => setIsMenuOpen(false)}>
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary" onClick={() => setIsMenuOpen(false)}>
                  Register
                </Link>
              </div>
            )}
          </div>

          <button className="navbar-toggle" onClick={toggleMenu}>
            {isMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
