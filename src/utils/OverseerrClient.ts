import axios from "axios";

// Overseerr API Types based on https://api-docs.overseerr.dev

export interface OverseerrUser {
  id: number;
  email: string;
  username?: string;
  plexToken?: string;
  plexUsername?: string;
  avatar?: string;
  displayName: string;
  permissions: number;
}

export interface OverseerrSettings {
  id: number;
  applicationUrl: string;
  csrfProtection: boolean;
  hideAvailable: boolean;
  localLogin: boolean;
  movie4kEnabled: boolean;
  series4kEnabled: boolean;
  region: string;
  originalLanguage: string;
  trustProxy: boolean;
}

export interface OverseerrMediaInfo {
  id: number;
  tmdbId: number;
  tvdbId?: number;
  status: number;
  status4k: number;
  mediaType: "movie" | "tv";
}

export interface OverseerrRequest {
  id: number;
  status: number;
  media: {
    id: number;
    mediaType: "movie" | "tv";
    tmdbId: number;
    tvdbId?: number;
    status: number;
    status4k: number;
  };
  createdAt: string;
  updatedAt: string;
  requestedBy: OverseerrUser;
  modifiedBy?: OverseerrUser;
  is4k: boolean;
  serverId?: number;
  profileId?: number;
  rootFolder?: string;
  seasons?: number[];
}

export interface OverseerrMovie {
  id: number;
  adult: boolean;
  backdropPath?: string;
  budget: number;
  genres: { id: number; name: string }[];
  homepage?: string;
  imdbId?: string;
  originalLanguage: string;
  originalTitle: string;
  overview?: string;
  popularity: number;
  posterPath?: string;
  releaseDate: string;
  revenue: number;
  runtime?: number;
  status: string;
  tagline?: string;
  title: string;
  video: boolean;
  voteAverage: number;
  voteCount: number;
  credits?: {
    cast: any[];
    crew: any[];
  };
  mediaInfo?: OverseerrMediaInfo;
}

export interface OverseerrTVShow {
  id: number;
  backdropPath?: string;
  createdBy: { id: number; name: string }[];
  episodeRunTime: number[];
  firstAirDate: string;
  genres: { id: number; name: string }[];
  homepage?: string;
  inProduction: boolean;
  languages: string[];
  lastAirDate: string;
  name: string;
  networks: { id: number; name: string; logoPath?: string }[];
  numberOfEpisodes: number;
  numberOfSeasons: number;
  originCountry: string[];
  originalLanguage: string;
  originalName: string;
  overview?: string;
  popularity: number;
  posterPath?: string;
  status: string;
  tagline?: string;
  type: string;
  voteAverage: number;
  voteCount: number;
  credits?: {
    cast: any[];
    crew: any[];
  };
  mediaInfo?: OverseerrMediaInfo;
}

export interface OverseerrSearchResult {
  page: number;
  totalPages: number;
  totalResults: number;
  results: (OverseerrMovie | OverseerrTVShow)[];
}

// Storage keys
const OVERSEERR_URL_KEY = "overseerr_url";
const OVERSEERR_API_KEY_KEY = "overseerr_api_key";

export class OverseerrClient {
  private baseUrl: string | null = null;
  private apiKey: string | null = null;
  private axiosInstance: any = null;

  constructor() {
    this.loadFromStorage();
    this.initializeAxios();
  }

  // Load stored configuration
  private loadFromStorage() {
    try {
      const url = localStorage.getItem(OVERSEERR_URL_KEY);
      const key = localStorage.getItem(OVERSEERR_API_KEY_KEY);

      if (url) this.baseUrl = url;
      if (key) this.apiKey = key;
    } catch (error) {
      console.error("Failed to load Overseerr config from storage:", error);
    }
  }

  // Save to storage
  private saveToStorage() {
    try {
      if (this.baseUrl) {
        localStorage.setItem(OVERSEERR_URL_KEY, this.baseUrl);
      }
      if (this.apiKey) {
        localStorage.setItem(OVERSEERR_API_KEY_KEY, this.apiKey);
      }
    } catch (error) {
      console.error("Failed to save Overseerr config to storage:", error);
    }
  }

