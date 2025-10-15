import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaEnvelope, FaArrowLeft, FaCheckCircle, FaExclamationTriangle, FaKey, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import apiService from '../services/api';
import { validatePassword } from '../utils/validation';
import './Auth.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resetUrl, setResetUrl] = useState('');

  const handleSendResetLink = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Requesting reset link for:', email);
      const data = await apiService.forgotPassword(email);
      console.log('Reset link response:', data);
      
      setSuccess(true);
      
      // If email failed, show reset URL on screen
      if (data.resetUrl) {
        console.log('Email failed, showing reset URL on screen:', data.resetUrl);
        setResetUrl(data.resetUrl);
      } else {
        console.log(`Reset link sent to email successfully via ${data.emailMethod}!`);
      }
    } catch (err) {
      console.error('Send reset link error:', err);
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        setError('Server is not running. Please start the server first or contact support.');
      } else {
        setError(err.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };



  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <motion.div 
            className="auth-card"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="auth-header">
              <div className="auth-icon success">
                <FaCheckCircle />
              </div>
              <h1 className="auth-title">Reset Link Sent!</h1>
              <p className="auth-subtitle">Check your email for the password reset link</p>
            </div>

            <div className="reset-password-info">
              <div style={{
                background: '#d4edda',
                border: '2px solid #28a745',
                padding: '25px',
                borderRadius: '10px',
                textAlign: 'center',
                margin: '20px 0'
              }}>
                <p style={{margin: 0, color: '#155724', fontSize: '18px', fontWeight: 'bold'}}>
                  ✅ Password reset link sent to {email}!
                </p>
                <p style={{margin: '15px 0 0 0', color: '#155724'}}>
                  Click the link in your email to reset your password.
                </p>
              </div>

              {resetUrl && (
                <div style={{
                  background: '#f8f9fa',
                  border: '2px solid #6c757d',
                  padding: '20px',
                  borderRadius: '10px',
                  textAlign: 'center',
                  margin: '20px 0'
                }}>
                  <p style={{margin: '0 0 10px 0', color: '#495057', fontSize: '14px'}}>
                    <strong>Email not configured? Use this link:</strong>
                  </p>
                  <a 
                    href={resetUrl} 
                    style={{
                      color: '#007bff',
                      textDecoration: 'none',
                      fontSize: '14px',
                      wordBreak: 'break-all'
                    }}
                  >
                    {resetUrl}
                  </a>
                </div>
              )}

              <p style={{textAlign: 'center', color: '#666'}}>
                The reset link will expire in 1 hour for security.
              </p>
            </div>

            <div className="auth-footer">
              <Link to="/login" className="auth-link">
                Go to Login Now
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <motion.div 
          className="auth-card"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="auth-header">
            <div className="auth-icon">
              <FaEnvelope />
            </div>
            <h1 className="auth-title">Forgot Password?</h1>
            <p className="auth-subtitle">
              Enter your email address and we'll send you a password reset link
            </p>
            
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem 1rem',
              background: '#e7f3ff',
              borderRadius: '8px',
              border: '2px solid #2196F3',
              textAlign: 'center'
            }}>
              <p style={{margin: 0, color: '#0d47a1', fontSize: '0.85rem'}}>
                👤 <strong>For Admins & Users:</strong> This works for everyone! Just enter your registered email.
              </p>
            </div>
          </div>

          <form onSubmit={handleSendResetLink} className="auth-form">
            {error && (
              <motion.div 
                className="error-message"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <FaExclamationTriangle />
                {error}
              </motion.div>
            )}

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                <FaEnvelope /> Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="Enter your email address"
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner-small"></div>
                  Sending Reset Link...
                </>
              ) : (
                <>
                  <FaEnvelope />
                  Send Reset Link
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Remember your password?{' '}
              <Link to="/login" className="auth-link">
                Sign in here
              </Link>
            </p>
            <p>
              Don't have an account?{' '}
              <Link to="/register" className="auth-link">
                Create one here
              </Link>
            </p>
          </div>
        </motion.div>

        <motion.div 
          className="auth-info"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2>Need Help?</h2>
          <div className="info-list">
            <div className="info-item">
              <div className="info-icon">📧</div>
              <div>
                <h3>Check Your Email</h3>
                <p>Make sure you're using the email address you registered with.</p>
              </div>
            </div>
            <div className="info-item">
              <div className="info-icon">🔗</div>
              <div>
                <h3>Click the Link</h3>
                <p>You'll receive a secure link to reset your password.</p>
              </div>
            </div>
            <div className="info-item">
              <div className="info-icon">⏰</div>
              <div>
                <h3>Link Expires in 1 Hour</h3>
                <p>For security, the reset link will expire after 1 hour.</p>
              </div>
            </div>
            <div className="info-item">
              <div className="info-icon">🔒</div>
              <div>
                <h3>Secure Process</h3>
                <p>Your account security is our top priority.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPassword;
