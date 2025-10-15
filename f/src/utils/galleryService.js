// Gallery service - API only, no localStorage
class GalleryService {
  constructor() {
    this.apiBaseUrl =
      process.env.REACT_APP_API_URL || "https://project1-wr4s.onrender.com/api";
  }

  // Get gallery images from API
  async getGalleryImages() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/gallery`);
      if (response.ok) {
        const images = await response.json();
        // Only return images with valid URLs
        return Array.isArray(images)
          ? images.filter(
              (img) =>
                typeof img.imageUrl === "string" &&
                img.imageUrl.startsWith("http")
            )
          : [];
      }
    } catch (error) {
      console.error("Failed to fetch gallery images:", error);
    }
    return [];
  }

  // Upload gallery image to API
  async uploadImage(formData) {
    const token = localStorage.getItem("token");
    const response = await fetch(`${this.apiBaseUrl}/gallery/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to upload image");
    }

    const result = await response.json();
    return result;
  }

  // Delete gallery image from API
  async deleteImage(imageId) {
    // Guard against undefined or optimistic temporary ids
    if (!imageId || String(imageId).startsWith("temp-")) {
      throw new Error("Invalid image id");
    }
    const token = localStorage.getItem("token");

    const response = await fetch(`${this.apiBaseUrl}/gallery/${imageId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to delete image");
    }

    return await response.json();
  }
}

const galleryService = new GalleryService();
export default galleryService;
