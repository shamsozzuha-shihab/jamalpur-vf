import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useSocket } from "./SocketContext";
import galleryService from "../utils/galleryService";

const GalleryContext = createContext();

export const useGallery = () => {
  const context = useContext(GalleryContext);
  if (!context) {
    throw new Error("useGallery must be used within a GalleryProvider");
  }
  return context;
};

export const GalleryProvider = ({ children }) => {
  const [galleryImages, setGalleryImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    // Load gallery images from API only
    const loadGalleryImages = async () => {
      try {
        setLoading(true);
        const images = await galleryService.getGalleryImages();
        setGalleryImages(images);
      } catch (error) {
        console.error("Error loading gallery images:", error);
        setGalleryImages([]);
      } finally {
        setLoading(false);
      }
    };

    loadGalleryImages();
  }, []);

  // WebSocket event listeners for real-time updates
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleGalleryImageCreated = (newImage) => {
      // Ensure the new image has the correct structure and valid imageUrl
      if (
        newImage &&
        typeof newImage.imageUrl === "string" &&
        newImage.imageUrl.startsWith("http")
      ) {
        setGalleryImages((prevImages) => {
          // Remove any optimistic updates with similar title/description
          const filteredImages = prevImages.filter(
            (img) =>
              !img.isOptimistic ||
              img.title !== newImage.title ||
              img.description !== newImage.description
          );

          // Check if real image already exists to avoid duplicates
          const exists = filteredImages.some(
            (img) =>
              img.id === newImage.id ||
              img._id === newImage.id ||
              img._id === newImage._id ||
              img.id === newImage._id
          );

          if (!exists) {
            return [newImage, ...filteredImages];
          }
          return filteredImages;
        });
      }
    };

    const handleGalleryImageUpdated = (updatedImage) => {
      if (
        updatedImage &&
        typeof updatedImage.imageUrl === "string" &&
        updatedImage.imageUrl.startsWith("http")
      ) {
        setGalleryImages((prevImages) =>
          prevImages.map((image) =>
            image.id === updatedImage.id ||
            image._id === updatedImage.id ||
            image._id === updatedImage._id ||
            image.id === updatedImage._id
              ? { ...image, ...updatedImage }
              : image
          )
        );
      }
    };

    const handleGalleryImageDeleted = (deletedImage) => {
      const imageId = deletedImage.id || deletedImage._id;
      console.log("🔥 Socket event received: gallery-image-deleted", imageId);
      setGalleryImages((prevImages) => {
        const filtered = prevImages.filter(
          (image) => image.id !== imageId && image._id !== imageId
        );
        console.log("Updated gallery images count:", filtered.length);
        return filtered;
      });
    };

    // Register event listeners
    socket.on("gallery-image-created", handleGalleryImageCreated);
    socket.on("gallery-image-updated", handleGalleryImageUpdated);
    socket.on("gallery-image-deleted", handleGalleryImageDeleted);

    // Cleanup event listeners
    return () => {
      socket.off("gallery-image-created", handleGalleryImageCreated);
      socket.off("gallery-image-updated", handleGalleryImageUpdated);
      socket.off("gallery-image-deleted", handleGalleryImageDeleted);
    };
  }, [socket, isConnected]);

  const refreshGallery = useCallback(async () => {
    try {
      setLoading(true);
      const images = await galleryService.getGalleryImages();
      setGalleryImages(images);
    } catch (error) {
      // Silent error handling
    } finally {
      setLoading(false);
    }
  }, []);

  // Add immediate optimistic update for uploads
  const addImageOptimistically = useCallback((newImage) => {
    setGalleryImages((prevImages) => [newImage, ...prevImages]);
  }, []);

  // Remove optimistic image from state
  const removeImageOptimistically = useCallback((imageId) => {
    setGalleryImages((prevImages) =>
      prevImages.filter(
        (image) => image.id !== imageId && image._id !== imageId
      )
    );
  }, []);

  const value = {
    galleryImages,
    loading,
    refreshGallery,
    addImageOptimistically,
    removeImageOptimistically,
  };

  return (
    <GalleryContext.Provider value={value}>{children}</GalleryContext.Provider>
  );
};
