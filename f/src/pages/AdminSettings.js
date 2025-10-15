import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import { validatePassword } from '../utils/validation';
import { 
  FaUser, 
  FaLock, 
  FaSave, 
  FaEye, 
  FaEyeSlash, 
  FaUserShield,
  FaExclamationTriangle,
  FaCheckCircle,
  FaArrowLeft
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import './AdminSettings.css';

const AdminSettings = () => {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Profile form data
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });
  
  // Password form data
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Redirect if not admin
  if (!isAdmin()) {
    return (
      <div className="admin-settings">
        <div className="access-denied">
          <FaUserShield className="access-denied-icon" />
          <h2>Access Denied</h2>
          <p>You need administrator privileges to access this page.</p>
          <Link to="/" className="btn btn-primary">
            <FaArrowLeft />
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords({
      ...showPasswords,
      [field]: !showPasswords[field]
    });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Update profile via API
      const response = await apiService.updateProfile(profileData);
      
      if (response.success) {
        // Update current user session
        const updatedUser = { ...user, name: profileData.name, email: profileData.email };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        setSuccess('Profile updated successfully!');
      } else {
        throw new Error(response.message || 'Failed to update profile');
      }
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validation
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        throw new Error('New passwords do not match.');
      }
      
      // Validate password strength
      const validation = validatePassword(passwordData.newPassword);
      if (!validation.isValid) {
        throw new Error('New password must be at least 8 characters with uppercase, lowercase, and numbers.');
      }
      
      // Call backend API to change password
      await apiService.changePassword(passwordData.currentPassword, passwordData.newPassword);
      
      setSuccess('Password changed successfully! You can now use your new password to login.');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.message || 'Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-settings">
      <div className="settings-header">
        <div className="settings-title">
          <FaUserShield className="settings-icon" />
          <h1>Admin Settings</h1>
        </div>
        <Link to="/admin" className="btn btn-secondary">
          <FaArrowLeft />
          Back to Admin Panel
        </Link>
      </div>

      <div className="settings-content">
        <div className="settings-tabs">
          <button 
            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <FaUser />
            Profile Settings
          </button>
          <button 
            className={`tab-btn ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            <FaLock />
            Change Password
          </button>
        </div>

        {error && (
          <motion.div 
            className="alert alert-error"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <FaExclamationTriangle />
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div 
            className="alert alert-success"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <FaCheckCircle />
            {success}
          </motion.div>
        )}

        <div className="settings-panel">
          {activeTab === 'profile' && (
            <motion.div
              className="profile-settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h2>Profile Information</h2>
              <p className="settings-description">
                Update your profile information. Changes will be reflected across the system.
              </p>
              
              <form onSubmit={handleProfileSubmit} className="settings-form">
                <div className="form-group">
                  <label htmlFor="name" className="form-label">
                    <FaUser /> Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    className="form-input"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    <FaUser /> Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    className="form-input"
                    placeholder="Enter your email address"
                    required
                  />
                </div>

                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="spinner-small"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <FaSave />
                        Update Profile
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {activeTab === 'password' && (
            <motion.div
              className="password-settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h2>Change Password</h2>
              <p className="settings-description">
                Change your password to keep your account secure. Use a strong password with at least 8 characters including uppercase, lowercase, and numbers.
              </p>
              
              <div style={{
                background: '#e7f3ff',
                border: '2px solid #2196F3',
                padding: '15px',
                borderRadius: '8px',
                margin: '15px 0'
              }}>
                <p style={{margin: 0, color: '#0d47a1', fontSize: '14px'}}>
                  💡 <strong>Password Requirements:</strong>
                </p>
                <ul style={{margin: '10px 0 0 20px', color: '#0d47a1', fontSize: '13px'}}>
                  <li>At least 8 characters long</li>
                  <li>Contains uppercase letters (A-Z)</li>
                  <li>Contains lowercase letters (a-z)</li>
                  <li>Contains numbers (0-9)</li>
                </ul>
              </div>
              
              <form onSubmit={handlePasswordSubmit} className="settings-form">
                <div className="form-group">
                  <label htmlFor="currentPassword" className="form-label">
                    <FaLock /> Current Password
                  </label>
                  <div className="password-input">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      id="currentPassword"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className="form-input"
                      placeholder="Enter current password"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => togglePasswordVisibility('current')}
                    >
                      {showPasswords.current ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="newPassword" className="form-label">
                    <FaLock /> New Password
                  </label>
                  <div className="password-input">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      id="newPassword"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className="form-input"
                      placeholder="Enter new password"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => togglePasswordVisibility('new')}
                    >
                      {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword" className="form-label">
                    <FaLock /> Confirm New Password
                  </label>
                  <div className="password-input">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className="form-input"
                      placeholder="Confirm new password"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => togglePasswordVisibility('confirm')}
                    >
                      {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="spinner-small"></div>
                        Changing...
                      </>
                    ) : (
                      <>
                        <FaLock />
                        Change Password
                      </>
                    )}
                  </button>
                </div>
              </form>
              
              <div style={{
                background: '#fff3cd',
                border: '2px solid #ffc107',
                padding: '15px',
                borderRadius: '8px',
                marginTop: '20px'
              }}>
                <p style={{margin: 0, color: '#856404', fontSize: '14px'}}>
                  <strong>🔑 Forgot your current password?</strong>
                </p>
                <p style={{margin: '10px 0 0 0', color: '#856404', fontSize: '13px'}}>
                  No problem! You can use the <Link to="/forgot-password" style={{color: '#856404', textDecoration: 'underline', fontWeight: 'bold'}}>Forgot Password</Link> feature to reset your password via email. 
                  Just enter your email address ({user?.email}) and follow the reset link.
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
