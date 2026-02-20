# Archivist N365

A progressive web application for searching and streaming historical audio content from Archive.org. Access decades of audio without internet connectivity using service worker caching and offline support.

## Features

- **Search Archive.org**: Browse collections of historical audio, music, and spoken word content
- **Stream and Cache**: Progressive download with service worker caching for offline playback
- **Offline Support**: Full PWA support with service worker for browsing cached content without internet
- **Mobile Ready**: Responsive design optimized for all devices
- **Production Ready**: Fast, type-safe builds with SvelteKit and TypeScript

## Quick Start

### Prerequisites
- Node.js 18 or later
- npm, yarn, or pnpm

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser
npm run dev -- --open
```

### Building for Production

```bash
# Create optimized production build
npm run build

# Preview production build locally
npm run preview
```

## Deployment

### Vercel Deployment

The project is configured for seamless deployment to Vercel:

```bash
# Install Vercel CLI (optional)
npm install -g vercel

# Deploy to Vercel
vercel
```

Or connect your Git repository to Vercel for automatic deployments on each push.

**Configuration**: Vercel settings are defined in `vercel.json`. The project uses SvelteKit's `@sveltejs/adapter-auto` which automatically configures for Vercel.

### Environment Variables

No environment variables are required. The application uses the Archive.org public API endpoints directly. See `.env.example` for reference.

## Project Structure

```
├── src/
│   ├── lib/          # Reusable components and utilities
│   ├── routes/       # SvelteKit page routes
│   ├── app.css       # Global styles
│   └── app.html      # Main HTML template
├── static/           # Static assets (manifest, service worker, etc.)
├── svelte.config.js  # SvelteKit configuration
├── vite.config.ts    # Vite build configuration
└── vercel.json       # Vercel deployment configuration
```

## Technology Stack

- **Framework**: SvelteKit 2.x
- **UI Framework**: Svelte 5.x with Tailwind CSS
- **Build Tool**: Vite
- **Type Safety**: TypeScript
- **HTTP Client**: ky
- **Database**: IndexedDB (idb)
- **PWA**: @vite-pwa/sveltekit with service workers
- **Icons**: Lucide Svelte

## Development Commands

- `npm run dev` - Start development server with hot module reloading
- `npm run build` - Build optimized production bundle
- `npm run preview` - Preview production build locally
- `npm run check` - Type-check and lint the codebase
- `npm run check:watch` - Type-check in watch mode

## Service Worker & Offline Support

The application includes a service worker that:
- Caches audio content for offline playback
- Enables offline browsing of previously cached data
- Automatically manages cache invalidation and storage quotas
- Provides network-first strategy with fallback to cache

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers supporting PWA standards

## Performance

- Optimized bundle size with tree-shaking
- Lazy-loaded route components
- Streaming responses for large audio files
- Efficient caching strategies for offline use
- CDN-friendly static assets

## License

See LICENSE file for details.
