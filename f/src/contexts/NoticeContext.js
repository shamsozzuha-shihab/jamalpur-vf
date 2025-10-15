import React, { createContext, useContext, useState, useEffect } from 'react';
import noticeService from '../utils/noticeService';
import { useSocket } from './SocketContext';

const NoticeContext = createContext();

export const useNotice = () => {
  const context = useContext(NoticeContext);
  if (!context) {
    throw new Error('useNotice must be used within a NoticeProvider');
  }
  return context;
};

export const NoticeProvider = ({ children }) => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    // Load notices from API with localStorage fallback
    const loadNotices = async () => {
      try {
        setLoading(true);
        const notices = await noticeService.getNotices();
        setNotices(notices);
      } catch (error) {
        console.error('Error loading notices:', error);
        setNotices([]);
      } finally {
        setLoading(false);
      }
    };

    loadNotices();
  }, []);

  // WebSocket event listeners for real-time updates
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNoticeCreated = (newNotice) => {
      console.log('🔔 New notice created:', newNotice);
      setNotices(prevNotices => [newNotice, ...prevNotices]);
    };

    const handleNoticeUpdated = (updatedNotice) => {
      console.log('📝 Notice updated:', updatedNotice);
      setNotices(prevNotices => 
        prevNotices.map(notice => 
          notice.id === updatedNotice.id || notice._id === updatedNotice.id 
            ? { ...notice, ...updatedNotice }
            : notice
        )
      );
    };

    const handleNoticeDeleted = (deletedNotice) => {
      console.log('🗑️ Notice deleted:', deletedNotice);
      setNotices(prevNotices => 
        prevNotices.filter(notice => 
          notice.id !== deletedNotice.id && notice._id !== deletedNotice.id
        )
      );
    };

    // Register event listeners
    socket.on('notice-created', handleNoticeCreated);
    socket.on('notice-updated', handleNoticeUpdated);
    socket.on('notice-deleted', handleNoticeDeleted);

    // Cleanup event listeners
    return () => {
      socket.off('notice-created', handleNoticeCreated);
      socket.off('notice-updated', handleNoticeUpdated);
      socket.off('notice-deleted', handleNoticeDeleted);
    };
  }, [socket, isConnected]);

  const addNotice = async (noticeData) => {
    try {
      // Try to create notice via API first
      try {
        const result = await noticeService.createNotice(noticeData);
        // Refresh notices from API
        const updatedNotices = await noticeService.getNotices();
        setNotices(updatedNotices);
        return result;
      } catch (apiError) {
        console.log('API create failed, using localStorage fallback');
        
        // Fallback to localStorage
        const newNotice = {
          id: Date.now(),
          title: noticeData.title,
          content: noticeData.content,
          author: noticeData.author,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          priority: noticeData.priority || 'normal',
          pdfFile: noticeData.pdfFile || null
        };
        
        const updatedNotices = noticeService.saveToLocalStorage(newNotice);
        setNotices(updatedNotices);
        return newNotice;
      }
    } catch (error) {
      console.error('Error adding notice:', error);
      throw new Error('Failed to add notice');
    }
  };

  const updateNotice = async (id, noticeData) => {
    try {
      // Try to update notice via API first
      try {
        const result = await noticeService.updateNotice(id, noticeData);
        // Refresh notices from API
        const updatedNotices = await noticeService.getNotices();
        setNotices(updatedNotices);
        return result;
      } catch (apiError) {
        console.log('API update failed, using localStorage fallback');
        
        // Fallback to localStorage
        const updatedNotice = {
          ...noticeData,
          updatedAt: new Date().toISOString()
        };
        
        const updatedNotices = noticeService.updateInLocalStorage(id, updatedNotice);
        setNotices(updatedNotices);
        return updatedNotices.find(notice => notice.id === id || notice._id === id);
      }
    } catch (error) {
      console.error('Error updating notice:', error);
      throw new Error('Failed to update notice');
    }
  };

  const deleteNotice = async (id) => {
    try {
      // Try to delete notice via API first
      try {
        await noticeService.deleteNotice(id);
        // Refresh notices from API
        const updatedNotices = await noticeService.getNotices();
        setNotices(updatedNotices);
        return true;
      } catch (apiError) {
        console.log('API delete failed, using localStorage fallback');
        
        // Fallback to localStorage
        const updatedNotices = noticeService.deleteFromLocalStorage(id);
        setNotices(updatedNotices);
        return true;
      }
    } catch (error) {
      console.error('Error deleting notice:', error);
      throw new Error('Failed to delete notice');
    }
  };

  const getNoticeById = (id) => {
    return notices.find(notice => notice.id === id || notice._id === id);
  };

  const refreshNotices = async () => {
    try {
      setLoading(true);
      const updatedNotices = await noticeService.getNotices();
      setNotices(updatedNotices);
    } catch (error) {
      console.error('Error refreshing notices:', error);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    notices,
    loading,
    addNotice,
    updateNotice,
    deleteNotice,
    getNoticeById,
    refreshNotices
  };

  return (
    <NoticeContext.Provider value={value}>
      {children}
    </NoticeContext.Provider>
  );
};
