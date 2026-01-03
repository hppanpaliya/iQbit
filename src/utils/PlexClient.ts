import axios from "axios";
import Cookies from "js-cookie";

// Plex API Types
export interface PlexUser {
  id: number;
  uuid: string;
  username: string;
  email: string;
  thumb: string;
  authToken?: string;
}

export interface PlexServer {
  name: string;
  host: string;
  port: number;
  machineIdentifier: string;
  version: string;
}

export interface PlexLibrarySection {
  key: string;
  type: string;
  title: string;
  agent: string;
  scanner: string;
  language: string;
  uuid: string;
}

export interface PlexMediaItem {
  ratingKey: string;
  key: string;
  guid: string;
  title: string;
  year?: number;
  thumb?: string;
  art?: string;
  summary?: string;
  type: string;
  addedAt: number;
  updatedAt: number;
}

const PLEX_CLIENT_IDENTIFIER = "iQbit-App";
const PLEX_PRODUCT = "iQbit";
const PLEX_VERSION = "1.0.0";

// Storage keys
const PLEX_TOKEN_KEY = "plex_auth_token";
const PLEX_USER_KEY = "plex_user_data";
const PLEX_SERVER_KEY = "plex_server_data";

export class PlexClient {
  private authToken: string | null = null;
  private userData: PlexUser | null = null;
  private serverData: PlexServer | null = null;

  constructor() {
    this.loadFromStorage();
  }

  // Load stored credentials
  private loadFromStorage() {
    try {
      const token = localStorage.getItem(PLEX_TOKEN_KEY);
      const user = localStorage.getItem(PLEX_USER_KEY);
      const server = localStorage.getItem(PLEX_SERVER_KEY);

      if (token) this.authToken = token;
      if (user) this.userData = JSON.parse(user);
      if (server) this.serverData = JSON.parse(server);
    } catch (error) {
      console.error("Failed to load Plex data from storage:", error);
    }
  }

  // Save to storage
  private saveToStorage() {
    try {
      if (this.authToken) {
        localStorage.setItem(PLEX_TOKEN_KEY, this.authToken);
      }
      if (this.userData) {
        localStorage.setItem(PLEX_USER_KEY, JSON.stringify(this.userData));
      }
      if (this.serverData) {
        localStorage.setItem(PLEX_SERVER_KEY, JSON.stringify(this.serverData));
      }
    } catch (error) {
      console.error("Failed to save Plex data to storage:", error);
    }
  }

  // Get Plex headers
  private getHeaders() {
    return {
      "X-Plex-Client-Identifier": PLEX_CLIENT_IDENTIFIER,
      "X-Plex-Product": PLEX_PRODUCT,
      "X-Plex-Version": PLEX_VERSION,
      "X-Plex-Token": this.authToken || "",
      Accept: "application/json",
    };
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.authToken && !!this.userData;
  }

  // Get current user
  getUser(): PlexUser | null {
    return this.userData;
  }

  // Get current server
  getServer(): PlexServer | null {
    return this.serverData;
  }

  // Authenticate with Plex token
  async authenticateWithToken(token: string): Promise<PlexUser> {
    try {
      this.authToken = token;
      
      // Get user info from Plex
      const response = await axios.get("https://plex.tv/users/account.json", {
        headers: this.getHeaders(),
      });

      const userData: PlexUser = {
        id: response.data.user.id,
        uuid: response.data.user.uuid,
        username: response.data.user.username,
        email: response.data.user.email,
        thumb: response.data.user.thumb,
        authToken: token,
      };

      this.userData = userData;
      this.saveToStorage();

      return userData;
    } catch (error) {
      console.error("Plex authentication failed:", error);
      throw new Error("Failed to authenticate with Plex");
    }
  }

  // Sign out
  signOut() {
    this.authToken = null;
    this.userData = null;
    this.serverData = null;
    localStorage.removeItem(PLEX_TOKEN_KEY);
    localStorage.removeItem(PLEX_USER_KEY);
    localStorage.removeItem(PLEX_SERVER_KEY);
  }

  // Set server manually (for users who want to specify their server)
  setServer(server: PlexServer) {
    this.serverData = server;
    this.saveToStorage();
  }

  // Get Plex libraries
  async getLibraries(): Promise<PlexLibrarySection[]> {
    if (!this.serverData || !this.authToken) {
      throw new Error("No Plex server configured");
    }

    try {
      const url = `http://${this.serverData.host}:${this.serverData.port}/library/sections`;
      const response = await axios.get(url, {
        headers: this.getHeaders(),
      });

      return response.data.MediaContainer.Directory || [];
    } catch (error) {
      console.error("Failed to get Plex libraries:", error);
      throw new Error("Failed to fetch Plex libraries");
    }
  }

  // Search Plex library
  async searchLibrary(query: string): Promise<PlexMediaItem[]> {
    if (!this.serverData || !this.authToken) {
      throw new Error("No Plex server configured");
    }

    try {
      const url = `http://${this.serverData.host}:${this.serverData.port}/search`;
      const response = await axios.get(url, {
        params: { query },
        headers: this.getHeaders(),
      });

      return response.data.MediaContainer.Metadata || [];
    } catch (error) {
      console.error("Failed to search Plex library:", error);
      return [];
    }
  }

  // Check if media is in Plex library (by title/year)
  async isMediaInLibrary(title: string, year?: number): Promise<boolean> {
    try {
      const results = await this.searchLibrary(title);
      if (!results || results.length === 0) return false;

      // If year is provided, match both title and year
      if (year) {
        return results.some(
          (item) =>
            item.title.toLowerCase().includes(title.toLowerCase()) &&
            item.year === year
        );
      }

      // Otherwise, just match title
      return results.some((item) =>
        item.title.toLowerCase().includes(title.toLowerCase())
      );
    } catch (error) {
      console.error("Failed to check Plex library:", error);
      return false;
    }
  }
}

// Singleton instance
export const plexClient = new PlexClient();
