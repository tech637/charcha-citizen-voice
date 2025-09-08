# Charcha Citizen Voice Platform - Development Context

## Project Overview
**Charcha** is a citizen voice platform that allows users to file complaints about civic issues, track their status, and engage with local government. The platform is built with React, TypeScript, and Supabase.

## Tech Stack
- **Frontend**: React 18, TypeScript, Vite, React Router DOM
- **UI Framework**: shadcn/ui components, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Authentication**: Supabase Auth (Email/Password + Google OAuth)
- **State Management**: React Context API
- **File Handling**: Supabase Storage
- **Deployment**: Production domain at https://www.charcha.net.in/

## Recent Updates (January 2025)

### Mobile-Responsive Admin Panel
- **User Management**: Redesigned with mobile-first approach
  - Mobile: Stacked layout with full-width role selector
  - Desktop: Side-by-side layout with compact design
  - Responsive user cards with proper spacing
- **Analytics Dashboard**: Mobile-optimized with simplified navigation
  - Mobile: All content shown in single overview (no sub-tabs)
  - Desktop: Tabbed interface with separate sections
  - Interactive charts using Recharts library
- **Removed Features**: Debug tab removed for cleaner interface
- **Chart Library**: Added Recharts for interactive visualizations
  - Line charts for user registration trends
  - Pie charts for category breakdown
  - Bar charts for priority distribution

### Analytics RPC Functions
- 8 comprehensive analytics functions created
- Real-time data fetching with error handling
- Mobile-friendly chart components
- Fallback UI for missing data

## Database Structure

### Tables Created in Supabase

#### 1. `users` Table
```sql
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'citizen' CHECK (role IN ('citizen', 'admin', 'moderator')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2. `categories` Table
```sql
CREATE TABLE public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3. `communities` Table
```sql
CREATE TABLE public.communities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  admin_id UUID REFERENCES auth.users(id) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 4. `user_communities` Table
```sql
CREATE TABLE public.user_communities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'citizen' CHECK (role IN ('citizen', 'moderator', 'admin')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, community_id)
);
```

#### 5. `complaints` Table
```sql
CREATE TABLE public.complaints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id),
  location TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'rejected')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 4. `complaint_files` Table
```sql
CREATE TABLE public.complaint_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  complaint_id UUID REFERENCES public.complaints(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Row Level Security (RLS) Policies
- **Users**: Can only access their own profile
- **Complaints**: Users can only access their own complaints
- **Complaint Files**: Users can only access files for their own complaints
- **Categories**: Public read access

## Authentication System

### Implementation Details
- **Email/Password**: Standard Supabase auth with email verification
- **Google OAuth**: Configured with redirect to `/auth/callback`
- **User Profile Creation**: Automatic profile creation in `public.users` table on first login
- **Session Management**: JWT tokens with automatic refresh

### Auth Flow
1. User attempts to submit complaint without login
2. Complaint data stored in `localStorage` (ComplaintContext)
3. Files stored as base64 in `localStorage` (FileContext)
4. Login dialog appears
5. After successful auth, complaint automatically submitted
6. User redirected to dashboard

## File Upload System

### Strategy: Upload After Login (Secure)
- **Temporary Storage**: Files stored as base64 strings in browser `localStorage`
- **Upload Timing**: Files uploaded to Supabase Storage only after successful authentication
- **File Reconstruction**: Base64 data converted back to `File` objects for upload
- **Storage Path**: `complaints/{complaint_id}/{filename}`

### File Context Implementation
```typescript
interface StoredFile {
  name: string
  type: string
  size: number
  data: string // Base64 encoded file data
}
```

## State Management

### Context Providers
1. **AuthContext**: User authentication state and methods
2. **ComplaintContext**: Pending complaint data persistence
3. **FileContext**: Pending files persistence (base64)

### Data Persistence Strategy
- **Complaint Data**: Stored in `localStorage` via ComplaintContext
- **Files**: Stored as base64 strings in `localStorage` via FileContext
- **Purpose**: Maintain data across OAuth redirects and page reloads

## Key Components

### 1. ComplaintForm (`src/components/ComplaintForm.tsx`)
- **Purpose**: Main form for filing complaints
- **Features**: File upload, category selection, location input
- **Behavior**: Stores data locally if user not logged in, opens login dialog

### 2. LoginDialog (`src/components/LoginDialog.tsx`)
- **Purpose**: Authentication modal
- **Features**: Email/password and Google OAuth
- **Behavior**: Auto-submits pending complaint after successful login

### 3. AuthCallback (`src/components/AuthCallback.tsx`)
- **Purpose**: Handles OAuth redirects
- **Features**: Session recovery, automatic complaint submission
- **Behavior**: Reconstructs files from base64, submits complaint, redirects to dashboard

### 4. Dashboard (`src/components/Dashboard.tsx`)
- **Purpose**: User's complaint management interface
- **Features**: Complaint list, status tracking, statistics
- **Navigation**: Integrated with Navigation component

### 5. Navigation (`src/components/Navigation.tsx`)
- **Purpose**: App-wide navigation
- **Features**: Logo, Home, Dashboard links
- **Behavior**: Uses React Router for client-side navigation

## OAuth Configuration

### Google Cloud Console Setup
- **Redirect URI**: `https://www.charcha.net.in/auth/callback`
- **Authorized Domains**: `charcha.net.in`
- **Client ID**: Configured in Supabase Auth settings