  // Initialize axios instance
  private initializeAxios() {
    if (this.baseUrl && this.apiKey) {
      this.axiosInstance = axios.create({
        baseURL: this.baseUrl,
        headers: {
          "X-Api-Key": this.apiKey,
          "Content-Type": "application/json",
        },
      });
    }
  }

  // Configure Overseerr connection
  configure(url: string, apiKey: string) {
    // Normalize URL - remove trailing slash
    this.baseUrl = url.endsWith("/") ? url.slice(0, -1) : url;
    this.apiKey = apiKey;
    this.saveToStorage();
    this.initializeAxios();
  }

  // Check if configured
  isConfigured(): boolean {
    return !!this.baseUrl && !!this.apiKey && !!this.axiosInstance;
  }

  // Get configuration
  getConfig() {
    return {
      url: this.baseUrl,
      hasApiKey: !!this.apiKey,
    };
  }

  // Clear configuration
  clearConfig() {
    this.baseUrl = null;
    this.apiKey = null;
    this.axiosInstance = null;
    localStorage.removeItem(OVERSEERR_URL_KEY);
    localStorage.removeItem(OVERSEERR_API_KEY_KEY);
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    if (!this.isConfigured()) {
      throw new Error("Overseerr not configured");
    }

    try {
      const response = await this.axiosInstance.get("/api/v1/status");
      return response.status === 200;
    } catch (error) {
      console.error("Overseerr connection test failed:", error);
      return false;
    }
  }

  // Get current user
  async getCurrentUser(): Promise<OverseerrUser> {
    if (!this.isConfigured()) {
      throw new Error("Overseerr not configured");
    }

    try {
      const response = await this.axiosInstance.get("/api/v1/auth/me");
      return response.data;
    } catch (error) {
      console.error("Failed to get current user:", error);
      throw new Error("Failed to get current user from Overseerr");
    }
  }

  // Search for movies and TV shows
  async search(query: string, page: number = 1): Promise<OverseerrSearchResult> {
    if (!this.isConfigured()) {
      throw new Error("Overseerr not configured");
    }

    try {
      const response = await this.axiosInstance.get("/api/v1/search", {
        params: { query, page },
      });
      return response.data;
    } catch (error) {
      console.error("Search failed:", error);
      throw new Error("Failed to search Overseerr");
    }
  }

  // Get movie details
  async getMovie(tmdbId: number): Promise<OverseerrMovie> {
    if (!this.isConfigured()) {
      throw new Error("Overseerr not configured");
    }

    try {
      const response = await this.axiosInstance.get(`/api/v1/movie/${tmdbId}`);
      return response.data;
    } catch (error) {
      console.error("Failed to get movie:", error);
      throw new Error("Failed to get movie from Overseerr");
    }
  }

  // Get TV show details
  async getTVShow(tmdbId: number): Promise<OverseerrTVShow> {
    if (!this.isConfigured()) {
      throw new Error("Overseerr not configured");
    }

    try {
      const response = await this.axiosInstance.get(`/api/v1/tv/${tmdbId}`);
      return response.data;
    } catch (error) {
      console.error("Failed to get TV show:", error);
      throw new Error("Failed to get TV show from Overseerr");
    }
  }

  // Request a movie
  async requestMovie(
    tmdbId: number,
    is4k: boolean = false,
    serverId?: number,
    profileId?: number,
    rootFolder?: string
  ): Promise<OverseerrRequest> {
    if (!this.isConfigured()) {
      throw new Error("Overseerr not configured");
    }

    try {
      const response = await this.axiosInstance.post("/api/v1/request", {
        mediaId: tmdbId,
        mediaType: "movie",
        is4k,
        serverId,
        profileId,
        rootFolder,
      });
      return response.data;
    } catch (error) {
      console.error("Failed to request movie:", error);
      throw new Error("Failed to request movie in Overseerr");
    }
  }

