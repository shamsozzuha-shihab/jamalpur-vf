// Centralized PDF handling utility
// Eliminates code duplication across components

class PDFHandler {
  /**
   * Download PDF file from server, Cloudinary, or data URL
   * @param {Object} pdfFile - PDF file object with filename, url, or data
   * @param {string} pdfFile.filename - Server filename (legacy)
   * @param {string} pdfFile.fileId - Server file ID (legacy)
   * @param {string} pdfFile.url - Cloudinary URL (new format)
   * @param {string} pdfFile.publicId - Cloudinary public ID (new format)
   * @param {string} pdfFile.originalName - Original filename
   * @param {string} pdfFile.data - Base64 data URL (fallback)
   * @param {string} pdfFile.name - Fallback name
   */
  async download(pdfFile) {
    if (!pdfFile) {
      console.error("❌ pdfHandler.download: No PDF file provided");
      return false;
    }

    console.log("📄 pdfHandler.download: Attempting to download PDF:", {
      hasFilename: !!pdfFile.filename,
      hasFileId: !!pdfFile.fileId,
      hasUrl: !!pdfFile.url,
      hasPublicId: !!pdfFile.publicId,
      hasData: !!pdfFile.data,
      filename: pdfFile.filename,
      originalName: pdfFile.originalName,
      url: pdfFile.url,
      size: pdfFile.size,
    });

    try {
      if (pdfFile.url) {
        // Cloudinary format - download from URL
        console.log("✅ Using Cloudinary URL download method");
        return await this._downloadFromUrl(pdfFile);
      } else if (pdfFile.filename || pdfFile.fileId) {
        // Legacy API format - download from server
        console.log("✅ Using server download method");
        return await this._downloadFromServer(pdfFile);
      } else if (pdfFile.data) {
        // localStorage format - base64 data
        console.log("✅ Using data URL download method");
        return this._downloadFromDataURL(pdfFile);
      } else {
        console.error(
          "❌ Invalid PDF file format - missing url, filename, fileId, and data:",
          pdfFile
        );
        return false;
      }
    } catch (error) {
      console.error("❌ PDF download error:", error);
      return false;
    }
  }

  /**
   * View/Open PDF in new tab
   * @param {Object} pdfFile - PDF file object
   */
  view(pdfFile) {
    if (!pdfFile) {
      console.error("❌ pdfHandler.view: No PDF file provided");
      return false;
    }

    console.log("👁️ pdfHandler.view: Attempting to view PDF:", {
      hasFilename: !!pdfFile.filename,
      hasFileId: !!pdfFile.fileId,
      hasUrl: !!pdfFile.url,
      hasData: !!pdfFile.data,
      filename: pdfFile.filename,
      originalName: pdfFile.originalName,
      url: pdfFile.url,
    });

    try {
      if (pdfFile.url) {
        // Cloudinary format - open from URL
        console.log("✅ Opening Cloudinary PDF URL:", pdfFile.url);
        window.open(pdfFile.url, "_blank");
        return true;
      } else if (pdfFile.filename || pdfFile.fileId) {
        // Legacy API format - open from server
        const pdfUrl = `${
          process.env.REACT_APP_API_URL ||
          "https://jamalpur-chamber-backend-b61d.onrender.com/api"
        }/files/${pdfFile.filename || pdfFile.fileId}`;
        console.log("✅ Opening PDF URL:", pdfUrl);
        window.open(pdfUrl, "_blank");
        return true;
      } else if (pdfFile.data) {
        // localStorage format - open from data URL
        console.log("✅ Opening data URL PDF");
        window.open(pdfFile.data, "_blank");
        return true;
      } else {
        console.error(
          "❌ Invalid PDF file format - missing url, filename, fileId, and data:",
          pdfFile
        );
        return false;
      }
    } catch (error) {
      console.error("❌ PDF view error:", error);
      return false;
    }
  }

