import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  FaRocket,
  FaShieldAlt,
  FaUsers,
  FaChartLine,
  FaArrowRight,
  FaGlobe,
  FaHandshake,
  FaBuilding,
  FaBriefcase,
  FaLightbulb,
  FaNetworkWired,
  FaFileContract,
  FaGavel,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaFacebook,
  FaTwitter,
  FaLinkedin,
  FaInstagram,
  FaYoutube,
  FaSearch,
  FaTimes,
  FaFilter,
  FaImages,
  FaSync,
} from "react-icons/fa";
import FancyCalendar from "../components/FancyCalendar";
import useAutoRefresh from "../hooks/useAutoRefresh";
import { useNews } from "../contexts/NewsContext";
import { useGallery } from "../contexts/GalleryContext";
import "./Home.css";

const Home = () => {
  const { news, loading: newsLoading, refreshNews } = useNews();
  const {
    galleryImages,
    loading: galleryLoading,
    refreshGallery,
  } = useGallery();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Auto-refresh gallery every 5 minutes to reduce unnecessary renders
  const manualRefreshGallery = useAutoRefresh(
    () => {
      refreshGallery();
    },
    300000,
    true
  );

  // Update loading state based on context loading states
  useEffect(() => {
    setLoading(newsLoading || galleryLoading);
  }, [newsLoading, galleryLoading]);

  // Refresh data when window regains focus (useful when returning from admin panel)
  useEffect(() => {
    const handleFocus = () => {
      refreshGallery();
      refreshNews();
    };

    // Listen for custom events from admin panel
    const handleNewsUpdate = () => {
      refreshNews();
    };

    const handleGalleryUpdate = () => {
      // Add a small delay to ensure backend is updated
      setTimeout(() => {
        refreshGallery();
      }, 300);
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("newsUpdated", handleNewsUpdate);
    window.addEventListener("galleryUpdated", handleGalleryUpdate);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("newsUpdated", handleNewsUpdate);
      window.removeEventListener("galleryUpdated", handleGalleryUpdate);
    };
  }, [refreshGallery, refreshNews]);

  // Memoized search functionality for better performance
  const handleSearch = useCallback(
    (query) => {
      setSearchQuery(query);
      if (query.trim() === "") {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }

      const results = [];
      const searchTerm = query.toLowerCase();

      // Search in news
      news.forEach((article) => {
        if (
          article.title.toLowerCase().includes(searchTerm) ||
          article.content.toLowerCase().includes(searchTerm)
        ) {
          results.push({
            type: "news",
            title: article.title,
            content: article.content.substring(0, 150) + "...",
            date: article.publishedAt,
            id: article._id,
          });
        }
      });

      // Search in gallery images
      galleryImages.forEach((image) => {
        if (
          image.title.toLowerCase().includes(searchTerm) ||
          image.description.toLowerCase().includes(searchTerm)
        ) {
          results.push({
            type: "gallery",
            title: image.title,
            content: image.description,
            date: image.uploadedAt,
            imageUrl: image.imageUrl,
            id: image._id,
          });
        }
      });

      setSearchResults(results);
      setShowSearchResults(true);
    },
    [news, galleryImages]
  );

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
  }, []);

  // Memoize services array to prevent recreation on every render
  const services = useMemo(
    () => [
      {
        icon: <FaChartLine />,
        title: "Trade and Finance Activities",
        description:
          "Along with coordinating and promoting the interest of its members- Chambers of Commerce, Trade, and Industrial Association, JCCI also plays a crucial role in trade facilitation and financial activities.",
      },
      {
        icon: <FaGavel />,
        title: "Policy Advocacy",
        description:
          "JCCI regularly conducts advocacy with the government on different fiscal, monetary and other policy issues for enabling ease of doing business and economic growth.",
      },
      {
        icon: <FaHandshake />,
        title: "CSR Activity",
        description:
          "JCCI takes part in different Corporate Social Responsibilities in order to enhance the social and environmental aspects of the country and community development.",
      },
      {
        icon: <FaLightbulb />,
        title: "Research & Planning",
        description:
          "JCCI collects statistical and additional necessary data to aid the trade and industry of the country in regard to development planning and policy formulation.",
      },
      {
        icon: <FaFileContract />,
        title: "Arbitration",
        description:
          "JCCI provides assistance to the businessmen all over the country to settle their domestic and international disputes at a minimum cost through arbitration services.",
      },
      {
        icon: <FaNetworkWired />,
        title: "Exchange of Business Delegation",
        description:
          "It is one of the crucial duties of JCCI to maintain the incoming and outgoing delegations along with arranging all necessary support for international business relations.",
      },
      {
        icon: <FaUsers />,
        title: "Networking with Strategic Partners",
        description:
          "JCCI maintains close liaison with the foreign National Chambers of Commerce and other Trade and Industrial Associations while initiating bilateral partnerships.",
      },
      {
        icon: <FaBriefcase />,
        title: "Seminar / Symposiums",
        description:
          "JCCI discusses and shares views on the crucial matters relevant to and affecting the national economy in various government forums and business conferences.",
      },
    ],
    []
  );

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-background">
          <div className="hero-overlay"></div>
        </div>
        <div className="container">
          <div className="hero-content">
            <motion.div
              className="hero-text"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="hero-title">
                Accelerating the{" "}
                <span className="highlight">Trillion Dollar Journey</span>
              </h1>
              <p className="hero-subtitle">
                THE JAMALPUR CHAMBER OF COMMERCE AND INDUSTRY
              </p>
              <p className="hero-description">
                JAMALPUR CHAMBER OF COMMERCE AND INDUSTRY (JCCI) is the apex
                trade organization of Bangladesh playing a pivotal role in
                consultative and advisory capacity, safeguarding the interest of
                businesses and fostering economic growth across the nation.
              </p>
              <div className="hero-buttons">
                <motion.button
                  className="btn btn-primary btn-large"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaRocket />
                  Join Our Network
                  <FaArrowRight />
                </motion.button>
                <motion.button
                  className="btn btn-outline btn-large"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaHandshake />
                  Learn More
                </motion.button>
              </div>

              {/* Fancy Search Bar */}
              <motion.div
                className="search-container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <div
                  className={`search-bar ${isSearchFocused ? "focused" : ""}`}
                >
                  <div className="search-input-container">
                    <FaSearch className="search-icon" />
                    <input
                      type="text"
                      placeholder="Search news, events, and more..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      onFocus={() => setIsSearchFocused(true)}
                      onBlur={() =>
                        setTimeout(() => setIsSearchFocused(false), 200)
                      }
                      className="search-input"
                    />
                    {searchQuery && (
                      <button className="search-clear" onClick={clearSearch}>
                        <FaTimes />
                      </button>
                    )}
                  </div>
                  <button className="search-filter">
                    <FaFilter />
                  </button>
                </div>

                {/* Search Results Dropdown */}
                {showSearchResults && searchResults.length > 0 && (
                  <motion.div
                    className="search-results"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="search-results-header">
                      <span>Search Results ({searchResults.length})</span>
                    </div>
                    <div className="search-results-list">
                      {searchResults.slice(0, 5).map((result, index) => (
                        <motion.div
                          key={`${result.type}-${result.id}`}
                          className="search-result-item"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                          <div className="result-icon">
                            {result.type === "news" ? (
                              <FaFileContract />
                            ) : (
                              <FaImages />
                            )}
                          </div>
                          <div className="result-content">
                            <h4 className="result-title">{result.title}</h4>
                            <p className="result-description">
                              {result.content}
                            </p>
                            <span className="result-date">
                              {new Date(result.date).toLocaleDateString()}
                            </span>
                          </div>
                          {result.imageUrl && (
                            <div className="result-image">
                              <img src={result.imageUrl} alt={result.title} />
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                    {searchResults.length > 5 && (
                      <div className="search-results-footer">
                        <span>
                          And {searchResults.length - 5} more results...
                        </span>
                      </div>
                    )}
                  </motion.div>
                )}

                {showSearchResults &&
                  searchResults.length === 0 &&
                  searchQuery && (
                    <motion.div
                      className="search-no-results"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <FaSearch className="no-results-icon" />
                      <p>No results found for "{searchQuery}"</p>
                      <span>Try different keywords or check your spelling</span>
                    </motion.div>
                  )}
              </motion.div>
            </motion.div>
            <div className="hero-visual">
              <motion.div
                className="hero-image"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <div className="floating-cards">
                  <motion.div
                    className="floating-card card-1"
                    animate={{ y: [0, -20, 0] }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <FaChartLine />
                    <span>Growth</span>
                  </motion.div>
                  <motion.div
                    className="floating-card card-2"
                    animate={{ y: [0, 20, 0] }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 1,
                    }}
                  >
                    <FaUsers />
                    <span>Network</span>
                  </motion.div>
                  <motion.div
                    className="floating-card card-3"
                    animate={{ y: [0, -15, 0] }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 2,
                    }}
                  >
                    <FaShieldAlt />
                    <span>Security</span>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Introduction Section */}
      <section className="introduction">
        <div className="container">
          <div className="intro-content">
            <motion.div
              className="intro-text"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="intro-title">
                Introduction to THE JAMALPUR CHAMBER OF COMMERCE AND INDUSTRY
              </h2>
              <div className="intro-stats">
                <div className="stat-item">
                  <div className="stat-number">50+</div>
                  <div className="stat-label">Years of Excellence</div>
                </div>
              </div>
              <p className="intro-description">
                JAMALPUR CHAMBER OF COMMERCE AND INDUSTRY (JCCI) is the apex
                trade organization of Bangladesh playing a pivotal role in
                consultative and advisory capacity, safeguarding the interest of
                businesses and fostering economic growth across the nation.
              </p>
              <div className="intro-features">
                <div className="intro-feature">
                  <h3>Our Mission</h3>
                  <p>
                    Chamber 4.0 focused on sustainability and more efficient
                    activities that would be more participative. As fourth
                    generation leaders of umbrella chamber aligned with 4RI, we
                    engage with business communication of excellence in policy
                    advocacy.
                  </p>
                </div>
                <div className="intro-feature">
                  <h3>Our Vision</h3>
                  <p>
                    To be the center of excellence in policy advocacy and all
                    matters relevant to trade and investment facilitation from
                    CMSME to the largest sector of Bangladesh.
                  </p>
                </div>
              </div>
              <div className="intro-read-more">
                <button className="btn btn-outline">Read More</button>
              </div>
            </motion.div>
            <motion.div
              className="intro-image"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="meeting-gallery">
                <div className="meeting-image main-meeting">
                  <div className="image-placeholder">
                    <FaUsers className="placeholder-icon" />
                    <span>Executive Meeting</span>
                  </div>
                </div>
                <div className="meeting-thumbnails">
                  <div className="thumbnail">
                    <div className="image-placeholder">
                      <FaHandshake className="placeholder-icon" />
                    </div>
                  </div>
                  <div className="thumbnail">
                    <div className="image-placeholder">
                      <FaBuilding className="placeholder-icon" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="services">
        <div className="container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="section-title">What We Do</h2>
            <p className="section-subtitle">
              Comprehensive services to support your business growth and
              development
            </p>
          </motion.div>

          <div className="services-grid">
            {services.map((service, index) => (
              <motion.div
                key={index}
                className="service-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -10, scale: 1.02 }}
              >
                <div className="service-icon">{service.icon}</div>
                <h3 className="service-title">{service.title}</h3>
                <p className="service-description">{service.description}</p>
                <div className="service-read-more">
                  <button className="btn btn-text">Read More</button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats">
        <div className="container">
          <div className="stats-grid">
            {[
              { number: "90", label: "Chambers" },
              { number: "429", label: "Associations" },
              { number: "19", label: "Joint Chambers" },
              { number: "0", label: "G.B Members" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                className="stat-item"
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="stat-number">{stat.number}</div>
                <div className="stat-label">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Professional Meetings Gallery */}
      <section className="meetings-gallery">
        <div className="container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="section-header-content">
              <div className="section-text">
                <h2 className="section-title">
                  Professional Meetings & Events
                </h2>
                <p className="section-subtitle">
                  Engaging in high-level discussions and strategic partnerships
                </p>
              </div>
              <button
                className="gallery-refresh-btn"
                onClick={() => manualRefreshGallery()}
                disabled={loading}
                title="Refresh gallery"
              >
                <FaSync className={loading ? "spinning" : ""} />
                <span>Refresh</span>
              </button>
            </div>
          </motion.div>

          <div className="gallery-grid">
            {galleryImages.length > 0 ? (
              galleryImages.map((image, index) => (
                <motion.div
                  key={image._id || image.id || index}
                  className="gallery-item small-gallery-item"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="gallery-image">
                    <img
                      src={image.imageUrl}
                      alt={image.altText}
                      className="gallery-img"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="gallery-overlay">
                      <div className="gallery-date">
                        {image.eventDate
                          ? new Date(image.eventDate).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )
                          : new Date(
                              image.uploadedAt || image.createdAt
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                      </div>
                      <h3>{image.title}</h3>
                      <p>{image.description}</p>

                      {/* Custom Event Data */}
                      <div className="gallery-event-details">
                        {image.eventLocation && (
                          <div className="event-detail">
                            <span className="event-icon">📍</span>
                            <span className="event-text">
                              {image.eventLocation}
                            </span>
                          </div>
                        )}
                        {image.eventType && (
                          <div className="event-detail">
                            <span className="event-icon">🎯</span>
                            <span className="event-text">
                              {image.eventType
                                .replace("-", " ")
                                .replace(/\b\w/g, (l) => l.toUpperCase())}
                            </span>
                          </div>
                        )}
                        {image.organizer && (
                          <div className="event-detail">
                            <span className="event-icon">🏢</span>
                            <span className="event-text">
                              {image.organizer}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              // Fallback to default images if no gallery images are available
              <>
                <motion.div
                  className="gallery-item small-gallery-item"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="gallery-image">
                    <img
                      src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=75"
                      alt="JCCI Executive Board Meeting - Two executives in business attire discussing at conference table"
                      className="gallery-img"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="gallery-overlay">
                      <div className="gallery-date">Sep 15, 2024</div>
                      <h3>Executive Board Meeting</h3>
                      <p>
                        Strategic discussions and policy decisions at JCCI
                        headquarters
                      </p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="gallery-item small-gallery-item"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="gallery-image">
                    <img
                      src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=75"
                      alt="JCCI Conference Room Meeting - Large U-shaped table with multiple business professionals"
                      className="gallery-img"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="gallery-overlay">
                      <div className="gallery-date">Sep 12, 2024</div>
                      <h3>Conference Room Meeting</h3>
                      <p>
                        Large-scale business discussions and strategic planning
                      </p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="gallery-item small-gallery-item"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="gallery-image">
                    <img
                      src="https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=75"
                      alt="JCCI Partnership Handshake - Three executives shaking hands in formal meeting room"
                      className="gallery-img"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="gallery-overlay">
                      <div className="gallery-date">Sep 10, 2024</div>
                      <h3>Partnership Agreement</h3>
                      <p>
                        Formal handshake ceremony for strategic business
                        partnerships
                      </p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="gallery-item small-gallery-item"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="gallery-image">
                    <img
                      src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=75"
                      alt="JCCI International Delegation Meeting - Formal discussion with multiple business leaders"
                      className="gallery-img"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="gallery-overlay">
                      <div className="gallery-date">Sep 8, 2024</div>
                      <h3>International Delegation</h3>
                      <p>
                        High-level discussions with international business
                        leaders
                      </p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="gallery-item small-gallery-item"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="gallery-image">
                    <img
                      src="https://images.unsplash.com/photo-1556761175-4b46a572b786?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=75"
                      alt="JCCI Policy Discussion - Formal meeting with business executives and officials"
                      className="gallery-img"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="gallery-overlay">
                      <div className="gallery-date">Sep 5, 2024</div>
                      <h3>Policy Discussion</h3>
                      <p>Shaping business policies and regulatory frameworks</p>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Calendar and News Section */}
      <section className="calendar-news-section">
        <div className="container">
          <div className="calendar-news-grid">
            {/* Calendar Section */}
            <div className="calendar-section">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                <FancyCalendar />
              </motion.div>
            </div>

            {/* Latest News Section */}
            <div className="news-section">
              <motion.div
                className="section-header"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <h2 className="section-title">Latest News</h2>
                <p className="section-subtitle">
                  Stay updated with our latest announcements and events
                </p>
              </motion.div>

              <div className="news-grid">
                {loading ? (
                  <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading latest news...</p>
                  </div>
                ) : news.length === 0 ? (
                  <div className="empty-state">
                    <p>No news articles available at the moment.</p>
                  </div>
                ) : (
                  news.slice(0, 6).map((article, index) => (
                    <motion.div
                      key={article.id}
                      className="news-card"
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      whileHover={{ y: -5, scale: 1.02 }}
                    >
                      <div className="news-date">
                        {new Date(article.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}{" "}
                        •{" "}
                        {new Date(article.createdAt).toLocaleTimeString(
                          "en-US",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </div>
                      <h3 className="news-title">{article.title}</h3>
                      <div className="news-category">{article.category}</div>
                      {article.isFeatured && (
                        <div className="news-featured">Featured</div>
                      )}
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact">
        <div className="container">
          <motion.div
            className="contact-content"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="contact-title">Contact Us</h2>
            <div className="contact-info">
              <div className="contact-item">
                <FaMapMarkerAlt />
                <div>
                  <h4>Our Location</h4>
                  <p>New Bus Terminal Road, BASIC Area, Jamalpur, Dhaka</p>
                </div>
              </div>
              <div className="contact-item">
                <FaEnvelope />
                <div>
                  <h4>Email</h4>
                  <p>jamalpurchamber@gmail.com</p>
                </div>
              </div>
              <div className="contact-item">
                <FaPhone />
                <div>
                  <h4>Phone</h4>
                  <p>+8801922348844</p>
                </div>
              </div>
            </div>
            <div className="social-links">
              <h4>Follow Us</h4>
              <div className="social-icons">
                <a
                  href="https://facebook.com"
                  className="social-icon"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaFacebook />
                </a>
                <a
                  href="https://twitter.com"
                  className="social-icon"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaTwitter />
                </a>
                <a
                  href="https://linkedin.com"
                  className="social-icon"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaLinkedin />
                </a>
                <a
                  href="https://instagram.com"
                  className="social-icon"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaInstagram />
                </a>
                <a
                  href="https://youtube.com"
                  className="social-icon"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaYoutube />
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <motion.div
            className="cta-content"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="cta-title">Ready to Join Our Network?</h2>
            <p className="cta-description">
              Join thousands of successful businesses that trust JCCI for their
              growth and development in Bangladesh's economic journey.
            </p>
            <div className="cta-buttons">
              <motion.button
                className="btn btn-primary btn-large"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaHandshake />
                Become a Member
                <FaArrowRight />
              </motion.button>
              <motion.button
                className="btn btn-outline btn-large"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaGlobe />
                Explore Services
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