  // Request a TV show
  async requestTVShow(
    tmdbId: number,
    seasons: number[],
    is4k: boolean = false,
    serverId?: number,
    profileId?: number,
    rootFolder?: string
  ): Promise<OverseerrRequest> {
    if (!this.isConfigured()) {
      throw new Error("Overseerr not configured");
    }

    try {
      const response = await this.axiosInstance.post("/api/v1/request", {
        mediaId: tmdbId,
        mediaType: "tv",
        seasons,
        is4k,
        serverId,
        profileId,
        rootFolder,
      });
      return response.data;
    } catch (error) {
      console.error("Failed to request TV show:", error);
      throw new Error("Failed to request TV show in Overseerr");
    }
  }

  // Get all requests
  async getRequests(
    take: number = 10,
    skip: number = 0,
    filter: string = "all"
  ): Promise<{ pageInfo: any; results: OverseerrRequest[] }> {
    if (!this.isConfigured()) {
      throw new Error("Overseerr not configured");
    }

    try {
      const response = await this.axiosInstance.get("/api/v1/request", {
        params: { take, skip, filter },
      });
      return response.data;
    } catch (error) {
      console.error("Failed to get requests:", error);
      throw new Error("Failed to get requests from Overseerr");
    }
  }

  // Get request count
  async getRequestCount(): Promise<number> {
    if (!this.isConfigured()) {
      throw new Error("Overseerr not configured");
    }

    try {
      const response = await this.axiosInstance.get("/api/v1/request/count");
      return response.data.total || 0;
    } catch (error) {
      console.error("Failed to get request count:", error);
      return 0;
    }
  }

  // Delete/cancel a request
  async deleteRequest(requestId: number): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error("Overseerr not configured");
    }

    try {
      await this.axiosInstance.delete(`/api/v1/request/${requestId}`);
    } catch (error) {
      console.error("Failed to delete request:", error);
      throw new Error("Failed to delete request from Overseerr");
    }
  }

  // Approve a request (requires appropriate permissions)
  async approveRequest(requestId: number): Promise<OverseerrRequest> {
    if (!this.isConfigured()) {
      throw new Error("Overseerr not configured");
    }

    try {
      const response = await this.axiosInstance.post(
        `/api/v1/request/${requestId}/approve`
      );
      return response.data;
    } catch (error) {
      console.error("Failed to approve request:", error);
      throw new Error("Failed to approve request in Overseerr");
    }
  }

  // Decline a request (requires appropriate permissions)
  async declineRequest(requestId: number): Promise<OverseerrRequest> {
    if (!this.isConfigured()) {
      throw new Error("Overseerr not configured");
    }

    try {
      const response = await this.axiosInstance.post(
        `/api/v1/request/${requestId}/decline`
      );
      return response.data;
    } catch (error) {
      console.error("Failed to decline request:", error);
      throw new Error("Failed to decline request in Overseerr");
    }
  }

  // Get discover movies (trending, popular, etc.)
  async discoverMovies(
    type: "upcoming" | "trending" | "popular" = "popular",
    page: number = 1
  ): Promise<OverseerrSearchResult> {
    if (!this.isConfigured()) {
      throw new Error("Overseerr not configured");
    }

    try {
      const response = await this.axiosInstance.get(`/api/v1/discover/movies/${type}`, {
        params: { page },
      });
      return response.data;
    } catch (error) {
      console.error("Failed to discover movies:", error);
      throw new Error("Failed to discover movies from Overseerr");
    }
  }

  // Get discover TV shows
  async discoverTVShows(
    type: "upcoming" | "trending" | "popular" = "popular",
    page: number = 1
  ): Promise<OverseerrSearchResult> {
    if (!this.isConfigured()) {
      throw new Error("Overseerr not configured");
    }

    try {
      const response = await this.axiosInstance.get(`/api/v1/discover/tv/${type}`, {
        params: { page },
      });
      return response.data;
    } catch (error) {
      console.error("Failed to discover TV shows:", error);
      throw new Error("Failed to discover TV shows from Overseerr");
    }
  }
}

// Singleton instance
export const overseerrClient = new OverseerrClient();
