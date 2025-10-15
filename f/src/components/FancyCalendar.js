import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCalendarAlt, FaClock, FaGlobe, FaLanguage } from 'react-icons/fa';
import './FancyCalendar.css';

const FancyCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [banglaDate, setBanglaDate] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  // Bangla month names
  const banglaMonths = [
    'বৈশাখ', 'জ্যৈষ্ঠ', 'আষাঢ়', 'শ্রাবণ', 'ভাদ্র', 'আশ্বিন',
    'কার্তিক', 'অগ্রহায়ণ', 'পৌষ', 'মাঘ', 'ফাল্গুন', 'চৈত্র'
  ];

  // Bangla day names
  const banglaDays = [
    'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'
  ];

  // English month names
  const englishMonths = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // English day names
  const englishDays = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];

  // Convert English date to Bangla date (approximate conversion)
  const convertToBanglaDate = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const dayOfWeek = date.getDay();

    // Approximate conversion (Bengali calendar starts around April 14-15)
    let banglaYear = year - 593;
    let banglaMonth = month - 3;
    let banglaDay = day - 13;

    // Adjust for month boundaries
    if (banglaDay <= 0) {
      banglaMonth--;
      banglaDay += 30; // Approximate days in Bengali month
    }
    if (banglaMonth < 0) {
      banglaYear--;
      banglaMonth += 12;
    }
    if (banglaMonth >= 12) {
      banglaYear++;
      banglaMonth -= 12;
    }

    return {
      year: banglaYear,
      month: banglaMonth,
      day: banglaDay,
      dayOfWeek: dayOfWeek
    };
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);

    const bangla = convertToBanglaDate(currentDate);
    setBanglaDate(bangla);

    // Show calendar with animation
    const showTimer = setTimeout(() => {
      setIsVisible(true);
    }, 500);

    return () => {
      clearInterval(timer);
      clearTimeout(showTimer);
    };
  }, [currentDate]);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fancy-calendar"
          initial={{ opacity: 0, y: 50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ 
            duration: 0.8, 
            type: "spring", 
            stiffness: 100,
            damping: 15
          }}
        >
          <div className="calendar-container">
            {/* Header */}
            <motion.div 
              className="calendar-header"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <div className="calendar-title">
                <FaCalendarAlt className="calendar-icon" />
                <h2>Today's Date</h2>
              </div>
              <div className="calendar-time">
                <FaClock className="time-icon" />
                <span>{formatTime(currentDate)}</span>
              </div>
            </motion.div>

            {/* English Date */}
            <motion.div 
              className="date-section english-date"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <div className="date-header">
                <FaGlobe className="language-icon" />
                <span>English</span>
              </div>
              <div className="date-content">
                <div className="day-name">
                  {englishDays[currentDate.getDay()]}
                </div>
                <div className="date-main">
                  <span className="day">{currentDate.getDate()}</span>
                  <div className="month-year">
                    <span className="month">{englishMonths[currentDate.getMonth()]}</span>
                    <span className="year">{currentDate.getFullYear()}</span>
                  </div>
                </div>
                <div className="date-full">
                  {formatDate(currentDate)}
                </div>
              </div>
            </motion.div>

            {/* Bangla Date */}
            <motion.div 
              className="date-section bangla-date"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
            >
              <div className="date-header">
                <FaLanguage className="language-icon" />
                <span>বাংলা</span>
              </div>
              <div className="date-content">
                <div className="day-name">
                  {banglaDate && banglaDays[banglaDate.dayOfWeek]}
                </div>
                <div className="date-main">
                  <span className="day">{banglaDate && banglaDate.day}</span>
                  <div className="month-year">
                    <span className="month">{banglaDate && banglaMonths[banglaDate.month]}</span>
                    <span className="year">{banglaDate && banglaDate.year}</span>
                  </div>
                </div>
                <div className="date-full">
                  {banglaDate && `${banglaDate.day} ${banglaMonths[banglaDate.month]}, ${banglaDate.year}`}
                </div>
              </div>
            </motion.div>

            {/* Decorative Elements */}
            <div className="calendar-decorations">
              <div className="decoration-circle circle-1"></div>
              <div className="decoration-circle circle-2"></div>
              <div className="decoration-circle circle-3"></div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FancyCalendar;