### Supabase Auth Settings
- **Site URL**: `https://www.charcha.net.in`
- **Redirect URLs**: `https://www.charcha.net.in/auth/callback`
- **Google Provider**: Enabled with client ID and secret

## Environment Variables
```env
VITE_SUPABASE_URL=https://dbloxnvwcuxrcnqcmcbx.supabase.co
VITE_SUPABASE_ANON_KEY=[anon_key]
```

## Current Features Working

### ✅ Implemented
1. **Complaint Form**: Full form with file upload, categories, location
2. **Authentication**: Email/password and Google OAuth
3. **Data Persistence**: Complaint data and files survive OAuth redirects
4. **Dashboard**: User complaint management
5. **Navigation**: Proper routing between pages
6. **File Upload**: Secure upload after authentication
7. **Video Hero**: Background video on landing page

### 🔄 Authentication Flow
1. Guest user fills complaint form
2. Data stored in localStorage (complaint + files as base64)
3. Login dialog appears
4. User authenticates (email or Google)
5. Complaint automatically submitted with files
6. User redirected to dashboard
7. localStorage cleared

### 🎯 User Journey
1. **Landing Page**: Video hero with call-to-action
2. **Complaint Form**: Fill details, upload files
3. **Authentication**: Login/signup required
4. **Dashboard**: View submitted complaints and status

## File Structure
```
src/
├── components/
│   ├── ComplaintForm.tsx      # Main complaint form
│   ├── LoginDialog.tsx        # Authentication modal
│   ├── AuthCallback.tsx       # OAuth redirect handler
│   ├── Dashboard.tsx          # User dashboard
│   ├── Navigation.tsx         # App navigation
│   └── ui/                    # shadcn/ui components
├── contexts/
│   ├── AuthContext.tsx        # Authentication state
│   ├── ComplaintContext.tsx   # Pending complaint data
│   └── FileContext.tsx        # Pending files (base64)
├── lib/
│   ├── supabase.ts           # Supabase client
│   ├── complaints.ts         # Complaint CRUD operations
│   ├── locationUtils.ts      # Location formatting utilities
│   ├── geocoding.ts          # Reverse geocoding API integration
│   └── utils.ts              # Utility functions
├── pages/
│   ├── Index.tsx             # Landing page with video hero
│   └── NotFound.tsx          # 404 page
└── hooks/
    ├── use-toast.ts          # Toast notifications
    └── useLocationFormat.ts  # Location formatting hook
```

## Recent Fixes Applied

### 1. Navigation Issues
- **Problem**: Logo and Home links not working
- **Solution**: Converted `<a>` tags to `<button>` with `onClick` handlers
- **Result**: Proper React Router navigation

### 2. Video Hero Implementation
- **Problem**: Static image background
- **Solution**: Implemented video background with overlay
- **Result**: Dynamic video hero with `hero.mp4`

### 3. OAuth Redirect Issues
- **Problem**: Pending complaints lost during OAuth redirects
- **Solution**: localStorage persistence for complaint data and base64 file storage
- **Result**: Seamless complaint submission after OAuth

### 4. Duplicate Submissions
- **Problem**: Multiple complaint submissions
- **Solution**: Added `isSubmitting` flags and proper useEffect dependencies
- **Result**: Single complaint submission per form

### 5. Location Display Enhancement
- **Problem**: Raw coordinates displayed instead of readable addresses
- **Solution**: Created location formatting utility with priority system
- **Result**: Beautiful location display with text addresses or formatted coordinates

### 6. Reverse Geocoding Implementation
- **Problem**: Coordinates like "28.6139, 77.2090" not user-friendly
- **Solution**: Integrated OpenStreetMap Nominatim API for reverse geocoding
- **Result**: Coordinates automatically convert to readable addresses like "East Delhi" or "Green Park, Sector 15"
- **Features**: Caching, loading states, fallback to coordinates if API fails

