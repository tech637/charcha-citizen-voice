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

#### 3. `complaints` Table
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
