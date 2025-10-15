import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaBell, FaCalendarAlt, FaExclamationTriangle, FaInfoCircle, FaBullhorn, FaFilePdf, FaDownload, FaSync } from 'react-icons/fa';
import { useNotice } from '../contexts/NoticeContext';
import { useSocket } from '../contexts/SocketContext';
import pdfHandler from '../utils/pdfHandler';
import useAutoRefresh from '../hooks/useAutoRefresh';
import './Notice.css';

const Notice = () => {
  const [filter, setFilter] = useState('all');
  const { notices, loading, refreshNotices } = useNotice();
  const { isConnected } = useSocket();
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  // Auto-refresh every 30 seconds
  const manualRefresh = useAutoRefresh(() => {
    if (refreshNotices) {
      refreshNotices();
      setLastUpdated(new Date());
    }
  }, 30000, true); // 30 seconds

  const filteredNotices = filter === 'all' 
    ? notices 
    : notices.filter(notice => (notice.priority || 'normal') === filter);

  const getPriorityColor = (priority) => {
    const safePriority = priority || 'normal';
    switch (safePriority) {
      case 'high': return '#ef4444';
      case 'normal': return '#10b981';
      case 'low': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getPriorityIcon = (priority) => {
    const safePriority = priority || 'normal';
    switch (safePriority) {
      case 'high': return <FaExclamationTriangle />;
      case 'normal': return <FaInfoCircle />;
      case 'low': return <FaBullhorn />;
      default: return <FaInfoCircle />;
    }
  };

  const viewPDF = (pdfFile) => {
    pdfHandler.view(pdfFile);
  };

  const downloadPDF = async (pdfFile) => {
    await pdfHandler.download(pdfFile);
  };

  return (
    <div className="notice">
      {/* Header */}
      <section className="notice-header">
        <div className="container">
          <motion.div 
            className="header-content"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="header-icon bell-animated">
              <FaBell />
            </div>
            <h1 className="page-title">Notices & Announcements</h1>
            <p className="page-subtitle">
              Stay updated with the latest news, updates, and important information about our platform.
            </p>
            <div className="realtime-status">
              <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
                <div className="status-dot"></div>
                <span>{isConnected ? 'Live Updates Active' : 'Offline Mode'}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filter Section */}
      <section className="filter-section">
        <div className="container">
          <motion.div 
            className="filter-content"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="filter-header">
              <div className="filter-buttons">
                <button 
                  className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                  onClick={() => setFilter('all')}
                >
                  All Notices
                </button>
                <button 
                  className={`filter-btn ${filter === 'high' ? 'active' : ''}`}
                  onClick={() => setFilter('high')}
                >
                  High Priority
                </button>
                <button 
                  className={`filter-btn ${filter === 'normal' ? 'active' : ''}`}
                  onClick={() => setFilter('normal')}
                >
                  Normal
                </button>
                <button 
                  className={`filter-btn ${filter === 'low' ? 'active' : ''}`}
                  onClick={() => setFilter('low')}
                >
                  Low Priority
                </button>
              </div>
              <div className="refresh-section">
                <button 
                  className="refresh-btn"
                  onClick={() => manualRefresh()}
                  title="Refresh notices"
                  disabled={loading}
                >
                  <FaSync className={loading ? 'spinning' : ''} />
                  Refresh
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Notices List */}
      <section className="notices-section">
        <div className="container">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading notices...</p>
            </div>
          ) : (
            <div className="notices-grid">
              {filteredNotices.map((notice, index) => (
                <motion.div
                  key={notice.id || notice._id}
                  className="notice-card"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <div className="notice-header-card">
                    <div 
                      className="notice-icon"
                      style={{ color: getPriorityColor(notice.priority) }}
                    >
                      {getPriorityIcon(notice.priority)}
                    </div>
                    <div className="notice-meta">
                      <div className="notice-date">
                        <FaCalendarAlt />
                        {new Date(notice.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                      <div 
                        className="notice-priority"
                        style={{ backgroundColor: getPriorityColor(notice.priority) }}
                      >
                        {(notice.priority || 'normal').toUpperCase()}
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="notice-title">{notice.title}</h3>
                  <p className="notice-content">{notice.content}</p>
                  
                  {notice.pdfFile && (
                    <div className="notice-attachment">
                      <div className="pdf-attachment">
                        <FaFilePdf className="pdf-icon" />
                        <span className="pdf-name">
                          {notice.pdfFile.originalName || notice.pdfFile.name || notice.pdfFile.filename}
                        </span>
                        <div className="pdf-actions">
                          <button 
                            className="view-pdf-btn"
                            onClick={() => viewPDF(notice.pdfFile)}
                            title="View PDF"
                          >
                            👁️ View
                          </button>
                          <button 
                            className="download-pdf-btn"
                            onClick={() => downloadPDF(notice.pdfFile)}
                            title="Download PDF"
                          >
                            <FaDownload className="download-icon" />
                          </button>
                        </div>
                      </div>
                      <small className="attachment-info">
                        Click "View" to open PDF or "Download" to save it
                      </small>
                    </div>
                  )}
                  
                  <div className="notice-footer">
                    <span className="notice-author">
                      By: {notice.author}
                    </span>
                    {notice.updatedAt !== notice.createdAt && (
                      <span className="notice-updated">
                        Updated: {new Date(notice.updatedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          
          {filteredNotices.length === 0 && (
            <motion.div 
              className="no-notices"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <FaBell />
              <h3>No notices found</h3>
              <p>There are no notices in this category at the moment.</p>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Notice;