### 7. Creative UI Enhancement
- **Problem**: Complaint descriptions looked plain and unengaging
- **Solution**: Enhanced visual design with gradient backgrounds, animated elements, and improved typography
- **Result**: Beautiful, engaging complaint cards with:
  - Gradient backgrounds with subtle borders
  - Animated primary color dots
  - Enhanced category badges with hover effects
  - Improved like/dislike buttons with color feedback
  - Smooth transitions and hover effects
  - Maintained existing color theme consistency

### 8. Layout Optimization
- **Problem**: Information hierarchy needed improvement
- **Solution**: Reordered elements and added descriptive labels
- **Result**: Better information flow with:
  - Location displayed first for immediate context
  - "Complaint Description:" label for clarity
  - Improved visual hierarchy and readability
  - Consistent layout across all components

### 9. Real Data Integration for Landing Page
- **Problem**: Landing page showed static sample data
- **Solution**: Integrated real database data with fallback system
- **Result**: Dynamic landing page experience with:
  - Real public complaints fetched from database
  - Always visible for both logged-in and anonymous users
  - Fallback to sample data if API fails
  - Loading states for better UX
  - Preview of first 3 complaints to encourage engagement

### 10. Mobile Optimization and Community Highlighting
- **Problem**: Poor mobile experience and community section not prominent enough
- **Solution**: Comprehensive mobile optimization with enhanced community section
- **Result**: Improved mobile experience with:
  - Responsive hero section with smaller heights on mobile
  - Dual CTA buttons: "File a Complaint" and "See Community"
  - Reduced padding and spacing on mobile devices
  - Smaller icons, text, and assets for mobile screens
  - Enhanced community section with gradient background and live indicator
  - Improved card layouts with better mobile spacing
  - Full-width buttons on mobile for better touch targets

### 11. Admin-Style Community Page Redesign
- **Problem**: Community page needed more professional, admin-like appearance
- **Solution**: Complete redesign with admin dashboard styling and mobile optimization
- **Result**: Professional community management interface with:
  - Clean white cards with subtle shadows and borders
  - Admin-style header with statistics and refresh functionality
  - Compact stats cards showing total, pending, in-progress, and resolved complaints
  - Streamlined complaint cards with better information hierarchy
  - Mobile-first responsive design with vertical layout on small screens
  - Smaller, more compact elements for better mobile experience
  - Professional color scheme with gray backgrounds and clear typography
  - Efficient use of space with reduced padding and optimized layouts

### 12. Admin Panel Implementation
- **Problem**: Need admin-only access panel for platform management
- **Solution**: Created simple admin panel with role-based access control
- **Result**: Clean admin interface with:
  - Admin-only access using `isUserAdmin` function
  - Simple "Hello Admin" welcome message
  - Role-based navigation (admin links only visible to admins)
  - Automatic redirect for non-admin users

### 13. Community Management System
- **Problem**: Need system for creating and managing communities
- **Solution**: Implemented comprehensive community management with admin panel
- **Result**: Full community system with:
  - Admin panel for creating new communities
  - User role management (citizen, admin, moderator)
  - Community-specific complaint feeds
  - India community for all public complaints
  - Auto-join functionality for new users
  - Dynamic community pages accessible via `/communities/{name}`

### 14. Database Schema Simplification
- **Problem**: Complex dual-table role management causing issues
- **Solution**: Simplified to single `users` table with `role` column
- **Result**: Cleaner database structure with:
  - Single source of truth for user roles
  - Eliminated `profiles` table complexity
  - Simplified authentication and role checking
  - Better performance and maintainability
  - Clean, professional admin dashboard design
  - Removed all community-related functionality as requested

## Production Deployment
- **Domain**: https://www.charcha.net.in/
- **Environment Variables**: Set in hosting platform (Vercel/Netlify)
- **Database**: Supabase production instance
- **Storage**: Supabase Storage for file uploads

## Next Development Priorities
1. **Admin Panel**: Complaint management for officials
2. **Status Updates**: Real-time complaint status changes
3. **Notifications**: Email/SMS notifications for status updates
4. **Analytics**: Complaint metrics and reporting
5. **Mobile App**: React Native version
6. **Advanced Features**: Geolocation, photo verification, etc.

## Development Notes
- **Local Development**: Runs on `localhost:8080`
- **Production**: Deployed to `charcha.net.in`
- **Database**: All tables and RLS policies manually created via SQL
- **Authentication**: Google OAuth requires production domain configuration
- **File Storage**: Secure upload-after-login strategy implemented

---

*Last Updated: January 2025*
*Status: Core complaint system fully functional with authentication and file upload*
