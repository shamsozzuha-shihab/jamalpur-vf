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
    if (!pdfFile) return "document";
    const base = (pdfFile.originalName || pdfFile.name || pdfFile.filename || "document").trim();
    // If originalName has extension, keep it as-is
    const hasExtension = /\.[A-Za-z0-9]{2,6}$/.test(base);

    if (hasExtension) return base;

    // Infer extension from mimetype
    const mime = (pdfFile.mimetype || "").toLowerCase();
    let ext = "";
    if (mime.includes("pdf")) ext = ".pdf";
    else if (mime.includes("jpeg") || mime.includes("jpg")) ext = ".jpg";
    else if (mime.includes("png")) ext = ".png";
    else if (mime.includes("gif")) ext = ".gif";
    else if (mime.includes("octet-stream")) ext = ""; // unknown

    return `${base}${ext}` || "document";
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
    const expectPdf = /\.pdf$/i.test(filename) || (pdfFile.mimetype || "").toLowerCase().includes("pdf");
    
    try {
      console.log("📥 Fetching PDF from Cloudinary URL:", pdfFile.url);
      
      // CRITICAL: Convert Cloudinary image URL to raw URL if needed
      // PDFs uploaded with resource_type: "raw" must use /raw/upload/ path
      let fetchUrl = pdfFile.url;
      if (fetchUrl.includes('res.cloudinary.com')) {
        // If URL uses /image/upload/, convert to /raw/upload/ for PDFs
        if (fetchUrl.includes('/image/upload/')) {
          fetchUrl = fetchUrl.replace('/image/upload/', '/raw/upload/');
          console.log("🔧 Converted image URL to raw URL:", fetchUrl);
        }
        
        // If we have publicId, construct proper raw URL
        if (pdfFile.publicId && !fetchUrl.includes('/raw/upload/')) {
          const cloudName = fetchUrl.match(/res\.cloudinary\.com\/([^/]+)/)?.[1];
          if (cloudName) {
            // Remove any file extension from publicId
            const cleanPublicId = pdfFile.publicId.replace(/\.(pdf|jpg|jpeg|png|gif)$/i, '');
            fetchUrl = `https://res.cloudinary.com/${cloudName}/raw/upload/${cleanPublicId}`;
            console.log("🔧 Using publicId to construct raw URL:", fetchUrl);
          }
        }
        
        // Add attachment flag for download
        const separator = fetchUrl.includes('?') ? '&' : '?';
        if (!fetchUrl.includes('fl_attachment')) {
          fetchUrl = `${fetchUrl}${separator}fl_attachment`;
        }
      }
      
      // Always use fetch + blob method for Cloudinary URLs
      // Direct link won't work due to CORS - browsers ignore download attribute
      const response = await fetch(fetchUrl, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'omit',
        headers: {
          'Accept': 'application/pdf, application/octet-stream, */*'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Get the content type from response headers
      const contentType = response.headers.get('content-type') || 'application/pdf';
      console.log("📄 Content-Type:", contentType);
      
      // Get the blob data directly (more reliable than arrayBuffer)
      const blob = await response.blob();
      
      if (!blob || blob.size === 0) {
        throw new Error("Downloaded file is empty");
      }
      
      console.log("✅ PDF blob received, size:", blob.size, "bytes", "type:", blob.type);
      
      let finalBlob = blob;
      if (expectPdf) {
        // Validate PDF by checking magic bytes (PDF files start with %PDF)
        const firstChunk = blob.slice(0, 4);
        const firstBytesArray = await firstChunk.arrayBuffer();
        const firstBytes = String.fromCharCode(...new Uint8Array(firstBytesArray));
        if (!firstBytes.startsWith('%PDF')) {
          console.warn("⚠️ Warning: File may not be a valid PDF. First bytes:", firstBytes);
        } else {
          console.log("✅ PDF header validated:", firstBytes);
        }
        // Normalize MIME if needed, but only for PDFs
        if (!(blob.type === 'application/pdf' || blob.type === 'application/octet-stream' || !blob.type)) {
          finalBlob = new Blob([await blob.arrayBuffer()], { type: 'application/pdf' });
        }
        console.log("✅ Blob finalized (PDF), size:", finalBlob.size, "bytes");
      }
      // Download using blob URL (this always triggers download, not view)
      this._downloadBlob(finalBlob, filename);
      return true;
      
    } catch (error) {
      console.error("❌ PDF download from Cloudinary failed:", error);
      console.error("Error details:", {
        message: error.message,
        url: pdfFile.url,
        filename: filename,
        stack: error.stack
      });
      
      // Show user-friendly error
      alert(`PDF download failed: ${error.message}\n\nPlease try again or contact support if the problem persists.`);
      
      return false;
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
    const expectPdf = /\.pdf$/i.test(filename) || (pdfFile.mimetype || "").toLowerCase().includes("pdf");

    try {
      console.log("📥 Fetching PDF from server:", pdfUrl);
      
      // Use fetch method for reliable downloads
      const response = await fetch(pdfUrl, {
        method: 'GET',
        cache: 'no-cache',
        credentials: 'omit'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get content type from response
      const contentType = response.headers.get('content-type') || 'application/pdf';
      console.log("📄 Content-Type:", contentType);
      
      // Get the blob data directly (more reliable)
      const blob = await response.blob();
      
      if (!blob || blob.size === 0) {
        throw new Error("Downloaded file is empty");
      }
      
      console.log("✅ PDF blob received from server, size:", blob.size, "bytes", "type:", blob.type);
      
      let finalBlob = blob;
      if (expectPdf) {
        // Validate PDF by checking magic bytes
        const firstChunk = blob.slice(0, 4);
        const firstBytesArray = await firstChunk.arrayBuffer();
        const firstBytes = String.fromCharCode(...new Uint8Array(firstBytesArray));
        if (!firstBytes.startsWith('%PDF')) {
          console.warn("⚠️ Warning: File may not be a valid PDF. First bytes:", firstBytes);
        } else {
          console.log("✅ PDF header validated:", firstBytes);
        }
        if (!(blob.type === 'application/pdf' || blob.type === 'application/octet-stream' || !blob.type)) {
          finalBlob = new Blob([await blob.arrayBuffer()], { type: 'application/pdf' });
        }
      }
      this._downloadBlob(finalBlob, filename);
      return true;
      
    } catch (error) {
      console.error("❌ Server PDF download failed:", error);
      console.error("Error details:", {
        message: error.message,
        url: pdfUrl,
        filename: filename,
        stack: error.stack
      });
      
      // Show user-friendly error
      alert(`PDF download failed: ${error.message}\n\nPlease try again or contact support if the problem persists.`);
      
      return false;
    }
  }

  /**
   * Download PDF from base64 data URL
   * @private
   */
  _downloadFromDataURL(pdfFile) {
    try {
      const filename = this.getFilename(pdfFile);
      // Sanitize filename
      const sanitizedFilename = filename.replace(/[<>:"/\\|?*]/g, '_').trim() || 'document.pdf';
      const finalFilename = /\.pdf$/i.test(sanitizedFilename)
        ? sanitizedFilename 
        : `${sanitizedFilename}.pdf`;
      
      const link = document.createElement("a");
      link.href = pdfFile.data;
      link.download = finalFilename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);
      
      return true;
    } catch (error) {
      console.error("❌ Error downloading from data URL:", error);
      return false;
    }
  }

  /**
   * Download blob as file
   * @private
   */
  _downloadBlob(blob, filename) {
    try {
      // Sanitize filename - remove any invalid characters
      const sanitizedFilename = filename.replace(/[<>:"/\\|?*]/g, '_').trim() || 'document';
      
      // If no extension, try inferring from blob type
      const hasExtension = /\.[A-Za-z0-9]{2,6}$/.test(sanitizedFilename);
      let finalFilename = sanitizedFilename;
      if (!hasExtension) {
        const type = (blob && blob.type ? blob.type : '').toLowerCase();
        if (type.includes('pdf')) finalFilename += '.pdf';
        else if (type.includes('jpeg') || type.includes('jpg')) finalFilename += '.jpg';
        else if (type.includes('png')) finalFilename += '.png';
        else if (type.includes('gif')) finalFilename += '.gif';
      }
      
      console.log("💾 Downloading blob as:", finalFilename, "Size:", blob.size, "bytes", "Type:", blob.type);
      
      // Validate blob before download
      if (!blob || blob.size === 0) {
        throw new Error("Invalid blob: file is empty");
      }
      
      // If it looks like a PDF, validate header for debugging
      if (/\.pdf$/i.test(finalFilename)) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const arrayBuffer = reader.result;
          const uint8Array = new Uint8Array(arrayBuffer);
          const header = String.fromCharCode(...uint8Array.slice(0, 4));
          if (!header.startsWith('%PDF')) {
            console.warn("⚠️ Warning: Downloaded file may not be a valid PDF. Header:", header);
          } else {
            console.log("✅ PDF header validated:", header);
          }
        };
        const firstChunk = blob.slice(0, 4);
        reader.readAsArrayBuffer(firstChunk);
      }
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = finalFilename;
      link.style.display = 'none'; // Hide the link
      
      // Set download attribute with proper filename
      link.setAttribute('download', finalFilename);
      
      // Append to body, click, then remove
      document.body.appendChild(link);
      
      // Trigger download
      link.click();
      
      console.log("✅ Download triggered for:", finalFilename);
      
      // Clean up after download starts
      setTimeout(() => {
        try {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          console.log("✅ Download link cleaned up");
        } catch (cleanupError) {
          console.warn("⚠️ Cleanup warning:", cleanupError);
        }
      }, 1000); // Increased timeout to ensure download starts
      
    } catch (error) {
      console.error("❌ Error downloading blob:", error);
      alert(`Failed to download PDF: ${error.message}`);
      throw error;
    }
  }

  /**
   * Direct download using link (fallback for same-origin URLs only)
   * Note: For cross-origin URLs, download attribute is ignored by browsers
   * @private
   */
  _downloadDirect(url, filename) {
    try {
      // Sanitize filename
      const sanitizedFilename = filename.replace(/[<>:"/\\|?*]/g, '_').trim() || 'document.pdf';
      // Ensure filename has .pdf extension (case-insensitive check)
      const finalFilename = /\.pdf$/i.test(sanitizedFilename)
        ? sanitizedFilename 
        : `${sanitizedFilename}.pdf`;
      
      const link = document.createElement("a");
      link.href = url;
      link.download = finalFilename;
      // Don't use target="_blank" as it can prevent download
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      
      // Delay removal to allow download to start
      setTimeout(() => {
        document.body.removeChild(link);
      }, 200);
      
    } catch (error) {
      console.error("❌ Error in direct download:", error);
      // Fallback: open in new tab
      window.open(url, '_blank');
    }
  }
}

// Export singleton instance
const pdfHandler = new PDFHandler();
export default pdfHandler;
