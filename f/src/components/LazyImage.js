import React, { useState, useEffect, useRef } from 'react';
import './LazyImage.css';

/**
 * Optimized lazy-loading image component
 * - Loads images only when visible in viewport
 * - Shows placeholder while loading
 * - Handles loading and error states
 * - Uses Intersection Observer API for performance
 */
const LazyImage = ({
  src,
  alt = '',
  placeholder = '/placeholder.png',
  className = '',
  width,
  height,
  style = {},
  onLoad,
  onError
}) => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [imageStatus, setImageStatus] = useState('loading'); // loading, loaded, error
  const imgRef = useRef();

  useEffect(() => {
    // Check if browser supports Intersection Observer
    if (!('IntersectionObserver' in window)) {
      // Fallback: Load image immediately
      setImageSrc(src);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // When image is in viewport
          if (entry.isIntersecting) {
            // Load the actual image
            const img = new Image();
            
            img.onload = () => {
              setImageSrc(src);
              setImageStatus('loaded');
              if (onLoad) onLoad();
            };
            
            img.onerror = () => {
              setImageStatus('error');
              if (onError) onError();
            };
            
            img.src = src;
            
            // Stop observing once loaded
            observer.unobserve(entry.target);
          }
        });
      },
      {
        // Start loading slightly before image enters viewport
        rootMargin: '50px',
        threshold: 0.01
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    // Cleanup
    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [src, onLoad, onError]);

  return (
    <div
      ref={imgRef}
      className={`lazy-image-wrapper ${imageStatus} ${className}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        width,
        height,
        ...style
      }}
    >
      <img
        src={imageSrc}
        alt={alt}
        className={`lazy-image ${imageStatus === 'loaded' ? 'loaded' : ''}`}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transition: 'opacity 0.3s ease-in-out',
          opacity: imageStatus === 'loaded' ? 1 : 0.5
        }}
      />
      
      {imageStatus === 'loading' && (
        <div className="lazy-image-placeholder">
          <div className="lazy-image-spinner"></div>
        </div>
      )}
      
      {imageStatus === 'error' && (
        <div className="lazy-image-error">
          <span>⚠️</span>
          <span>Failed to load image</span>
        </div>
      )}
    </div>
  );
};

export default LazyImage;

