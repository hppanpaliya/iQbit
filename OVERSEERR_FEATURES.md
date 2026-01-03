# Overseerr-like Features for iQbit

This document describes the new Overseerr-inspired features added to iQbit for managing media requests without a backend server.

## Features Overview

### 1. Plex Authentication
- **Location**: Settings → Plex
- Token-based authentication with Plex
- Server configuration for library browsing
- User profile storage in browser localStorage
- Privacy-focused (no third-party data sharing)

### 2. Media Request Management
- **Location**: Sidebar → Requests
- Create, track, and manage media requests
- Request statuses: Pending, Approved, Downloading, Available, Failed
- Statistics dashboard showing request counts
- Filter requests by status and media type

### 3. Quality Profile Selection
- Choose from predefined quality profiles:
  - **4K UHD** - Best quality
  - **1080p Full HD** - Recommended
  - **720p HD** - Standard
  - **SD** - Basic
  - **Any** - Flexible

### 4. Request Button Integration
- Integrated into Trending page for movies and TV shows
- Shows availability status from Plex library
- Quick quality selection dropdown
- Visual status indicators

### 5. Media Availability Detection
- Checks if media already exists in Plex library
- Shows "In Library" status for existing content
- Prevents duplicate requests

## Usage Guide

### Setting Up Plex Integration

1. **Navigate to Plex Settings**
   - Go to Settings → Plex or use the sidebar

2. **Choose Authentication Method**

   **Option A: Username & Password (Recommended)**
   - Enter your Plex username or email
   - Enter your Plex password
   - Click "Sign In with Plex"
   - This method uses cookie-based authentication similar to Overseerr

   **Option B: Authentication Token**
   - Sign in to [app.plex.tv](https://app.plex.tv)
   - Play any media item
   - Click three dots (...) → "Get Info"
   - Click "View XML"
   - Look for "X-Plex-Token" in the URL
   - Or follow the [Plex Support Guide](https://support.plex.tv/articles/204059436-finding-an-authentication-token-x-plex-token/)
   - Paste your token in the authentication field
   - Click "Connect with Token"

4. **Configure Server (Optional)**
   - Enter your server URL/IP (e.g., `192.168.1.100`)
   - Enter port (default: `32400`)
   - Click "Save Server Settings"

### Requesting Media

1. **Browse Content**
   - Go to Trending page
   - Browse movies or TV shows

2. **Request Media**
   - Click on any movie/TV show poster
   - Click the "Request" button
   - Select your preferred quality
   - Request is created and tracked

3. **Manage Requests**
   - Go to Requests page
   - View all requests and their statuses
   - Approve/reject pending requests
   - Mark requests as downloading or available
   - Delete completed requests

### Request Workflow

```
Pending → Approved → Downloading → Available
   ↓
Failed (if issues occur)
```

**Status Meanings:**
- **Pending**: Waiting for approval
- **Approved**: Ready to download
- **Downloading**: Currently being downloaded
- **Available**: Ready to watch in your library
- **Failed**: Request failed or was rejected

## Technical Details

### Data Storage
All data is stored locally in the browser's localStorage:
- **Plex Authentication**: Token, user info, server config
- **Media Requests**: Request details, status, metadata
- **Quality Profiles**: User preferences

### Privacy & Security
- No backend server required
- All data stays in your browser
- Direct communication with Plex services
- Token stored securely in localStorage
- No analytics or tracking

### API Integration
- **TMDB API**: Movie and TV show metadata
- **Plex API**: Library search and availability checking
- **qBitTorrent API**: Torrent management

## Features Comparison with Overseerr

| Feature | Overseerr | iQbit Implementation |
|---------|-----------|---------------------|
| Plex Authentication | ✅ | ✅ |
| Request Management | ✅ | ✅ |
| Quality Profiles | ✅ | ✅ |
| Library Detection | ✅ | ✅ |
| Multi-user Support | ✅ | ⚠️ (Single-user via browser) |
| Notifications | ✅ | ❌ |
| Sonarr/Radarr Integration | ✅ | ❌ (Direct torrent download) |
| Request Approval | ✅ | ✅ (Manual) |
| User Permissions | ✅ | ❌ |

## Limitations

1. **Single User**: Each browser session is independent
2. **No Backend**: Cannot share requests across devices
3. **Manual Management**: Requests don't auto-process
4. **No Notifications**: No push notifications for status changes
5. **Browser Storage**: Data cleared if browser cache is cleared

## Export/Import Requests

To backup your requests:
1. Open browser console (F12)
2. Run: `localStorage.getItem('media_requests')`
3. Copy the output to a safe location

To restore:
1. Open browser console
2. Run: `localStorage.setItem('media_requests', 'YOUR_BACKUP_DATA')`
3. Refresh the page

## Tips & Best Practices

1. **Regular Backups**: Export your requests periodically
2. **Token Security**: Keep your Plex token secure
3. **Quality Selection**: Choose quality based on your storage capacity
4. **Request Cleanup**: Delete completed requests to keep the list manageable
5. **Status Updates**: Manually update request statuses as you process them

## Troubleshooting

### Plex Authentication Issues
- Verify your token is correct
- Check if you can access Plex.tv
- Ensure you're using the correct server IP/port

### Library Detection Not Working
- Confirm server settings are correct
- Check if Plex server is accessible
- Verify network connectivity

### Requests Not Saving
- Check browser localStorage is enabled
- Clear browser cache and try again
- Verify you have enough storage space

## Future Enhancements

Potential improvements for future versions:
- [ ] Automatic request approval based on rules
- [ ] Integration with torrent search providers
- [ ] Request notifications via browser API
- [ ] Multi-device sync via optional backend
- [ ] Season/episode level requests for TV shows
- [ ] Request scheduling and queuing
- [ ] Advanced filtering and sorting options

## Support

For issues, suggestions, or contributions:
- Open an issue on GitHub
- Check existing documentation
- Review the codebase for implementation details
