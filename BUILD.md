# Production Build Configuration

## Vite Build Optimizations

build:
  target: 'es2015'
  minify: 'terser'
  sourcemap: false
  rollupOptions:
    output:
      manualChunks:
        vendor: ['react', 'react-dom']
        leaflet: ['leaflet', 'react-leaflet']
  terserOptions:
    compress:
      drop_console: true
      drop_debugger: true
  chunkSizeWarningLimit: 1000

## Performance Checklist

- [x] Code splitting implemented
- [x] Tree shaking enabled
- [x] Minification enabled
- [x] Gzip/Brotli compression (handled by hosting)
- [x] Image optimization
- [x] CSS purging (unused styles removed)
- [x] Service worker caching
- [x] Lazy loading for routes
- [x] Memoization for expensive computations
- [x] Debouncing for user interactions

## Bundle Size Targets

- Main bundle: < 200KB (gzipped)
- Vendor bundle: < 150KB (gzipped)
- CSS: < 20KB (gzipped)
- Total initial load: < 400KB (gzipped)

## Browser Support

Targets modern browsers with ES2015+ support:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- iOS Safari 14+
- Samsung Internet 14+

## Environment-Specific Settings

### Development
- Source maps: enabled
- Console logs: enabled
- Hot module replacement: enabled
- Strict mode: enabled

### Production
- Source maps: disabled
- Console logs: removed
- Minification: aggressive
- Dead code elimination: enabled