  /**
   * Print PDF file
   * @param {Object} pdfFile - PDF file object
   */
  print(pdfFile) {
    if (!pdfFile) {
      console.error("No PDF file provided");
      return false;
    }

    try {
      let pdfUrl;

      if (pdfFile.url) {
        // Cloudinary format - use direct URL
        pdfUrl = pdfFile.url;
      } else if (pdfFile.filename || pdfFile.fileId) {
        // Legacy API format - construct server URL
        pdfUrl = `${
          process.env.REACT_APP_API_URL ||
          "https://jamalpur-chamber-backend-b61d.onrender.com/api"
        }/files/${pdfFile.filename || pdfFile.fileId}`;
      } else if (pdfFile.data) {
        // localStorage format - use data URL
        pdfUrl = pdfFile.data;
      } else {
        console.error("Invalid PDF file format:", pdfFile);
        return false;
      }

      // Open in new window and trigger print
      const printWindow = window.open(pdfUrl, "_blank");
      if (printWindow) {
        printWindow.onload = function () {
          printWindow.print();
        };
        return true;
      }
      return false;
    } catch (error) {
      console.error("PDF print error:", error);
      return false;
    }
  }

  /**
   * Get PDF filename for display
   * @param {Object} pdfFile - PDF file object
   * @returns {string} Display filename
   */
  getFilename(pdfFile) {
    if (!pdfFile) return "document.pdf";
    return (
      pdfFile.originalName || pdfFile.name || pdfFile.filename || "document.pdf"
    );
  }

  /**
   * Check if PDF file is valid
   * @param {Object} pdfFile - PDF file object
   * @returns {boolean}
   */
  isValid(pdfFile) {
    if (!pdfFile) return false;
    return !!(pdfFile.url || pdfFile.filename || pdfFile.fileId || pdfFile.data);
  }

  // Private methods

  /**
   * Download PDF from Cloudinary URL
   * @private
   */
  async _downloadFromUrl(pdfFile) {
    const filename = this.getFilename(pdfFile);
    
    try {
      // Try fetch method first (more reliable for large files)
      const response = await fetch(pdfFile.url);
      
      if (response.ok) {
        const blob = await response.blob();
        this._downloadBlob(blob, filename);
        return true;
      } else {
        // Fallback to direct link method
        this._downloadDirect(pdfFile.url, filename);
        return true;
      }
    } catch (error) {
      console.error("Fetch download failed, using direct method:", error);
      // Fallback to direct link method
      this._downloadDirect(pdfFile.url, filename);
      return true;
    }
  }

  /**
   * Download PDF from server
   * @private
   */
  async _downloadFromServer(pdfFile) {
    const pdfUrl = `${
      process.env.REACT_APP_API_URL || "https://jamalpur-chamber-backend-b61d.onrender.com/api"
    }/files/${pdfFile.filename || pdfFile.fileId}`;
    const filename = this.getFilename(pdfFile);

    try {
      // Try fetch method first (more reliable for large files)
      const response = await fetch(pdfUrl);

      if (response.ok) {
        const blob = await response.blob();
        this._downloadBlob(blob, filename);
        return true;
      } else {
        // Fallback to direct link method
        this._downloadDirect(pdfUrl, filename);
        return true;
      }
    } catch (error) {
      console.error("Fetch download failed, using direct method:", error);
      // Fallback to direct link method
      this._downloadDirect(pdfUrl, filename);
      return true;
    }
  }

  /**
   * Download PDF from base64 data URL
   * @private
   */
  _downloadFromDataURL(pdfFile) {
    const link = document.createElement("a");
    link.href = pdfFile.data;
    link.download = this.getFilename(pdfFile);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  }

  /**
   * Download blob as file
   * @private
   */
  _downloadBlob(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up URL object
    setTimeout(() => window.URL.revokeObjectURL(url), 100);
  }

  /**
   * Direct download using link
   * @private
   */
  _downloadDirect(url, filename) {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// Export singleton instance
const pdfHandler = new PDFHandler();
export default pdfHandler;
