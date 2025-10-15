import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { useNotice } from "../contexts/NoticeContext";
import { useNews } from "../contexts/NewsContext";
import { useGallery } from "../contexts/GalleryContext";
import apiService from "../services/api";
import galleryService from "../utils/galleryService";
import pdfHandler from "../utils/pdfHandler";

import jsPDF from "jspdf";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSave,
  FaTimes,
  FaExclamationTriangle,
  FaInfoCircle,
  FaBullhorn,
  FaUserShield,
  FaCalendarAlt,
  FaUser,
  FaCog,
  FaFileAlt,
  FaDownload,
  FaPrint,
  FaFilePdf,
  FaEye,
  FaImages,
  FaUpload,
  FaImage,
  FaMapMarkerAlt,
  FaUsers,
} from "react-icons/fa";
import "./AdminPanel.css";

const AdminPanel = () => {
  const { user, isAdmin } = useAuth();
  const { notices, addNotice, updateNotice, deleteNotice } = useNotice();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    priority: "normal",
    pdfFile: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form submissions state
  const [submissions, setSubmissions] = useState([]);
  const [activeTab, setActiveTab] = useState("notices"); // 'notices', 'submissions', 'gallery', 'news', or 'admins'
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  // News management state
  const { news, refreshNews } = useNews();
  const [showNewsForm, setShowNewsForm] = useState(false);

  // Admin management state
  const [admins, setAdmins] = useState([]);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [adminFormData, setAdminFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [editingNews, setEditingNews] = useState(null);
  const [newsFormData, setNewsFormData] = useState({
    title: "",
    content: "",
    category: "business",
    imageUrl: "",
    isFeatured: false,
  });

  // Gallery state
  const {
    galleryImages,
    refreshGallery,
    addImageOptimistically,
    removeImageOptimistically,
  } = useGallery();
  const [showGalleryForm, setShowGalleryForm] = useState(false);
  const [editingGalleryImage, setEditingGalleryImage] = useState(null);
  const [galleryFormData, setGalleryFormData] = useState({
    title: "",
    description: "",
    altText: "",
    category: "meeting",
    order: 0,
    image: null,
    eventDate: "",
    eventLocation: "",
    eventType: "",
    organizer: "",
  });

  // Load submissions from backend API on component mount
  useEffect(() => {
    loadSubmissions();
    loadAdmins();
  }, []);

  const loadSubmissions = async () => {
    try {
      // Load from backend API
      const data = await apiService.getFormSubmissions();
      setSubmissions(data);
    } catch (error) {
      console.error("Error loading submissions:", error);
      // Fallback to localStorage if API fails
      const savedSubmissions = localStorage.getItem("formSubmissions");
      if (savedSubmissions) {
        try {
          setSubmissions(JSON.parse(savedSubmissions));
        } catch (error) {
          console.error("Error parsing submissions from localStorage:", error);
          // Clear invalid data
          localStorage.removeItem("formSubmissions");
          setSubmissions([]);
        }
      }
    }
  };

  // All useCallback hooks must be defined BEFORE any conditional returns

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setLoading(true);
      setError("");
      setSuccess("");

      try {
        if (editingNotice) {
          await updateNotice(editingNotice.id || editingNotice._id, formData);
          setSuccess("Notice updated successfully!");
        } else {
          const noticeData = {
            ...formData,
            author: user.name,
          };
          await addNotice(noticeData);
          setSuccess("Notice added successfully!");
        }

        setFormData({
          title: "",
          content: "",
          priority: "normal",
          pdfFile: null,
        });
        setShowAddForm(false);
        setEditingNotice(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [formData, editingNotice, user, addNotice, updateNotice]
  );

  const downloadPDF = useCallback(async (pdfFile) => {
    await pdfHandler.download(pdfFile);
  }, []);

  const handleDownloadSubmissionPDF = useCallback((submission) => {
    if (submission.pdfFile) {
      pdfHandler.download(submission.pdfFile);
    } else {
      alert("No PDF file attached to this submission");
    }
  }, []);

  const handleViewPDF = useCallback((submission) => {
    if (submission.pdfFile) {
      pdfHandler.view(submission.pdfFile);
    } else {
      alert("No PDF file attached to this submission");
    }
  }, []);

  const handlePrintSubmissionPDF = useCallback((submission) => {
    if (submission.pdfFile) {
      pdfHandler.print(submission.pdfFile);
    } else {
      alert("No PDF file attached to this submission");
    }
  }, []);

  // Load gallery images
  useEffect(() => {
    if (activeTab === "gallery") {
      refreshGallery();
    }
  }, [activeTab, refreshGallery]);

  // Load news
  useEffect(() => {
    if (activeTab === "news") {
      refreshNews();
    }
  }, [activeTab, refreshNews]);

  // Redirect if not admin (after all hooks)
  if (!isAdmin()) {
    return (
      <div className="admin-panel">
        <div className="access-denied">
          <FaUserShield className="access-denied-icon" />
          <h2>Access Denied</h2>
          <p>You need administrator privileges to access this panel.</p>
        </div>
      </div>
    );
  }

  const handleInputChange = (e) => {
    if (e.target.type === "file") {
      setFormData({
        ...formData,
        [e.target.name]: e.target.files[0],
      });
    } else {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value,
      });
    }
    setError("");
  };

  const handleEdit = (notice) => {
    setEditingNotice(notice);
    setFormData({
      title: notice.title,
      content: notice.content,
      priority: notice.priority,
      pdfFile: notice.pdfFile || null,
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this notice?")) {
      try {
        await deleteNotice(id);
        setSuccess("Notice deleted successfully!");
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingNotice(null);
    setFormData({ title: "", content: "", priority: "normal", pdfFile: null });
    setError("");
  };

  const getPriorityIcon = (priority) => {
    const safePriority = priority || "normal";
    switch (safePriority) {
      case "high":
        return <FaExclamationTriangle className="priority-high" />;
      case "normal":
        return <FaInfoCircle className="priority-normal" />;
      case "low":
        return <FaBullhorn className="priority-low" />;
      default:
        return <FaInfoCircle className="priority-normal" />;
    }
  };

  // Admin management functions
  const loadAdmins = async () => {
    try {
      // Load from backend API
      const adminUsers = await apiService.getAdmins();
      setAdmins(adminUsers);
    } catch (error) {
      console.error("Error loading admins:", error);
      setAdmins([]);
    }
  };

  const handleAdminInputChange = (e) => {
    setAdminFormData({
      ...adminFormData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Validation
      if (adminFormData.password !== adminFormData.confirmPassword) {
        throw new Error("Passwords do not match.");
      }

      if (adminFormData.password.length < 8) {
        throw new Error("Password must be at least 8 characters long.");
      }

      if (!adminFormData.email.includes("@")) {
        throw new Error("Please enter a valid email address.");
      }

      // Create new admin via API
      const newAdminData = {
        name: adminFormData.name,
        email: adminFormData.email,
        password: adminFormData.password,
      };

      await apiService.createAdmin(newAdminData);

      setSuccess("Admin account created successfully!");
      setAdminFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
      setShowAdminForm(false);
      loadAdmins();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    if (adminId === user.id) {
      setError("You cannot delete your own admin account.");
      return;
    }

    if (window.confirm("Are you sure you want to delete this admin account?")) {
      try {
        await apiService.deleteAdmin(adminId);
        setSuccess("Admin account deleted successfully!");
        loadAdmins();
      } catch (err) {
        setError(err.message || "Failed to delete admin account.");
      }
    }
  };

  const handleCancelAdmin = () => {
    setShowAdminForm(false);
    setAdminFormData({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
    setError("");
  };

  const getPriorityClass = (priority) => {
    const safePriority = priority || "normal";
    return `notice-card priority-${safePriority}`;
  };

  // Submission management functions
  const handleDeleteSubmission = async (id) => {
    if (window.confirm("Are you sure you want to delete this submission?")) {
      try {
        const submission = submissions.find((s) => s.id === id || s._id === id);

        // If submission has a backend _id, attempt to delete from backend
        if (submission && submission._id) {
          console.log("Loaded from backend with _id:", submission._id);
        }

        // Remove from local state
        const updatedSubmissions = submissions.filter(
          (s) => s.id !== id && s._id !== id
        );
        setSubmissions(updatedSubmissions);

        // Update localStorage as backup
        localStorage.setItem(
          "formSubmissions",
          JSON.stringify(updatedSubmissions)
        );

        setSuccess("Submission deleted successfully!");
        setTimeout(() => setSuccess(""), 3000);
      } catch (error) {
        console.error("Error deleting submission:", error);
        setError("Failed to delete submission");
        setTimeout(() => setError(""), 3000);
      }
    }
  };

  const handleDownloadSubmissions = () => {
    const dataStr = JSON.stringify(submissions, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "form-submissions.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();

    // Add header
    doc.setFontSize(20);
    doc.setTextColor(212, 175, 55); // Gold color
    doc.text("THE JAMALPUR CHAMBER OF COMMERCE AND INDUSTRY", 20, 20);

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("Form Submissions Report", 20, 35);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 45);

    // Add line separator
    doc.setDrawColor(212, 175, 55);
    doc.line(20, 50, 190, 50);

    let yPosition = 70;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;

    submissions.forEach((submission, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = 20;
      }

      // Submission header
      doc.setFontSize(12);
      doc.setTextColor(26, 26, 46); // Dark navy
      doc.text(`Submission #${index + 1}`, margin, yPosition);
      yPosition += 10;

      // Submission details
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);

      const details = [
        `Name: ${submission.name}`,
        `Email: ${submission.email}`,
        `Phone: ${submission.phone || "N/A"}`,
        `Category: ${getCategoryLabel(submission.category)}`,
        `Address: ${submission.address || "N/A"}`,
        `Message: ${submission.message}`,
        `Submitted: ${new Date(submission.submittedAt).toLocaleString()}`,
      ];

      details.forEach((detail) => {
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(detail, margin, yPosition);
        yPosition += 6;
      });

      // Add separator line
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition + 2, 190, yPosition + 2);
      yPosition += 10;
    });

    // Add footer
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(
        "Generated by THE JAMALPUR CHAMBER OF COMMERCE AND INDUSTRY Admin Panel",
        margin,
        pageHeight - 10
      );
      doc.text(`Page ${i} of ${totalPages}`, 190 - 30, pageHeight - 10);
    }

    // Save the PDF
    doc.save(
      `JCCI-Submissions-Report-${new Date().toISOString().split("T")[0]}.pdf`
    );
  };

  const handlePrintSubmissions = () => {
    setShowPrintPreview(true);
    setTimeout(() => {
      window.print();
      setShowPrintPreview(false);
    }, 100);
  };

  const getCategoryLabel = (category) => {
    const categories = {
      document: "Document Scan",
      contract: "Contract Scan",
      invoice: "Invoice Scan",
      certificate: "Certificate Scan",
      report: "Report Scan",
      other: "Other Document",
      general: "General Inquiry",
      support: "Technical Support",
      feedback: "Feedback",
      complaint: "Complaint",
      suggestion: "Suggestion",
    };
    return categories[category] || category;
  };

  // Gallery functions
  const handleGalleryInputChange = (e) => {
    const { name, value, files } = e.target;
    setGalleryFormData({
      ...galleryFormData,
      [name]: files ? files[0] : value,
    });
  };

  const handleGallerySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validate required fields
      if (!galleryFormData.title || galleryFormData.title.trim() === "") {
        setError("Title is required");
        setLoading(false);
        return;
      }
      if (
        !galleryFormData.description ||
        galleryFormData.description.trim() === ""
      ) {
        setError("Description is required");
        setLoading(false);
        return;
      }
      if (!galleryFormData.altText || galleryFormData.altText.trim() === "") {
        setError("Alt text is required");
        setLoading(false);
        return;
      }
      if (!editingGalleryImage && !galleryFormData.image) {
        setError("Image file is required for new uploads");
        setLoading(false);
        return;
      }

      // Upload to API with optimistic update
      if (galleryFormData.image) {
        // Create optimistic update before API call
        const optimisticImage = {
          _id: `temp-${Date.now()}`,
          id: `temp-${Date.now()}`,
          title: galleryFormData.title.trim(),
          description: galleryFormData.description.trim(),
          altText: galleryFormData.altText.trim(),
          category: galleryFormData.category,
          order: galleryFormData.order,
          imageUrl: URL.createObjectURL(galleryFormData.image), // Temporary preview URL
          uploadedBy: "Current User",
          uploadedAt: new Date().toISOString(),
          isOptimistic: true, // Flag to identify optimistic updates
        };

        // Show optimistic update immediately
        addImageOptimistically(optimisticImage);

        // Create FormData for file upload
        const formData = new FormData();
        formData.append("title", galleryFormData.title.trim());
        formData.append("description", galleryFormData.description.trim());
        formData.append("altText", galleryFormData.altText.trim());
        formData.append("category", galleryFormData.category);
        formData.append("order", galleryFormData.order.toString());
        formData.append("image", galleryFormData.image);

        await galleryService.uploadImage(formData);

        // Clean up optimistic URL
        URL.revokeObjectURL(optimisticImage.imageUrl);

        // The socket event will handle replacing the optimistic update with real data
      } else {
        // Editing existing image without new file - not supported yet
        setError("Please select an image file to upload");
        setLoading(false);
        return;
      }

      setSuccess(
        editingGalleryImage
          ? "Image updated successfully!"
          : "Image uploaded successfully!"
      );
      setGalleryFormData({
        title: "",
        description: "",
        altText: "",
        category: "meeting",
        order: 0,
        image: null,
        eventDate: "",
        eventLocation: "",
        eventType: "",
        organizer: "",
      });
      setShowGalleryForm(false);
      setEditingGalleryImage(null);

      // Note: No need to dispatch galleryUpdated event - socket handles real-time updates
    } catch (error) {
      console.error("Gallery submit error:", error);
      setError(`Failed to save image: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditGalleryImage = (image) => {
    setEditingGalleryImage(image);
    setGalleryFormData({
      title: image.title,
      description: image.description,
      altText: image.altText,
      category: image.category,
      order: image.order,
      image: null,
      eventDate: image.eventDate || "",
      eventLocation: image.eventLocation || "",
      eventType: image.eventType || "",
      organizer: image.organizer || "",
    });
    setShowGalleryForm(true);
  };

  const handleDeleteGalleryImage = async (imageId) => {
    if (window.confirm("Are you sure you want to delete this image?")) {
      try {
        const isOptimisticImage =
          !imageId || String(imageId).startsWith("temp-");
        console.log(
          "🗑️ Deleting image:",
          imageId,
          "isOptimistic:",
          isOptimisticImage
        );

        if (isOptimisticImage) {
          // Optimistic/temporary images: remove from state immediately
          console.log("Removing optimistic image from state");
          removeImageOptimistically(imageId);
          setSuccess("Image removed successfully!");
        } else {
          // Real images: delete from API (socket event will update state)
          try {
            console.log("Calling API to delete image:", imageId);
            await galleryService.deleteImage(imageId);
            console.log("✅ API delete successful, waiting for socket event");
            setSuccess("Image deleted successfully!");
            // The socket event 'gallery-image-deleted' will update the state automatically
          } catch (apiError) {
            console.error("❌ API delete failed:", apiError);
            setError("Failed to delete image. Please try again.");
          }
        }
        // Note: No need to dispatch galleryUpdated event - socket handles real-time updates
      } catch (error) {
        console.error("Delete gallery image error:", error);
        setError("Failed to delete image");
      }
    }
  };

  // News management functions

  const handleNewsInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewsFormData({
      ...newsFormData,
      [name]: type === "checkbox" ? checked : value,
    });
    setError("");
  };

  const handleNewsSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validate required fields
      if (!newsFormData.title.trim()) {
        setError("Title is required");
        setLoading(false);
        return;
      }
      if (!newsFormData.content.trim()) {
        setError("Content is required");
        setLoading(false);
        return;
      }

      if (editingNews) {
        // Update existing news via API
        console.log(
          "📝 Updating news:",
          editingNews.id || editingNews._id,
          newsFormData
        );
        await apiService.updateNews(
          editingNews.id || editingNews._id,
          newsFormData
        );
      } else {
        // Create new news via API
        console.log("📰 Creating news:", newsFormData);
        const result = await apiService.createNews(newsFormData);
        console.log("✅ News created result:", result);
      }

      setSuccess(
        editingNews
          ? "News article updated successfully!"
          : "News article created successfully!"
      );
      setNewsFormData({
        title: "",
        content: "",
        category: "business",
        imageUrl: "",
        isFeatured: false,
      });
      setShowNewsForm(false);
      setEditingNews(null);

      // Refresh news from context
      await refreshNews();

      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent("newsUpdated"));
    } catch (error) {
      console.error("News submit error:", error);
      setError("Failed to save news article");
    } finally {
      setLoading(false);
    }
  };

  const handleEditNews = (newsItem) => {
    setEditingNews(newsItem);
    setNewsFormData({
      title: newsItem.title,
      content: newsItem.content,
      category: newsItem.category,
      imageUrl: newsItem.imageUrl || "",
      isFeatured: newsItem.isFeatured || false,
    });
    setShowNewsForm(true);
  };

  const handleDeleteNews = async (newsId) => {
    if (window.confirm("Are you sure you want to delete this news article?")) {
      try {
        // Delete news via API
        await apiService.deleteNews(newsId);

        setSuccess("News article deleted successfully!");

        // Refresh news from context
        await refreshNews();

        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent("newsUpdated"));
      } catch (error) {
        console.error("Delete news error:", error);
        setError("Failed to delete news article");
      }
    }
  };

  const toggleNewsStatus = async (newsId, currentStatus) => {
    try {
      // Toggle news status via API
      await apiService.updateNews(newsId, { isActive: !currentStatus });

      setSuccess(
        `News article ${
          !currentStatus ? "activated" : "deactivated"
        } successfully!`
      );

      // Refresh news from context
      await refreshNews();

      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent("newsUpdated"));
    } catch (error) {
      console.error("Toggle news status error:", error);
      setError("Failed to update news status");
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <div className="admin-title">
          <FaUserShield className="admin-icon" />
          <h1>Admin Panel</h1>
        </div>
        <div className="admin-user">
          <FaUser />
          <span>Welcome, {user.name}</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="admin-tabs">
        <button
          className={`tab-button ${activeTab === "notices" ? "active" : ""}`}
          onClick={() => setActiveTab("notices")}
        >
          <FaBullhorn />
          Notices ({notices.length})
        </button>
        <button
          className={`tab-button ${
            activeTab === "submissions" ? "active" : ""
          }`}
          onClick={() => setActiveTab("submissions")}
        >
          <FaFileAlt />
          Submissions ({submissions.length})
        </button>
        <button
          className={`tab-button ${activeTab === "gallery" ? "active" : ""}`}
          onClick={() => setActiveTab("gallery")}
        >
          <FaImages />
          Gallery ({galleryImages.length})
        </button>
        <button
          className={`tab-button ${activeTab === "news" ? "active" : ""}`}
          onClick={() => setActiveTab("news")}
        >
          <FaFileAlt />
          News ({news.length})
        </button>
        <button
          className={`tab-button ${activeTab === "admins" ? "active" : ""}`}
          onClick={() => setActiveTab("admins")}
        >
          <FaUserShield />
          Admins ({admins.length})
        </button>
      </div>

      <div className="admin-content">
        <div className="admin-actions">
          {activeTab === "notices" && (
            <button
              className="btn btn-primary"
              onClick={() => setShowAddForm(true)}
              disabled={showAddForm}
            >
              <FaPlus />
              Add New Notice
            </button>
          )}
          {activeTab === "gallery" && (
            <button
              className="btn btn-primary"
              onClick={() => setShowGalleryForm(true)}
              disabled={showGalleryForm}
            >
              <FaUpload />
              Upload Image
            </button>
          )}
          {activeTab === "news" && (
            <button
              className="btn btn-primary"
              onClick={() => setShowNewsForm(true)}
              disabled={showNewsForm}
            >
              <FaPlus />
              Add New Article
            </button>
          )}
          {activeTab === "admins" && (
            <button
              className="btn btn-primary"
              onClick={() => setShowAdminForm(true)}
              disabled={showAdminForm}
            >
              <FaPlus />
              Add New Admin
            </button>
          )}
          {activeTab === "submissions" && (
            <>
              <button
                className="btn btn-primary"
                onClick={handleDownloadPDF}
                disabled={submissions.length === 0}
              >
                <FaFilePdf />
                Download PDF Report
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleDownloadSubmissions}
                disabled={submissions.length === 0}
              >
                <FaDownload />
                Download JSON
              </button>
              <button
                className="btn btn-secondary"
                onClick={handlePrintSubmissions}
                disabled={submissions.length === 0}
              >
                <FaPrint />
                Print Report
              </button>
            </>
          )}
          <Link to="/admin/settings" className="btn btn-secondary">
            <FaCog />
            Settings
          </Link>
        </div>

        {error && (
          <motion.div
            className="alert alert-error"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div
            className="alert alert-success"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {success}
          </motion.div>
        )}

        <AnimatePresence>
          {showAddForm && (
            <motion.div
              className="notice-form-container"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <form onSubmit={handleSubmit} className="notice-form">
                <div className="form-header">
                  <h3>{editingNotice ? "Edit Notice" : "Add New Notice"}</h3>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={handleCancel}
                  >
                    <FaTimes />
                  </button>
                </div>

                <div className="form-group">
                  <label htmlFor="title">Title</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter notice title"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="priority">Priority</label>
                  <select
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="form-select"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="content">Content</label>
                  <textarea
                    id="content"
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    className="form-textarea"
                    placeholder="Enter notice content"
                    rows="4"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="pdfFile">PDF Attachment (Optional)</label>
                  <div className="file-upload-container">
                    <input
                      type="file"
                      id="pdfFile"
                      name="pdfFile"
                      accept=".pdf"
                      onChange={handleInputChange}
                      className="file-input"
                    />
                    <label htmlFor="pdfFile" className="file-upload-label">
                      <FaUpload className="upload-icon" />
                      {formData.pdfFile
                        ? formData.pdfFile.name
                        : "Choose PDF file"}
                    </label>
                    {formData.pdfFile && (
                      <div className="file-info">
                        <FaFilePdf className="pdf-icon" />
                        <span>{formData.pdfFile.name}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, pdfFile: null })
                          }
                          className="remove-file-btn"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    )}
                  </div>
                  <small className="file-help-text">
                    Upload a PDF file to attach to this notice. Users will be
                    able to download it.
                  </small>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCancel}
                  >
                    <FaTimes />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="spinner-small"></div>
                        {editingNotice ? "Updating..." : "Adding..."}
                      </>
                    ) : (
                      <>
                        <FaSave />
                        {editingNotice ? "Update Notice" : "Add Notice"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notices Tab Content */}
        {activeTab === "notices" && (
          <div className="notices-list">
            <h2>Manage Notices ({notices.length})</h2>

            {notices.length === 0 ? (
              <div className="empty-state">
                <FaBullhorn className="empty-icon" />
                <h3>No notices yet</h3>
                <p>Add your first notice to get started.</p>
              </div>
            ) : (
              <div className="notices-grid">
                {notices.map((notice) => (
                  <motion.div
                    key={notice.id || notice._id}
                    className={getPriorityClass(notice.priority)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="notice-header">
                      <div className="notice-title">
                        {getPriorityIcon(notice.priority)}
                        <h3>{notice.title}</h3>
                      </div>
                      <div className="notice-actions">
                        <button
                          className="btn-icon btn-edit"
                          onClick={() => handleEdit(notice)}
                          title="Edit notice"
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="btn-icon btn-delete"
                          onClick={() => handleDelete(notice.id || notice._id)}
                          title="Delete notice"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>

                    <div className="notice-content">
                      <p>{notice.content}</p>
                      {notice.pdfFile && (
                        <div className="admin-pdf-attachment">
                          <FaFilePdf className="pdf-icon" />
                          <span className="pdf-name">
                            {notice.pdfFile.originalName ||
                              notice.pdfFile.name ||
                              notice.pdfFile.filename}
                          </span>
                          <button
                            className="download-pdf-btn"
                            onClick={() => downloadPDF(notice.pdfFile)}
                            title="Download PDF"
                          >
                            <FaDownload />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="notice-footer">
                      <div className="notice-meta">
                        <span className="notice-author">
                          <FaUser />
                          {notice.author}
                        </span>
                        <span className="notice-date">
                          <FaCalendarAlt />
                          {new Date(notice.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {notice.updatedAt !== notice.createdAt && (
                        <div className="notice-updated">
                          Updated:{" "}
                          {new Date(notice.updatedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Submissions Tab Content */}
        {activeTab === "submissions" && (
          <div className="submissions-list">
            <h2>User Submissions ({submissions.length})</h2>

            {submissions.length === 0 ? (
              <div className="empty-state">
                <FaFileAlt className="empty-icon" />
                <h3>No submissions yet</h3>
                <p>
                  User form submissions will appear here when users submit the
                  form.
                </p>
              </div>
            ) : (
              <div className="submissions-grid">
                {submissions.map((submission) => (
                  <motion.div
                    key={submission.id}
                    className="submission-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="submission-header">
                      <div className="submission-title">
                        <h3>{submission.name}</h3>
                        <span className="submission-category">
                          {getCategoryLabel(submission.category)}
                        </span>
                      </div>
                      <div className="submission-actions">
                        {submission.pdfFile && (
                          <>
                            <button
                              className="btn-icon btn-view"
                              onClick={() => handleViewPDF(submission)}
                              title="View PDF"
                            >
                              <FaEye />
                            </button>
                            <button
                              className="btn-icon btn-download"
                              onClick={() =>
                                handleDownloadSubmissionPDF(submission)
                              }
                              title="Download PDF"
                            >
                              <FaDownload />
                            </button>
                            <button
                              className="btn-icon btn-print"
                              onClick={() =>
                                handlePrintSubmissionPDF(submission)
                              }
                              title="Print PDF"
                            >
                              <FaPrint />
                            </button>
                          </>
                        )}
                        <button
                          className="btn-icon btn-delete"
                          onClick={() => handleDeleteSubmission(submission.id)}
                          title="Delete submission"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>

                    <div className="submission-content">
                      <div className="submission-details">
                        <p>
                          <strong>Email:</strong> {submission.email}
                        </p>
                        {submission.phone && (
                          <p>
                            <strong>Phone:</strong> {submission.phone}
                          </p>
                        )}
                        {submission.pdfFile && (
                          <p className="submission-pdf">
                            <FaFilePdf /> <strong>PDF:</strong>{" "}
                            {submission.pdfFile.originalName ||
                              submission.pdfFileName}
                          </p>
                        )}
                      </div>
                      <div className="submission-message">
                        <p>
                          <strong>Description:</strong>
                        </p>
                        <p>{submission.message || submission.description}</p>
                      </div>
                    </div>

                    <div className="submission-footer">
                      <div className="submission-meta">
                        <span className="submission-date">
                          <FaCalendarAlt />
                          Submitted:{" "}
                          {new Date(submission.submittedAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Gallery Tab Content */}
        {activeTab === "gallery" && (
          <div className="gallery-list">
            <div className="gallery-header">
              <h2>Manage Gallery Images ({galleryImages.length})</h2>
              <button
                className="btn btn-secondary"
                onClick={refreshGallery}
                title="Refresh Gallery"
              >
                🔄 Refresh
              </button>
            </div>

            {galleryImages.length === 0 ? (
              <div className="empty-state">
                <FaImages className="empty-icon" />
                <h3>No images uploaded yet</h3>
                <p>
                  Upload meeting photos and event images to display in the
                  gallery section.
                </p>
              </div>
            ) : (
              <div className="gallery-grid-admin">
                {galleryImages.map((image, index) => (
                  <motion.div
                    key={image._id || image.id || index}
                    className="gallery-item-admin"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <div className="gallery-image-preview">
                      <img
                        src={image.imageUrl}
                        alt={image.altText}
                        className="preview-img"
                      />
                      <div className="image-overlay">
                        <div className="image-actions">
                          <button
                            className="btn-icon btn-edit"
                            onClick={() => handleEditGalleryImage(image)}
                            title="Edit Image"
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="btn-icon btn-delete"
                            onClick={() =>
                              handleDeleteGalleryImage(image._id || image.id)
                            }
                            title="Delete Image"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="gallery-image-info">
                      <h3 className="image-title">{image.title}</h3>
                      <p className="image-description">{image.description}</p>

                      {/* Custom Event Data Display */}
                      {(image.eventDate ||
                        image.eventLocation ||
                        image.eventType ||
                        image.organizer) && (
                        <div className="image-event-details">
                          <h4 className="event-details-title">
                            Event Information
                          </h4>
                          <div className="event-details-grid">
                            {image.eventDate && (
                              <div className="event-detail-item">
                                <span className="event-detail-label">
                                  📅 Event Date:
                                </span>
                                <span className="event-detail-value">
                                  {new Date(image.eventDate).toLocaleDateString(
                                    "en-US",
                                    {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    }
                                  )}
                                </span>
                              </div>
                            )}
                            {image.eventLocation && (
                              <div className="event-detail-item">
                                <span className="event-detail-label">
                                  📍 Location:
                                </span>
                                <span className="event-detail-value">
                                  {image.eventLocation}
                                </span>
                              </div>
                            )}
                            {image.eventType && (
                              <div className="event-detail-item">
                                <span className="event-detail-label">
                                  🎯 Type:
                                </span>
                                <span className="event-detail-value">
                                  {image.eventType
                                    .replace("-", " ")
                                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                                </span>
                              </div>
                            )}
                            {image.organizer && (
                              <div className="event-detail-item">
                                <span className="event-detail-label">
                                  🏢 Organizer:
                                </span>
                                <span className="event-detail-value">
                                  {image.organizer}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="image-meta">
                        <span className="image-category">{image.category}</span>
                        <span className="image-order">
                          Order: {image.order}
                        </span>
                        <span
                          className={`image-status ${
                            image.isActive ? "active" : "inactive"
                          }`}
                        >
                          {image.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="image-upload-info">
                        <small>Uploaded by: {image.uploadedBy}</small>
                        <small>
                          Date:{" "}
                          {new Date(image.uploadedAt).toLocaleDateString()}
                        </small>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Gallery Upload Form */}
      {showGalleryForm && (
        <div className="modal-overlay">
          <motion.div
            className="modal-content gallery-form"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <div className="modal-header">
              <div className="modal-title">
                <FaUpload className="modal-icon" />
                <h2>
                  {editingGalleryImage ? "Edit Image" : "Upload New Image"}
                </h2>
              </div>
              <button
                className="btn-close"
                onClick={() => {
                  setShowGalleryForm(false);
                  setEditingGalleryImage(null);
                  setGalleryFormData({
                    title: "",
                    description: "",
                    altText: "",
                    category: "meeting",
                    order: 0,
                    image: null,
                    eventDate: "",
                    eventLocation: "",
                    eventType: "",
                    organizer: "",
                  });
                }}
              >
                <FaTimes />
              </button>
            </div>

            <form
              onSubmit={handleGallerySubmit}
              className="gallery-form-content"
            >
              {/* Basic Information Section */}
              <div className="form-section">
                <div className="form-section-header">
                  <h3>Basic Information</h3>
                  <p>Essential details about the image</p>
                </div>

                <div className="form-group">
                  <label htmlFor="title">
                    <FaImage className="label-icon" />
                    Image Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={galleryFormData.title}
                    onChange={handleGalleryInputChange}
                    required
                    placeholder="Enter a descriptive title for the image"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="description">
                    <FaFileAlt className="label-icon" />
                    Description *
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={galleryFormData.description}
                    onChange={handleGalleryInputChange}
                    required
                    rows="3"
                    placeholder="Describe what's shown in the image"
                    className="form-textarea"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="altText">
                    <FaEye className="label-icon" />
                    Alt Text *
                  </label>
                  <input
                    type="text"
                    id="altText"
                    name="altText"
                    value={galleryFormData.altText}
                    onChange={handleGalleryInputChange}
                    required
                    placeholder="Alternative text for accessibility"
                    className="form-input"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="category">
                      <FaBullhorn className="label-icon" />
                      Category
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={galleryFormData.category}
                      onChange={handleGalleryInputChange}
                      className="form-select"
                    >
                      <option value="meeting">Meeting</option>
                      <option value="event">Event</option>
                      <option value="conference">Conference</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="order">
                      <FaCalendarAlt className="label-icon" />
                      Display Order
                    </label>
                    <input
                      type="number"
                      id="order"
                      name="order"
                      value={galleryFormData.order}
                      onChange={handleGalleryInputChange}
                      min="0"
                      placeholder="0"
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              {/* Event Details Section */}
              <div className="form-section">
                <div className="form-section-header">
                  <h3>Event Details</h3>
                  <p>Additional information about the meeting or event</p>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="eventDate">
                      <FaCalendarAlt className="label-icon" />
                      Event Date
                    </label>
                    <input
                      type="date"
                      id="eventDate"
                      name="eventDate"
                      value={galleryFormData.eventDate}
                      onChange={handleGalleryInputChange}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="eventType">
                      <FaBullhorn className="label-icon" />
                      Event Type
                    </label>
                    <select
                      id="eventType"
                      name="eventType"
                      value={galleryFormData.eventType}
                      onChange={handleGalleryInputChange}
                      className="form-select"
                    >
                      <option value="">Select event type</option>
                      <option value="business-meeting">Business Meeting</option>
                      <option value="conference">Conference</option>
                      <option value="seminar">Seminar</option>
                      <option value="workshop">Workshop</option>
                      <option value="networking">Networking Event</option>
                      <option value="trade-show">Trade Show</option>
                      <option value="award-ceremony">Award Ceremony</option>
                      <option value="annual-meeting">Annual Meeting</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="eventLocation">
                      <FaMapMarkerAlt className="label-icon" />
                      Event Location
                    </label>
                    <input
                      type="text"
                      id="eventLocation"
                      name="eventLocation"
                      value={galleryFormData.eventLocation}
                      onChange={handleGalleryInputChange}
                      placeholder="e.g., Hotel Grand Palace, Dhaka"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="organizer">
                      <FaUsers className="label-icon" />
                      Event Organizer
                    </label>
                    <input
                      type="text"
                      id="organizer"
                      name="organizer"
                      value={galleryFormData.organizer}
                      onChange={handleGalleryInputChange}
                      placeholder="e.g., JCCI Executive Committee"
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              {/* File Upload Section */}
              {!editingGalleryImage && (
                <div className="form-section">
                  <div className="form-section-header">
                    <h3>Image Upload</h3>
                    <p>Select an image file to upload</p>
                  </div>

                  <div className="form-group">
                    <label htmlFor="image">
                      <FaUpload className="label-icon" />
                      Image File *
                    </label>
                    <div className="file-upload-container">
                      <input
                        type="file"
                        id="image"
                        name="image"
                        accept="image/*"
                        onChange={handleGalleryInputChange}
                        required
                        className="file-input"
                      />
                      <label htmlFor="image" className="file-upload-label">
                        <div className="upload-icon-container">
                          <FaImage className="upload-icon" />
                          <span className="upload-text">Choose Image File</span>
                        </div>
                        <span className="upload-hint">
                          Click to browse or drag and drop
                        </span>
                      </label>
                    </div>
                    {galleryFormData.image && (
                      <div className="file-preview">
                        <div className="file-preview-content">
                          <FaImage className="preview-icon" />
                          <div className="preview-info">
                            <span className="preview-name">
                              {galleryFormData.image.name}
                            </span>
                            <span className="preview-size">
                              {(
                                galleryFormData.image.size /
                                1024 /
                                1024
                              ).toFixed(2)}{" "}
                              MB
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setGalleryFormData({
                                ...galleryFormData,
                                image: null,
                              })
                            }
                            className="remove-file-btn"
                          >
                            <FaTimes />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowGalleryForm(false);
                    setEditingGalleryImage(null);
                    setGalleryFormData({
                      title: "",
                      description: "",
                      altText: "",
                      category: "meeting",
                      order: 0,
                      image: null,
                      eventDate: "",
                      eventLocation: "",
                      eventType: "",
                      organizer: "",
                    });
                  }}
                >
                  <FaTimes />
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="spinner-small"></div>
                      {editingGalleryImage ? "Updating..." : "Uploading..."}
                    </>
                  ) : (
                    <>
                      <FaSave />
                      {editingGalleryImage ? "Update Image" : "Upload Image"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* News Tab Content */}
      {activeTab === "news" && (
        <div className="news-list">
          <h2>Manage News Articles ({news.length})</h2>

          {news.length === 0 ? (
            <div className="empty-state">
              <FaFileAlt className="empty-icon" />
              <h3>No news articles yet</h3>
              <p>Create news articles to display on the home page.</p>
            </div>
          ) : (
            <div className="news-grid-admin">
              {news.map((article, index) => (
                <motion.div
                  key={article.id}
                  className={`news-item-admin ${
                    !article.isActive ? "inactive" : ""
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <div className="news-content">
                    <div className="news-header">
                      <h3 className="news-title">{article.title}</h3>
                      <div className="news-badges">
                        {article.isFeatured && (
                          <span className="badge badge-featured">Featured</span>
                        )}
                        <span
                          className={`badge badge-category badge-${article.category}`}
                        >
                          {article.category}
                        </span>
                        <span
                          className={`badge badge-status ${
                            article.isActive ? "active" : "inactive"
                          }`}
                        >
                          {article.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>

                    <div className="news-body">
                      <p className="news-preview">
                        {article.content.length > 150
                          ? `${article.content.substring(0, 150)}...`
                          : article.content}
                      </p>

                      {article.imageUrl && (
                        <div className="news-image-preview">
                          <img src={article.imageUrl} alt={article.title} />
                        </div>
                      )}
                    </div>

                    <div className="news-meta">
                      <div className="news-author">
                        <FaUser className="meta-icon" />
                        <span>{article.author}</span>
                      </div>
                      <div className="news-date">
                        <FaCalendarAlt className="meta-icon" />
                        <span>
                          Created:{" "}
                          {new Date(article.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}{" "}
                          at{" "}
                          {new Date(article.createdAt).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </span>
                      </div>
                      {article.updatedAt &&
                        article.updatedAt !== article.createdAt && (
                          <div className="news-updated">
                            <FaCalendarAlt className="meta-icon" />
                            <span>
                              Updated:{" "}
                              {new Date(article.updatedAt).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                }
                              )}{" "}
                              at{" "}
                              {new Date(article.updatedAt).toLocaleTimeString(
                                "en-US",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </span>
                          </div>
                        )}
                    </div>
                  </div>

                  <div className="news-actions">
                    <button
                      className="btn-icon btn-edit"
                      onClick={() => handleEditNews(article)}
                      title="Edit Article"
                    >
                      <FaEdit />
                    </button>
                    <button
                      className={`btn-icon ${
                        article.isActive ? "btn-deactivate" : "btn-activate"
                      }`}
                      onClick={() =>
                        toggleNewsStatus(article.id, article.isActive)
                      }
                      title={article.isActive ? "Deactivate" : "Activate"}
                    >
                      {article.isActive ? <FaTimes /> : <FaPlus />}
                    </button>
                    <button
                      className="btn-icon btn-delete"
                      onClick={() => handleDeleteNews(article.id)}
                      title="Delete Article"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* News Form Modal */}
      {showNewsForm && (
        <div className="modal-overlay">
          <motion.div
            className="modal news-form-modal"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <div className="modal-header">
              <h2>
                {editingNews ? "Edit News Article" : "Create New Article"}
              </h2>
              <button
                className="btn-close"
                onClick={() => {
                  setShowNewsForm(false);
                  setEditingNews(null);
                  setNewsFormData({
                    title: "",
                    content: "",
                    category: "business",
                    imageUrl: "",
                    isFeatured: false,
                  });
                }}
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleNewsSubmit} className="news-form-content">
              <div className="form-group">
                <label htmlFor="newsTitle">Article Title *</label>
                <input
                  type="text"
                  id="newsTitle"
                  name="title"
                  value={newsFormData.title}
                  onChange={handleNewsInputChange}
                  required
                  placeholder="Enter article title"
                />
              </div>

              <div className="form-group">
                <label htmlFor="newsContent">Article Content *</label>
                <textarea
                  id="newsContent"
                  name="content"
                  value={newsFormData.content}
                  onChange={handleNewsInputChange}
                  required
                  rows="6"
                  placeholder="Write your article content here..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="newsCategory">Category</label>
                  <select
                    id="newsCategory"
                    name="category"
                    value={newsFormData.category}
                    onChange={handleNewsInputChange}
                  >
                    <option value="business">Business</option>
                    <option value="policy">Policy</option>
                    <option value="event">Event</option>
                    <option value="announcement">Announcement</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="newsImageUrl">Image URL (Optional)</label>
                  <input
                    type="url"
                    id="newsImageUrl"
                    name="imageUrl"
                    value={newsFormData.imageUrl}
                    onChange={handleNewsInputChange}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    checked={newsFormData.isFeatured}
                    onChange={handleNewsInputChange}
                  />
                  <span className="checkbox-text">Featured Article</span>
                </label>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowNewsForm(false);
                    setEditingNews(null);
                    setNewsFormData({
                      title: "",
                      content: "",
                      category: "business",
                      imageUrl: "",
                      isFeatured: false,
                    });
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="spinner"></div>
                      {editingNews ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>
                      <FaSave />
                      {editingNews ? "Update Article" : "Create Article"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Admin Management Tab Content */}
      {activeTab === "admins" && (
        <div className="admin-management">
          <h2>Admin Management ({admins.length})</h2>

          {admins.length === 0 ? (
            <div className="empty-state">
              <FaUserShield className="empty-icon" />
              <h3>No admin accounts found</h3>
              <p>Admin accounts will appear here when created.</p>
            </div>
          ) : (
            <div className="admins-grid">
              {admins.map((admin) => (
                <motion.div
                  key={admin._id || admin.id}
                  className="admin-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="admin-header">
                    <div className="admin-info">
                      <FaUserShield className="admin-icon" />
                      <div className="admin-details">
                        <h3>{admin.name}</h3>
                        <p>{admin.email}</p>
                        {(admin._id || admin.id) === user.id && (
                          <span className="current-admin">Current Admin</span>
                        )}
                      </div>
                    </div>
                    <div className="admin-actions">
                      {(admin._id || admin.id) !== user.id && (
                        <button
                          className="btn-icon btn-delete"
                          onClick={() =>
                            handleDeleteAdmin(admin._id || admin.id)
                          }
                          title="Delete admin"
                        >
                          <FaTrash />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="admin-meta">
                    <div className="admin-meta-item">
                      <FaCalendarAlt />
                      <span>
                        Created:{" "}
                        {new Date(admin.registrationTime).toLocaleDateString()}
                      </span>
                    </div>
                    {admin.createdBy && (
                      <div className="admin-meta-item">
                        <FaUser />
                        <span>Created by: {admin.createdBy}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Add Admin Form */}
          {showAdminForm && (
            <motion.div
              className="admin-form-container"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <form onSubmit={handleAdminSubmit} className="admin-form">
                <div className="form-header">
                  <h3>Add New Admin</h3>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={handleCancelAdmin}
                  >
                    <FaTimes />
                  </button>
                </div>

                <div className="form-group">
                  <label htmlFor="adminName">Full Name</label>
                  <input
                    type="text"
                    id="adminName"
                    name="name"
                    value={adminFormData.name}
                    onChange={handleAdminInputChange}
                    className="form-input"
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="adminEmail">Email Address</label>
                  <input
                    type="email"
                    id="adminEmail"
                    name="email"
                    value={adminFormData.email}
                    onChange={handleAdminInputChange}
                    className="form-input"
                    placeholder="Enter email address"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="adminPassword">Password</label>
                    <input
                      type="password"
                      id="adminPassword"
                      name="password"
                      value={adminFormData.password}
                      onChange={handleAdminInputChange}
                      className="form-input"
                      placeholder="Enter password"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="adminConfirmPassword">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      id="adminConfirmPassword"
                      name="confirmPassword"
                      value={adminFormData.confirmPassword}
                      onChange={handleAdminInputChange}
                      className="form-input"
                      placeholder="Confirm password"
                      required
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCancelAdmin}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="spinner"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <FaSave />
                        Create Admin
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </div>
      )}

      {/* Print Preview for Submissions */}
      {showPrintPreview && (
        <div className="print-preview">
          <div className="print-content">
            <h1>Form Submissions Report</h1>
            <p>Generated on: {new Date().toLocaleString()}</p>
            <div className="print-submissions">
              {submissions.map((submission, index) => (
                <div key={submission.id} className="print-submission">
                  <h3>Submission #{index + 1}</h3>
                  <p>
                    <strong>Name:</strong> {submission.name}
                  </p>
                  <p>
                    <strong>Email:</strong> {submission.email}
                  </p>
                  <p>
                    <strong>Phone:</strong> {submission.phone || "N/A"}
                  </p>
                  <p>
                    <strong>Category:</strong>{" "}
                    {getCategoryLabel(submission.category)}
                  </p>
                  <p>
                    <strong>Address:</strong> {submission.address || "N/A"}
                  </p>
                  <p>
                    <strong>Message:</strong> {submission.message}
                  </p>
                  <p>
                    <strong>Submitted:</strong>{" "}
                    {new Date(submission.submittedAt).toLocaleString()}
                  </p>
                  <hr />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
