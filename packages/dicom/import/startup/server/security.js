import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { get } from 'lodash';

/**
 * Security configuration for DICOM viewer
 * Sets up CORS, rate limiting, and other security measures
 */

Meteor.startup(function() {
  console.log('🔒 Configuring security settings...');
  
  const settings = Meteor.settings.private || {};
  const corsConfig = get(settings, 'cors', {});
  
  // Configure CORS for DICOM binary data endpoints
  if (corsConfig.enable) {
    console.log('🌐 Setting up CORS configuration');
    
    WebApp.rawConnectHandlers.use(function(req, res, next) {
      // Only apply CORS to API endpoints
      if (req.url.startsWith('/api/')) {
        const allowedOrigins = corsConfig.origin === '*' 
          ? '*' 
          : corsConfig.origin.split(',').map(origin => origin.trim());
        
        const requestOrigin = req.headers.origin;
        
        if (allowedOrigins === '*' || allowedOrigins.includes(requestOrigin)) {
          res.setHeader('Access-Control-Allow-Origin', requestOrigin || '*');
        }
        
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
        res.setHeader('Access-Control-Allow-Headers', 
          'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control'
        );
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours preflight cache
        
        // Handle preflight requests
        if (req.method === 'OPTIONS') {
          res.writeHead(200);
          res.end();
          return;
        }
      }
      
      next();
    });
  }
  
  // Security headers for all requests
  WebApp.rawConnectHandlers.use(function(req, res, next) {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Only serve over HTTPS in production
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
    
    // Content Security Policy for medical imaging
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdnjs.cloudflare.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob:",
      "connect-src 'self' ws: wss:",
      "worker-src 'self' blob:",
      "wasm-src 'self'"
    ].join('; ');
    
    res.setHeader('Content-Security-Policy', csp);
    
    next();
  });
  
  // Rate limiting for upload endpoints
  const uploadRateLimiter = new Map();
  const UPLOAD_RATE_LIMIT = 10; // requests per minute
  const RATE_WINDOW = 60 * 1000; // 1 minute
  
  WebApp.rawConnectHandlers.use('/api/dicom/upload', function(req, res, next) {
    const clientIP = req.headers['x-forwarded-for'] || 
                     req.connection.remoteAddress || 
                     req.socket.remoteAddress;
    
    const now = Date.now();
    const windowStart = now - RATE_WINDOW;
    
    // Clean old entries
    const clientHistory = uploadRateLimiter.get(clientIP) || [];
    const recentRequests = clientHistory.filter(timestamp => timestamp > windowStart);
    
    if (recentRequests.length >= UPLOAD_RATE_LIMIT) {
      res.writeHead(429, { 
        'Content-Type': 'application/json',
        'Retry-After': Math.ceil(RATE_WINDOW / 1000) 
      });
      res.end(JSON.stringify({ 
        error: 'Rate limit exceeded',
        message: `Maximum ${UPLOAD_RATE_LIMIT} uploads per minute allowed`
      }));
      return;
    }
    
    // Record this request
    recentRequests.push(now);
    uploadRateLimiter.set(clientIP, recentRequests);
    
    next();
  });
  
  // Clean up rate limiter periodically
  Meteor.setInterval(function() {
    const cutoff = Date.now() - RATE_WINDOW;
    for (const [ip, timestamps] of uploadRateLimiter.entries()) {
      const filtered = timestamps.filter(t => t > cutoff);
      if (filtered.length === 0) {
        uploadRateLimiter.delete(ip);
      } else {
        uploadRateLimiter.set(ip, filtered);
      }
    }
  }, RATE_WINDOW);
  
  // File upload size limits
  WebApp.rawConnectHandlers.use('/api/dicom/upload', function(req, res, next) {
    const maxSize = 100 * 1024 * 1024; // 100MB per file
    const contentLength = parseInt(req.headers['content-length'] || '0');
    
    if (contentLength > maxSize) {
      res.writeHead(413, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        error: 'File too large',
        message: `Maximum file size is ${Math.round(maxSize / 1024 / 1024)}MB`
      }));
      return;
    }
    
    next();
  });
  
  console.log('✅ Security settings configured');
});