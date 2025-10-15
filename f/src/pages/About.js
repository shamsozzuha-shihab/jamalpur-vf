import React from 'react';
import { motion } from 'framer-motion';
import { FaCode, FaMobile, FaHeart } from 'react-icons/fa';
import './About.css';

const About = () => {

  const values = [
    {
      icon: <FaCode />,
      title: 'Innovation',
      description: 'We constantly push boundaries to deliver cutting-edge business solutions and foster technological advancement.'
    },
    {
      icon: <FaMobile />,
      title: 'Collaboration',
      description: 'We believe in the power of teamwork and open communication to achieve collective business success.'
    },
    {
      icon: <FaHeart />,
      title: 'Commitment',
      description: 'Our dedication to the business community drives us to create exceptional value and opportunities.'
    }
  ];

  return (
    <div className="about">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="container">
          <motion.div 
            className="about-hero-content"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="about-title">About Our Platform</h1>
            <div className="about-subtitle">
              <p>
                The <strong>Jamalpur Chamber of Commerce & Industry (JCCI)</strong> is a premier organization representing the business and industrial community of Jamalpur. Established with the vision to promote trade, commerce, and industrial advancement, JCCI serves as a vital link between entrepreneurs, government authorities, and development partners.
              </p>
              
              <p>
                Our primary objective is to create an enabling environment that encourages investment, fosters innovation, and enhances the competitiveness of local industries. Through policy advocacy, training, and business support services, JCCI actively contributes to the economic growth and sustainable development of the Jamalpur district and beyond.
              </p>
              
              <p>
                Guided by <em>integrity, professionalism, and commitment</em>, the Jamalpur Chamber of Commerce & Industry continues to play a pivotal role in shaping a prosperous and progressive business landscape for the region.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="mission">
        <div className="container">
          <div className="mission-content">
            <motion.div 
              className="mission-text"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="section-title">Our Mission</h2>
              <div className="mission-description">
                <h3>Mission Statement</h3>
                <p>
                  To promote and protect the interests of the business and industrial community of Jamalpur by fostering an 
                  environment conducive to <strong>sustainable economic growth, innovation, and entrepreneurship</strong>.
                  JCCI is committed to enhancing trade opportunities, ensuring fair business practices, and supporting policies 
                  that strengthen regional and national development.
                </p>
                
                <h3>Vision Statement</h3>
                <p>
                  To become a leading catalyst for economic transformation and industrial progress in Jamalpur — building a 
                  <em>prosperous, self-reliant, and globally competitive</em> business community that contributes significantly 
                  to the socio-economic advancement of Bangladesh.
                </p>
              </div>
            </motion.div>
            
            <motion.div 
              className="mission-stats"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="stat-item">
                <div className="stat-number">10K+</div>
                <div className="stat-label">Active Users</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">99.9%</div>
                <div className="stat-label">Uptime</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">24/7</div>
                <div className="stat-label">Support</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>


      {/* Values Section */}
      <section className="values">
        <div className="container">
          <motion.div 
            className="section-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="section-title">Our Core Values</h2>
            <p className="section-description">
              The fundamental principles that guide our organization and drive our commitment to excellence
            </p>
          </motion.div>

          <div className="values-grid">
            {values.map((value, index) => (
              <motion.div
                key={index}
                className="value-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
              >
                <div className="value-icon">
                  {value.icon}
                </div>
                <h3 className="value-title">{value.title}</h3>
                <p className="value-description">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default About;
