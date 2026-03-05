# Changelog

All notable changes to the Ontario Historical Plaques project.

## [1.0.0] - 2025-03-04

### Major Improvements

#### Design System Overhaul
- **Enhanced Color Palette**: Refined green color scheme with better contrast ratios for accessibility
- **Design Tokens**: Added comprehensive CSS custom properties for spacing, typography, colors, and transitions
- **Dark Mode Refinements**: Improved dark mode with proper color contrast and OLED-friendly dark backgrounds
- **Typography Scale**: Implemented consistent typographic scale (xs to 4xl) with fluid sizing
- **Spacing System**: Added 8px-based spacing scale for consistent layout

#### Components & UX
- **Skeleton Loading States**: Added shimmer loading animations for better perceived performance
- **Image Component**: Enhanced with loading states, error handling, and fade-in animations
- **Card Component**: Added hoverable variant with lift animation and shadow effects
- **Tag Component**: Simplified with CSS-based styling and improved accessibility
- **Button Component**: Added external link support and refined hover animations

#### Accessibility Features
- **Skip Link**: Added keyboard-accessible skip navigation link
- **Scroll to Top**: Floating button that appears after scrolling down
- **Focus Indicators**: Enhanced focus states for keyboard navigation
- **ARIA Labels**: Added proper accessibility labels to interactive elements
- **Semantic HTML**: Improved use of semantic elements (article, section, nav)
- **Print Styles**: Added print-specific CSS for better printing experience

#### Error Handling
- **Enhanced Error Boundary**: Beautiful error pages with 404 handling and helpful navigation
- **Development Mode**: Stack traces shown only in development
- **Root Error Boundary**: Graceful handling of critical failures

#### Responsive Design
- **Mobile-First**: Continued mobile-first approach with fluid sizing
- **Clamp() Usage**: Implemented CSS clamp() for fluid typography and spacing
- **Better Text Wrapping**: Improved handling of long content on small screens
- **Responsive Grid**: Enhanced grid layouts that adapt to all screen sizes

#### Performance & Technical
- **React Router v7**: Updated all imports and compatibility
- **TypeScript**: Fixed all type issues and improved type safety
- **Image Optimization**: Local WebP images with Cloudflare fallback
- **Build Optimizations**: Clean dependency tree and optimized bundles
- **Removed Legacy Code**: Cleaned up outdated src/ folder with Remix remnants

#### Visual Polish
- **Animations**: Smooth transitions on all interactive elements
- **Hover Effects**: Lift and shadow effects on cards and buttons
- **Loading States**: Shimmer animations for skeleton screens
- **Shadow System**: Added subtle elevation shadows for depth
- **Better Borders**: Consistent border styling throughout

#### Content Improvements
- **About Page**: Completely redesigned with stats, mission statement, and visual hierarchy
- **Home Page**: Enhanced featured plaque display with better visual design
- **SEO**: Improved meta tags and Open Graph support

### Breaking Changes
- None - All changes are backwards compatible

### Known Issues
- None

---

## [0.1.0] - 2025-10-13

### Initial Release
- Basic plaque browsing functionality
- Search and filter capabilities
- Dark/light mode toggle
- Mobile responsive design
- Data sourced from ontarioplaques.com
