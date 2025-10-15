import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  FaPrint,
  FaDownload,
  FaTrash,
  FaEdit,
  FaCheckCircle,
  FaExclamationCircle,
  FaFilePdf,
  FaEye,
  FaUserShield,
  FaLock,
} from "react-icons/fa";
import {
  validateEmail,
  validateName,
  validatePhone,
  validationMessages,
} from "../utils/validation";
import { useAuth } from "../contexts/AuthContext";
import apiService from "../services/api";
import pdfHandler from "../utils/pdfHandler";
import "./FormPage.css";

const FormPage = () => {
  const { user, isAdmin } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    pdfFile: null,
    scanType: "document",
    description: "",
  });
  const [submissions, setSubmissions] = useState([]);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    name: "",
    email: "",
    phone: "",
    pdfFile: "",
    description: "",
  });
  const [fieldValid, setFieldValid] = useState({
    name: false,
    email: false,
    phone: true, // Phone is optional
    pdfFile: false, // PDF is required for scanning
    description: false,
  });
  const [filePreview, setFilePreview] = useState(null);

  const loadSubmissions = useCallback(async () => {
    // Only load submissions for admin users
    if (!isAdmin()) {
      setSubmissions([]);
      return;
    }

    try {
      // Check if user is authenticated
      const token = localStorage.getItem("token");
      if (token) {
        const data = await apiService.getFormSubmissions();
        setSubmissions(data);
      } else {
        // Load from localStorage if not authenticated
        const savedSubmissions = localStorage.getItem("formSubmissions");
        if (savedSubmissions) {
          try {
            setSubmissions(JSON.parse(savedSubmissions));
          } catch (error) {
            console.error(
              "Error parsing submissions from localStorage:",
              error
            );
            localStorage.removeItem("formSubmissions");
            setSubmissions([]);
          }
        }
      }
    } catch (error) {
      console.error("Error loading submissions:", error);
      // Fallback to localStorage if API fails
      const savedSubmissions = localStorage.getItem("formSubmissions");
      if (savedSubmissions) {
        try {
          setSubmissions(JSON.parse(savedSubmissions));
        } catch (error) {
          console.error("Error parsing submissions from localStorage:", error);
          localStorage.removeItem("formSubmissions");
          setSubmissions([]);
        }
      }
    }
  }, [isAdmin]);

  // Load submissions from API on component mount and when admin status changes
  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const scanTypes = [
    { value: "document", label: "Document Scan" },
    { value: "contract", label: "Contract Scan" },
    { value: "invoice", label: "Invoice Scan" },
    { value: "certificate", label: "Certificate Scan" },
    { value: "report", label: "Report Scan" },
    { value: "other", label: "Other Document" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Real-time validation
    validateField(name, value);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      // Validate file type
      if (file.type !== "application/pdf") {
        setFieldErrors((prev) => ({
          ...prev,
          pdfFile: "Please select a valid PDF file",
        }));
        setFieldValid((prev) => ({
          ...prev,
          pdfFile: false,
        }));
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setFieldErrors((prev) => ({
          ...prev,
          pdfFile: "File size must be less than 10MB",
        }));
        setFieldValid((prev) => ({
          ...prev,
          pdfFile: false,
        }));
        return;
      }

      // File is valid
      setFormData({
        ...formData,
        pdfFile: file,
      });

      setFieldErrors((prev) => ({
        ...prev,
        pdfFile: "",
      }));
      setFieldValid((prev) => ({
        ...prev,
        pdfFile: true,
      }));

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setFilePreview(previewUrl);
    }
  };

  const removeFile = () => {
    setFormData({
      ...formData,
      pdfFile: null,
    });

    if (filePreview) {
      URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    }

    setFieldErrors((prev) => ({
      ...prev,
      pdfFile: "",
    }));
    setFieldValid((prev) => ({
      ...prev,
      pdfFile: false,
    }));
  };

  const validateField = (fieldName, value) => {
    let error = "";
    let isValid = false;

    switch (fieldName) {
      case "name":
        if (!value.trim()) {
          error = validationMessages.name.required;
        } else if (!validateName(value)) {
          error = validationMessages.name.invalid;
        } else {
          isValid = true;
        }
        break;
      case "email":
        if (!value.trim()) {
          error = validationMessages.email.required;
        } else if (!validateEmail(value)) {
          error = validationMessages.email.invalid;
        } else {
          isValid = true;
        }
        break;
      case "phone":
        if (value && !validatePhone(value)) {
          error = validationMessages.phone.invalid;
        } else {
          isValid = true;
        }
        break;
      case "description":
        if (!value.trim()) {
          error = "Description is required";
        } else if (value.trim().length < 10) {
          error = "Description must be at least 10 characters long";
        } else {
          isValid = true;
        }
        break;
      default:
        isValid = true;
        break;
    }

    setFieldErrors((prev) => ({
      ...prev,
      [fieldName]: error,
    }));

    setFieldValid((prev) => ({
      ...prev,
      [fieldName]: isValid,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    const requiredFields = ["name", "email", "pdfFile", "description"];
    const isFormValid = requiredFields.every((field) => fieldValid[field]);

    if (!isFormValid) {
      alert("Please fix all validation errors before submitting");
      return;
    }

    try {
      if (editingIndex >= 0) {
        // Update existing submission (local only for now)
        const updatedSubmissions = [...submissions];
        updatedSubmissions[editingIndex] = {
          ...formData,
          id: submissions[editingIndex].id,
          submittedAt: submissions[editingIndex].submittedAt,
          updatedAt: new Date().toISOString(),
        };
        setSubmissions(updatedSubmissions);
        localStorage.setItem(
          "formSubmissions",
          JSON.stringify(updatedSubmissions)
        );
        setEditingIndex(-1);
      } else {
        // Prepare form data with file
        const formDataToSend = new FormData();
        formDataToSend.append("name", formData.name);
        formDataToSend.append("email", formData.email);
        formDataToSend.append("phone", formData.phone);
        formDataToSend.append("message", formData.description);
        formDataToSend.append("category", formData.scanType);
        formDataToSend.append("address", "");

        if (formData.pdfFile) {
          formDataToSend.append("pdfFile", formData.pdfFile);
        }

        // Submit new form to API
        const response = await apiService.submitFormWithFile(formDataToSend);

        // Add to local state
        const newSubmission = {
          ...formData,
          id: response.submission.id,
          submittedAt: response.submission.submittedAt,
          pdfFileName: formData.pdfFile ? formData.pdfFile.name : null,
          pdfFile:
            response.submission.pdfFile ||
            (formData.pdfFile
              ? {
                  filename:
                    response.submission.pdfFile?.filename ||
                    `temp-${Date.now()}.pdf`,
                  originalName: formData.pdfFile.name,
                  path: response.submission.pdfFile?.path || "",
                  size: formData.pdfFile.size,
                }
              : null),
        };
        const updatedSubmissions = [newSubmission, ...submissions];
        setSubmissions(updatedSubmissions);
        localStorage.setItem(
          "formSubmissions",
          JSON.stringify(updatedSubmissions)
        );
      }

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        pdfFile: null,
        scanType: "document",
        description: "",
      });

      // Reset validation states
      setFieldErrors({
        name: "",
        email: "",
        phone: "",
        pdfFile: "",
        description: "",
      });
      setFieldValid({
        name: false,
        email: false,
        phone: true,
        pdfFile: false,
        description: false,
      });

      // Clean up file preview
      if (filePreview) {
        URL.revokeObjectURL(filePreview);
        setFilePreview(null);
      }

      alert("PDF scan submitted successfully!");
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Error submitting PDF scan. Please try again.");
    }
  };

  const handleEdit = (index) => {
    const submission = submissions[index];
    setFormData({
      name: submission.name,
      email: submission.email,
      phone: submission.phone,
      pdfFile: null, // Can't edit file
      scanType: submission.category || "document",
      description: submission.message || "",
    });
    setEditingIndex(index);
  };

  const handleDelete = (index) => {
    const updatedSubmissions = submissions.filter((_, i) => i !== index);
    setSubmissions(updatedSubmissions);
    localStorage.setItem("formSubmissions", JSON.stringify(updatedSubmissions));
  };

  const handleDownloadPDF = async (submission) => {
    console.log("Downloading PDF for submission:", submission);
    if (submission.pdfFile) {
      const success = await pdfHandler.download(submission.pdfFile);
      if (!success) {
        console.error("PDF download failed:", submission.pdfFile);
        alert("Unable to download PDF. File may not be available.");
      }
    } else {
      console.error("No PDF file found for submission:", submission);
      alert("PDF file not found or not properly uploaded.");
    }
  };

  const handleViewPDF = (submission) => {
    console.log("Viewing PDF for submission:", submission);
    if (submission.pdfFile) {
      const success = pdfHandler.view(submission.pdfFile);
      if (!success) {
        console.error("PDF view failed:", submission.pdfFile);
        alert("Unable to open PDF. File may not be available.");
      }
    } else {
      console.error("No PDF file found for submission:", submission);
      alert("PDF file not found or not properly uploaded.");
    }
  };

  const handlePrint = () => {
    setShowPrintPreview(true);
    setTimeout(() => {
      window.print();
      setShowPrintPreview(false);
    }, 100);
  };

  const handleDownload = async () => {
    try {
      // Create a zip file containing both JSON data and PDF files
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      // Add JSON data file
      const dataStr = JSON.stringify(submissions, null, 2);
      zip.file("submissions-data.json", dataStr);

      // Add PDF files
      let pdfCount = 0;
      for (const submission of submissions) {
        if (submission.pdfFile && submission.pdfFile.filename) {
          try {
            // Fetch PDF file from server
            const pdfResponse = await fetch(
              `${
                process.env.REACT_APP_API_URL ||
                "https://project1-wr4s.onrender.com/api"
              }/files/${submission.pdfFile.filename}`
            );
            if (pdfResponse.ok) {
              const pdfBlob = await pdfResponse.blob();
              const fileName =
                submission.pdfFile.originalName ||
                `submission-${submission.id}.pdf`;
              zip.file(`pdfs/${fileName}`, pdfBlob);
              pdfCount++;
            } else {
              console.warn(
                `Could not fetch PDF for submission ${submission.id}`
              );
            }
          } catch (error) {
            console.error(
              `Error fetching PDF for submission ${submission.id}:`,
              error
            );
          }
        }
      }

      // Generate and download zip file
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `pdf-scan-submissions-${
        new Date().toISOString().split("T")[0]
      }.zip`;
      link.click();
      URL.revokeObjectURL(url);

      // Show success message
      alert(
        `Download complete! Exported ${submissions.length} submissions and ${pdfCount} PDF files.`
      );
    } catch (error) {
      console.error("Error creating download:", error);
      // Fallback to JSON only download
      const dataStr = JSON.stringify(submissions, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "pdf-scan-submissions.json";
      link.click();
      URL.revokeObjectURL(url);
      alert(
        "Downloaded JSON data only. PDF files could not be included due to an error."
      );
    }
  };

  const handleDownloadJSON = () => {
    const dataStr = JSON.stringify(submissions, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "pdf-scan-submissions.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAllPDFs = async () => {
    const pdfSubmissions = submissions.filter(
      (sub) => sub.pdfFile && sub.pdfFile.filename
    );

    if (pdfSubmissions.length === 0) {
      alert("No PDF files found to download.");
      return;
    }

    // Download each PDF individually
    for (let i = 0; i < pdfSubmissions.length; i++) {
      const submission = pdfSubmissions[i];
      try {
        const response = await fetch(
          `${
            process.env.REACT_APP_API_URL ||
            "https://project1-wr4s.onrender.com/api"
          }/files/${submission.pdfFile.filename}`
        );
        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download =
            submission.pdfFile.originalName ||
            `submission-${submission.id}.pdf`;
          link.click();
          URL.revokeObjectURL(url);

          // Add delay between downloads to avoid browser blocking
          if (i < pdfSubmissions.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }
      } catch (error) {
        console.error(
          `Error downloading PDF for submission ${submission.id}:`,
          error
        );
      }
    }

    alert(`Downloaded ${pdfSubmissions.length} PDF files.`);
  };

  return (
    <div className="form-page">
      <div className="container">
        <motion.div
          className="page-header"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="page-title">PDF Scan Management</h1>
          <p className="page-subtitle">
            Upload, scan, and manage PDF documents with our advanced scanning
            system
          </p>
        </motion.div>

        <div className="form-layout">
          {/* Form Section */}
          <motion.div
            className="form-section"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="form-card">
              <div className="form-header">
                <h2 className="form-title">
                  {editingIndex >= 0 ? "Edit PDF Scan" : "New PDF Scan"}
                </h2>
                {editingIndex >= 0 && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setEditingIndex(-1);
                      setFormData({
                        name: "",
                        email: "",
                        phone: "",
                        pdfFile: null,
                        scanType: "document",
                        description: "",
                      });
                    }}
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit} className="form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name" className="form-label">
                      Full Name *
                    </label>
                    <div className="input-container">
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`form-input ${
                          fieldErrors.name
                            ? "error"
                            : fieldValid.name
                            ? "valid"
                            : ""
                        }`}
                        placeholder="Enter your full name"
                        required
                      />
                      {fieldValid.name && (
                        <FaCheckCircle className="input-icon valid-icon" />
                      )}
                      {fieldErrors.name && (
                        <FaExclamationCircle className="input-icon error-icon" />
                      )}
                    </div>
                    {fieldErrors.name && (
                      <motion.div
                        className="field-error"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        {fieldErrors.name}
                      </motion.div>
                    )}
                  </div>
                  <div className="form-group">
                    <label htmlFor="email" className="form-label">
                      Email Address *
                    </label>
                    <div className="input-container">
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`form-input ${
                          fieldErrors.email
                            ? "error"
                            : fieldValid.email
                            ? "valid"
                            : ""
                        }`}
                        placeholder="Enter your email"
                        required
                      />
                      {fieldValid.email && (
                        <FaCheckCircle className="input-icon valid-icon" />
                      )}
                      {fieldErrors.email && (
                        <FaExclamationCircle className="input-icon error-icon" />
                      )}
                    </div>
                    {fieldErrors.email && (
                      <motion.div
                        className="field-error"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        {fieldErrors.email}
                      </motion.div>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="phone" className="form-label">
                      Phone Number
                    </label>
                    <div className="input-container">
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className={`form-input ${
                          fieldErrors.phone
                            ? "error"
                            : fieldValid.phone
                            ? "valid"
                            : ""
                        }`}
                        placeholder="Enter your phone number"
                      />
                      {fieldValid.phone && formData.phone && (
                        <FaCheckCircle className="input-icon valid-icon" />
                      )}
                      {fieldErrors.phone && (
                        <FaExclamationCircle className="input-icon error-icon" />
                      )}
                    </div>
                    {fieldErrors.phone && (
                      <motion.div
                        className="field-error"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        {fieldErrors.phone}
                      </motion.div>
                    )}
                  </div>
                  <div className="form-group">
                    <label htmlFor="scanType" className="form-label">
                      Scan Type *
                    </label>
                    <select
                      id="scanType"
                      name="scanType"
                      value={formData.scanType}
                      onChange={handleChange}
                      className="form-input"
                      required
                    >
                      {scanTypes.map((scanType) => (
                        <option key={scanType.value} value={scanType.value}>
                          {scanType.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="pdfFile" className="form-label">
                    PDF Document *
                  </label>
                  <div className="file-upload-container">
                    <input
                      type="file"
                      id="pdfFile"
                      name="pdfFile"
                      accept=".pdf,application/pdf"
                      onChange={handleFileChange}
                      className="file-input"
                      required
                    />
                    <label htmlFor="pdfFile" className="file-upload-label">
                      <FaFilePdf className="file-icon" />
                      <span className="file-text">
                        {formData.pdfFile
                          ? formData.pdfFile.name
                          : "Choose PDF file to scan"}
                      </span>
                    </label>
                    {formData.pdfFile && (
                      <button
                        type="button"
                        onClick={removeFile}
                        className="remove-file-btn"
                        title="Remove file"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>

                  {fieldErrors.pdfFile && (
                    <motion.div
                      className="field-error"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {fieldErrors.pdfFile}
                    </motion.div>
                  )}

                  {filePreview && (
                    <div className="file-preview">
                      <iframe
                        src={filePreview}
                        title="PDF Preview"
                        className="pdf-preview"
                      />
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="description" className="form-label">
                    Description *
                  </label>
                  <div className="input-container">
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      className={`form-input form-textarea ${
                        fieldErrors.description
                          ? "error"
                          : fieldValid.description
                          ? "valid"
                          : ""
                      }`}
                      placeholder="Describe what you want to scan or any special requirements"
                      rows="4"
                      required
                    />
                    {fieldValid.description && (
                      <FaCheckCircle className="input-icon valid-icon" />
                    )}
                    {fieldErrors.description && (
                      <FaExclamationCircle className="input-icon error-icon" />
                    )}
                  </div>
                  {fieldErrors.description && (
                    <motion.div
                      className="field-error"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {fieldErrors.description}
                    </motion.div>
                  )}
                </div>

                <button type="submit" className="btn btn-primary btn-full">
                  <FaFilePdf />
                  {editingIndex >= 0 ? "Update Scan" : "Submit PDF Scan"}
                </button>
              </form>
            </div>
          </motion.div>

          {/* Submissions Section - Admin Only */}
          {isAdmin() ? (
            <motion.div
              className="submissions-section"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <div className="submissions-card">
                <div className="submissions-header">
                  <div className="admin-header">
                    <h2 className="submissions-title">
                      <FaUserShield className="admin-icon" />
                      PDF Scans ({submissions.length})
                    </h2>
                    <span className="admin-badge">Admin View</span>
                  </div>
                  <div className="submissions-actions">
                    <div className="download-group">
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={handleDownload}
                        disabled={submissions.length === 0}
                        title="Download all data and PDFs as ZIP file"
                      >
                        <FaDownload />
                        Download All
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={handleDownloadJSON}
                        disabled={submissions.length === 0}
                        title="Download only form data as JSON"
                      >
                        <FaFilePdf />
                        Data Only
                      </button>
                      <button
                        className="btn btn-accent btn-sm"
                        onClick={handleDownloadAllPDFs}
                        disabled={submissions.length === 0}
                        title="Download all PDF files individually"
                      >
                        <FaFilePdf />
                        PDFs Only
                      </button>
                    </div>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={handlePrint}
                      disabled={submissions.length === 0}
                    >
                      <FaPrint />
                      Print
                    </button>
                  </div>
                </div>

                <div className="submissions-list">
                  {submissions.length === 0 ? (
                    <div className="empty-state">
                      <p>
                        No PDF scans yet. Users can upload their first PDF
                        document for scanning.
                      </p>
                    </div>
                  ) : (
                    submissions.map((submission, index) => (
                      <motion.div
                        key={submission.id}
                        className="submission-item"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <div className="submission-header">
                          <div className="submission-info">
                            <h3 className="submission-name">
                              {submission.name}
                            </h3>
                            <span className="submission-category">
                              {
                                scanTypes.find(
                                  (type) => type.value === submission.category
                                )?.label
                              }
                            </span>
                          </div>
                          <div className="submission-actions">
                            {submission.pdfFile && (
                              <>
                                <button
                                  className="action-btn view-btn"
                                  onClick={() => handleViewPDF(submission)}
                                  title="View PDF"
                                >
                                  <FaEye />
                                </button>
                                <button
                                  className="action-btn download-btn"
                                  onClick={() => handleDownloadPDF(submission)}
                                  title="Download PDF"
                                >
                                  <FaDownload />
                                </button>
                              </>
                            )}
                            <button
                              className="action-btn edit-btn"
                              onClick={() => handleEdit(index)}
                              title="Edit"
                            >
                              <FaEdit />
                            </button>
                            <button
                              className="action-btn delete-btn"
                              onClick={() => handleDelete(index)}
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                        <div className="submission-details">
                          <p className="submission-email">{submission.email}</p>
                          {submission.phone && (
                            <p className="submission-phone">
                              {submission.phone}
                            </p>
                          )}
                          <p className="submission-message">
                            {submission.message || submission.description}
                          </p>
                          {submission.pdfFile && (
                            <div className="submission-pdf">
                              <p>
                                <FaFilePdf />{" "}
                                {submission.pdfFile.originalName ||
                                  submission.pdfFileName}
                              </p>
                              <p className="pdf-debug-info">
                                <small>
                                  File:{" "}
                                  {submission.pdfFile.filename || "No filename"}{" "}
                                  | Size:{" "}
                                  {submission.pdfFile.size
                                    ? `${Math.round(
                                        submission.pdfFile.size / 1024
                                      )}KB`
                                    : "Unknown"}
                                </small>
                              </p>
                            </div>
                          )}
                          <p className="submission-date">
                            Submitted:{" "}
                            {new Date(submission.submittedAt).toLocaleString()}
                          </p>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              className="submissions-section"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <div className="submissions-card admin-restricted">
                <div className="admin-restricted-content">
                  <div className="admin-restricted-icon">
                    <FaLock />
                  </div>
                  <h2 className="admin-restricted-title">
                    Admin Access Required
                  </h2>
                  <p className="admin-restricted-message">
                    Only administrators can view and download form submissions.
                    Please log in with an admin account to access this feature.
                  </p>
                  {!user && (
                    <div className="admin-restricted-actions">
                      <a href="/login" className="btn btn-primary">
                        Login as Admin
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Print Preview */}
      {showPrintPreview && (
        <div className="print-preview">
          <div className="print-content">
            <h1>PDF Scan Submissions Report</h1>
            <p>Generated on: {new Date().toLocaleString()}</p>
            <div className="print-submissions">
              {submissions.map((submission, index) => (
                <div key={submission.id} className="print-submission">
                  <h3>Scan #{index + 1}</h3>
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
                    <strong>Scan Type:</strong>{" "}
                    {
                      scanTypes.find(
                        (type) => type.value === submission.category
                      )?.label
                    }
                  </p>
                  <p>
                    <strong>Description:</strong>{" "}
                    {submission.message || submission.description}
                  </p>
                  {submission.pdfFile && (
                    <p>
                      <strong>PDF File:</strong>{" "}
                      {submission.pdfFile.originalName ||
                        submission.pdfFileName}
                    </p>
                  )}
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

export default FormPage;
