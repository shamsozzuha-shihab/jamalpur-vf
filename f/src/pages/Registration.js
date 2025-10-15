import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { FaEye, FaEyeSlash, FaUserPlus, FaUser, FaLock, FaEnvelope, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { validateEmail, validateName, validatePassword, validationMessages } from '../utils/validation';
import './Auth.css';

const Registration = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [fieldValid, setFieldValid] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false
  });

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    setError('');
    
    // Real-time validation
    validateField(name, value);
  };

  const validateField = (fieldName, value) => {
    let error = '';
    let isValid = false;

    switch (fieldName) {
      case 'name':
        if (!value.trim()) {
          error = validationMessages.name.required;
        } else if (!validateName(value)) {
          error = validationMessages.name.invalid;
        } else {
          isValid = true;
        }
        break;
      case 'email':
        if (!value.trim()) {
          error = validationMessages.email.required;
        } else if (!validateEmail(value)) {
          error = validationMessages.email.invalid;
        } else {
          isValid = true;
        }
        break;
      case 'password':
        const passwordValidation = validatePassword(value);
        if (!value) {
          error = validationMessages.password.required;
        } else if (!passwordValidation.isValid) {
          error = validationMessages.password.weak;
        } else {
          isValid = true;
        }
        break;
      case 'confirmPassword':
        if (!value) {
          error = 'Please confirm your password';
        } else if (value !== formData.password) {
          error = validationMessages.password.mismatch;
        } else {
          isValid = true;
        }
        break;
      default:
        break;
    }

    setFieldErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));

    setFieldValid(prev => ({
      ...prev,
      [fieldName]: isValid
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate all fields
    const isFormValid = Object.values(fieldValid).every(valid => valid);
    
    if (!isFormValid) {
      setError('Please fix all validation errors before submitting');
      setLoading(false);
      return;
    }

    // Additional validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await register(formData.name, formData.email, formData.password);
      navigate('/');
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
              <FaUserPlus />
            </div>
            <h1 className="auth-title">Create Account</h1>
            <p className="auth-subtitle">Join our platform and get started today</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && (
              <motion.div 
                className="error-message"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {error}
              </motion.div>
            )}

            <div className="form-group">
              <label htmlFor="name" className="form-label">
                <FaUser /> Full Name
              </label>
              <div className="input-container">
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`form-input ${fieldErrors.name ? 'error' : fieldValid.name ? 'valid' : ''}`}
                  placeholder="Enter your full name"
                  required
                />
                {fieldValid.name && <FaCheckCircle className="input-icon valid-icon" />}
                {fieldErrors.name && <FaExclamationCircle className="input-icon error-icon" />}
              </div>
              {fieldErrors.name && (
                <motion.div 
                  className="field-error"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {fieldErrors.name}
                </motion.div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                <FaEnvelope /> Email Address
              </label>
              <div className="input-container">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`form-input ${fieldErrors.email ? 'error' : fieldValid.email ? 'valid' : ''}`}
                  placeholder="Enter your email"
                  required
                />
                {fieldValid.email && <FaCheckCircle className="input-icon valid-icon" />}
                {fieldErrors.email && <FaExclamationCircle className="input-icon error-icon" />}
              </div>
              {fieldErrors.email && (
                <motion.div 
                  className="field-error"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {fieldErrors.email}
                </motion.div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                <FaLock /> Password
              </label>
              <div className="password-input">
                <div className="input-container">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`form-input ${fieldErrors.password ? 'error' : fieldValid.password ? 'valid' : ''}`}
                    placeholder="Create a password"
                    required
                  />
                  {fieldValid.password && <FaCheckCircle className="input-icon valid-icon" />}
                  {fieldErrors.password && <FaExclamationCircle className="input-icon error-icon" />}
                </div>
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {fieldErrors.password && (
                <motion.div 
                  className="field-error"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {fieldErrors.password}
                </motion.div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                <FaLock /> Confirm Password
              </label>
              <div className="password-input">
                <div className="input-container">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`form-input ${fieldErrors.confirmPassword ? 'error' : fieldValid.confirmPassword ? 'valid' : ''}`}
                    placeholder="Confirm your password"
                    required
                  />
                  {fieldValid.confirmPassword && <FaCheckCircle className="input-icon valid-icon" />}
                  {fieldErrors.confirmPassword && <FaExclamationCircle className="input-icon error-icon" />}
                </div>
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <motion.div 
                  className="field-error"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {fieldErrors.confirmPassword}
                </motion.div>
              )}
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input type="checkbox" required />
                <span className="checkmark"></span>
                I agree to the{' '}
                <Link to="/terms" className="terms-link">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="terms-link">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner-small"></div>
                  Creating Account...
                </>
              ) : (
                <>
                  <FaUserPlus />
                  Create Account
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="auth-link">
                Sign in here
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
          <h2>Join Thousands of Happy Users</h2>
          <div className="info-list">
            <div className="info-item">
              <div className="info-icon">🚀</div>
              <div>
                <h3>Get Started Instantly</h3>
                <p>Create your account in seconds and start using our platform immediately.</p>
              </div>
            </div>
            <div className="info-item">
              <div className="info-icon">💡</div>
              <div>
                <h3>Powerful Features</h3>
                <p>Access advanced tools and features designed to boost your productivity.</p>
              </div>
            </div>
            <div className="info-item">
              <div className="info-icon">🎯</div>
              <div>
                <h3>Focused Experience</h3>
                <p>Clean, intuitive interface that helps you focus on what matters most.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Registration;
