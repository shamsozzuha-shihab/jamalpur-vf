const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    // Simple in-memory cache with TTL
    this.cache = new Map();
    this.cacheDuration = 5 * 60 * 1000; // 5 minutes
    // Request deduplication
    this.pendingRequests = new Map();
  }

  // Cache management with improved performance
  getCachedData(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  // Request deduplication to prevent multiple identical requests
  async makeRequest(url, options = {}) {
    const requestKey = `${options.method || 'GET'}:${url}`;
    
    // If request is already pending, return the same promise
    if (this.pendingRequests.has(requestKey)) {
      return this.pendingRequests.get(requestKey);
    }

    const requestPromise = this._makeActualRequest(url, options);
    this.pendingRequests.set(requestKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      this.pendingRequests.delete(requestKey);
    }
  }

  async _makeActualRequest(url, options = {}) {
    const token = localStorage.getItem('token');
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${this.baseURL}${url}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  setCachedData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache(key) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  // Helper method to get headers with auth token
  getHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  // Helper method to handle API responses with better error handling
  async handleResponse(response) {
    if (!response.ok) {
      let errorMessage = 'Something went wrong';
      try {
        const error = await response.json();
        errorMessage = error.message || errorMessage;
      } catch (e) {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    return response.json();
  }

  // Request deduplication - prevent multiple identical requests
  async deduplicatedRequest(key, requestFn) {
    // If same request is already pending, return that promise
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }

    // Create new request
    const promise = requestFn().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  // Auth API calls
  async register(userData) {
    const response = await fetch(`${this.baseURL}/auth/register`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(userData)
    });
    return this.handleResponse(response);
  }

  async login(credentials) {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(credentials)
    });
    return this.handleResponse(response);
  }

  async getProfile() {
    const response = await fetch(`${this.baseURL}/auth/profile`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  async forgotPassword(email) {
    const response = await fetch(`${this.baseURL}/auth/forgot-password`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email })
    });
    return this.handleResponse(response);
  }

  async verifyResetToken(token) {
    const response = await fetch(`${this.baseURL}/auth/verify-reset-token/${token}`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  async resetPassword(token, newPassword) {
    const response = await fetch(`${this.baseURL}/auth/reset-password/${token}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ newPassword })
    });
    return this.handleResponse(response);
  }

  async changePassword(currentPassword, newPassword) {
    const response = await fetch(`${this.baseURL}/auth/change-password`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ currentPassword, newPassword })
    });
    return this.handleResponse(response);
  }

  // Admin management API calls
  async getAdmins() {
    const response = await fetch(`${this.baseURL}/admin/users`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  async createAdmin(adminData) {
    const response = await fetch(`${this.baseURL}/admin/users`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(adminData)
    });
    return this.handleResponse(response);
  }

  async deleteAdmin(adminId) {
    const response = await fetch(`${this.baseURL}/admin/users/${adminId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  async updateProfile(profileData) {
    const response = await fetch(`${this.baseURL}/admin/profile`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(profileData)
    });
    return this.handleResponse(response);
  }

  // Form API calls
  async submitForm(formData) {
    const response = await fetch(`${this.baseURL}/forms/submit`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(formData)
    });
    return this.handleResponse(response);
  }

  async submitFormWithFile(formData) {
    const token = localStorage.getItem('token');
    const headers = {
      ...(token && { Authorization: `Bearer ${token}` })
    };

    const response = await fetch(`${this.baseURL}/forms/submit-with-file`, {
      method: 'POST',
      headers,
      body: formData
    });
    return this.handleResponse(response);
  }

  async getFormSubmissions() {
    const response = await fetch(`${this.baseURL}/forms/submissions`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  // Notice API calls with caching
  async getNotices() {
    const cacheKey = 'notices';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    return this.deduplicatedRequest(cacheKey, async () => {
      const response = await fetch(`${this.baseURL}/notices`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      const data = await this.handleResponse(response);
      this.setCachedData(cacheKey, data);
      return data;
    });
  }

  async createNotice(noticeData) {
    const response = await fetch(`${this.baseURL}/notices`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(noticeData)
    });
    const result = await this.handleResponse(response);
    // Clear cache after creating
    this.clearCache('notices');
    return result;
  }

  async updateNotice(id, noticeData) {
    const response = await fetch(`${this.baseURL}/notices/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(noticeData)
    });
    const result = await this.handleResponse(response);
    // Clear cache after updating
    this.clearCache('notices');
    return result;
  }

  async deleteNotice(id) {
    const response = await fetch(`${this.baseURL}/notices/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    const result = await this.handleResponse(response);
    // Clear cache after deleting
    this.clearCache('notices');
    return result;
  }

  // News API calls with caching
  async getNews() {
    const cacheKey = 'news';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    return this.deduplicatedRequest(cacheKey, async () => {
      const response = await fetch(`${this.baseURL}/news`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      const data = await this.handleResponse(response);
      this.setCachedData(cacheKey, data);
      return data;
    });
  }

  async getNewsAdmin() {
    const response = await fetch(`${this.baseURL}/news/admin`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  async createNews(newsData) {
    console.log('🌐 API: Creating news with data:', newsData);
    console.log('🌐 API: URL:', `${this.baseURL}/news`);
    console.log('🌐 API: Headers:', this.getHeaders());
    
    const response = await fetch(`${this.baseURL}/news`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(newsData)
    });
    
    console.log('🌐 API: Response status:', response.status);
    console.log('🌐 API: Response ok:', response.ok);
    
    const result = await this.handleResponse(response);
    console.log('🌐 API: Response result:', result);
    
    // Clear cache after creating
    this.clearCache('news');
    this.clearCache('newsAdmin');
    return result;
  }

  async updateNews(id, newsData) {
    const response = await fetch(`${this.baseURL}/news/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(newsData)
    });
    const result = await this.handleResponse(response);
    // Clear cache after updating
    this.clearCache('news');
    this.clearCache('newsAdmin');
    return result;
  }

  async deleteNews(id) {
    const response = await fetch(`${this.baseURL}/news/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    const result = await this.handleResponse(response);
    // Clear cache after deleting
    this.clearCache('news');
    this.clearCache('newsAdmin');
    return result;
  }

  // Health check
  async healthCheck() {
    const response = await fetch(`${this.baseURL}/health`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;
