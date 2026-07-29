/**
 * Vercel Web Analytics initialization
 * Injects the analytics script and starts tracking page views
 */
import { inject } from '../node_modules/@vercel/analytics/dist/index.mjs';

// Initialize Vercel Web Analytics
inject({
  mode: 'auto', // Auto-detect environment (production or development)
  debug: true   // Enable debug logging in development
});
