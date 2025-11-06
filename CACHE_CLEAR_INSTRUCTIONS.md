# Cache Clearing Instructions

## How to Clear Browser Cache

### For Users Visiting Your Site:
1. **Hard Refresh:**
   - Windows: `Ctrl + F5` or `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

2. **Clear Browser Cache Manually:**
   - Chrome: Settings → Privacy → Clear browsing data
   - Firefox: Settings → Privacy → Clear Data
   - Safari: Preferences → Privacy → Manage Website Data

### For Your Production Server:

1. **Update Version Numbers:**
   - When you make changes to CSS or images, update the version number in HTML files
   - Example: `styles.css?v=1.0` → `styles.css?v=1.1`
   - This forces browsers to fetch the new version

2. **Current Version Numbers:**
   - CSS: `?v=1.0`
   - Images: `?v=1.0`
   
3. **To Force Cache Clear for All Users:**
   - Change version number in all HTML files
   - Example: Change `?v=1.0` to `?v=1.1` or `?v=2.0`

## Performance Optimizations Applied:

✅ **Cache-Busting** - Version parameters added to all assets
✅ **Browser Caching** - .htaccess file configured for optimal caching
✅ **GZIP Compression** - Enabled for faster file transfer
✅ **Lazy Loading** - Images load as needed (except first slide)
✅ **Resource Hints** - Preconnect to CDN servers
✅ **Cache Control** - Proper headers for different file types

## File Caching Rules:
- **Images**: Cached for 1 year
- **CSS/JS**: Cached for 1 month
- **HTML**: Cached for 1 hour (to allow quick updates)

## Next Time You Update:
1. Make your changes
2. Update version numbers: `?v=1.0` → `?v=1.1`
3. Upload to server
4. Users will automatically get the new version!
