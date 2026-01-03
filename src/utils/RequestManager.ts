// Media Request Management (Frontend-only, localStorage-based)

export type MediaType = "movie" | "tv";

export type RequestStatus =
  | "pending"
  | "approved"
  | "downloading"
  | "available"
  | "failed";

export type QualityProfile = "SD" | "720p" | "1080p" | "4K" | "Any";

export interface MediaRequest {
  id: string;
  mediaType: MediaType;
  tmdbId: number;
  title: string;
  year?: number;
  overview?: string;
  posterPath?: string;
  backdropPath?: string;
  quality: QualityProfile;
  status: RequestStatus;
  requestedBy: string;
  requestedAt: number;
  updatedAt: number;
  torrentHash?: string;
  categoryName?: string;
  savePath?: string;
}

const REQUESTS_STORAGE_KEY = "media_requests";
const QUALITY_PROFILES_KEY = "quality_profiles";

export class RequestManager {
  private requests: Map<string, MediaRequest> = new Map();
  private defaultQuality: QualityProfile = "1080p";

  constructor() {
    this.loadFromStorage();
  }

  // Load requests from localStorage
  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(REQUESTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.requests = new Map(Object.entries(parsed));
      }

      const qualityStored = localStorage.getItem(QUALITY_PROFILES_KEY);
      if (qualityStored) {
        this.defaultQuality = JSON.parse(qualityStored);
      }
    } catch (error) {
      console.error("Failed to load requests from storage:", error);
    }
  }

  // Save requests to localStorage
  private saveToStorage() {
    try {
      const obj = Object.fromEntries(this.requests);
      localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(obj));
    } catch (error) {
      console.error("Failed to save requests to storage:", error);
    }
  }

  // Generate unique ID
  private generateId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Create a new media request
  createRequest(
    mediaType: MediaType,
    tmdbId: number,
    title: string,
    requestedBy: string,
    options?: {
      year?: number;
      overview?: string;
      posterPath?: string;
      backdropPath?: string;
      quality?: QualityProfile;
      categoryName?: string;
      savePath?: string;
    }
  ): MediaRequest {
    const id = this.generateId();
    const now = Date.now();

    const request: MediaRequest = {
      id,
      mediaType,
      tmdbId,
      title,
      year: options?.year,
      overview: options?.overview,
      posterPath: options?.posterPath,
      backdropPath: options?.backdropPath,
      quality: options?.quality || this.defaultQuality,
      status: "pending",
      requestedBy,
      requestedAt: now,
      updatedAt: now,
      categoryName: options?.categoryName,
      savePath: options?.savePath,
    };

    this.requests.set(id, request);
    this.saveToStorage();

    return request;
  }

  // Get request by ID
  getRequest(id: string): MediaRequest | undefined {
    return this.requests.get(id);
  }

  // Get request by TMDB ID
  getRequestByTmdbId(tmdbId: number): MediaRequest | undefined {
    return Array.from(this.requests.values()).find((r) => r.tmdbId === tmdbId);
  }

  // Get all requests
  getAllRequests(): MediaRequest[] {
    return Array.from(this.requests.values()).sort(
      (a, b) => b.requestedAt - a.requestedAt
    );
  }

  // Get requests by status
  getRequestsByStatus(status: RequestStatus): MediaRequest[] {
    return this.getAllRequests().filter((r) => r.status === status);
  }

  // Get requests by media type
  getRequestsByMediaType(mediaType: MediaType): MediaRequest[] {
    return this.getAllRequests().filter((r) => r.mediaType === mediaType);
  }

  // Update request status
  updateRequestStatus(id: string, status: RequestStatus): MediaRequest | null {
    const request = this.requests.get(id);
    if (!request) return null;

    request.status = status;
    request.updatedAt = Date.now();
    this.requests.set(id, request);
    this.saveToStorage();

    return request;
  }

  // Update request with torrent info
  updateRequestTorrent(
    id: string,
    torrentHash: string,
    categoryName?: string,
    savePath?: string
  ): MediaRequest | null {
    const request = this.requests.get(id);
    if (!request) return null;

    request.torrentHash = torrentHash;
    request.status = "downloading";
    request.updatedAt = Date.now();
    if (categoryName) request.categoryName = categoryName;
    if (savePath) request.savePath = savePath;

    this.requests.set(id, request);
    this.saveToStorage();

    return request;
  }

  // Delete request
  deleteRequest(id: string): boolean {
    const deleted = this.requests.delete(id);
    if (deleted) {
      this.saveToStorage();
    }
    return deleted;
  }

  // Check if media is already requested
  isMediaRequested(tmdbId: number): boolean {
    return Array.from(this.requests.values()).some(
      (r) => r.tmdbId === tmdbId && r.status !== "failed"
    );
  }

  // Get request status for media
  getMediaRequestStatus(tmdbId: number): RequestStatus | null {
    const request = this.getRequestByTmdbId(tmdbId);
    return request ? request.status : null;
  }

  // Set default quality profile
  setDefaultQuality(quality: QualityProfile) {
    this.defaultQuality = quality;
    localStorage.setItem(QUALITY_PROFILES_KEY, JSON.stringify(quality));
  }

  // Get default quality profile
  getDefaultQuality(): QualityProfile {
    return this.defaultQuality;
  }

  // Get request statistics
  getStatistics() {
    const requests = this.getAllRequests();
    return {
      total: requests.length,
      pending: requests.filter((r) => r.status === "pending").length,
      approved: requests.filter((r) => r.status === "approved").length,
      downloading: requests.filter((r) => r.status === "downloading").length,
      available: requests.filter((r) => r.status === "available").length,
      failed: requests.filter((r) => r.status === "failed").length,
      movies: requests.filter((r) => r.mediaType === "movie").length,
      tv: requests.filter((r) => r.mediaType === "tv").length,
    };
  }

  // Clear all requests (for testing/reset)
  clearAllRequests() {
    this.requests.clear();
    this.saveToStorage();
  }

  // Export requests (for backup)
  exportRequests(): string {
    return JSON.stringify(Array.from(this.requests.entries()));
  }

  // Import requests (from backup)
  importRequests(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      this.requests = new Map(parsed);
      this.saveToStorage();
      return true;
    } catch (error) {
      console.error("Failed to import requests:", error);
      return false;
    }
  }
}

// Singleton instance
export const requestManager = new RequestManager();
