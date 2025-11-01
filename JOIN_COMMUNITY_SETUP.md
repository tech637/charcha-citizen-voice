# Join Community Feature Setup

This document provides instructions for setting up the new Join Community feature in the Charcha application.

## Database Setup

### 1. Run Database Migration

Execute the SQL migration file to create the necessary tables and update existing ones:

```sql
-- Run the contents of src/lib/database-migrations.sql in your Supabase SQL editor
```

This migration will:
- Create the `blocks` table for community blocks
- Add new columns to `user_communities` table (block_id, block_name, role, address, status)
- Insert sample blocks for the suggested communities
- Set up proper RLS policies

### 2. Create Sample Communities

If you don't have the suggested communities in your database, create them:

```sql
-- Insert sample communities
INSERT INTO communities (name, description, location, latitude, longitude, admin_id, is_active) VALUES
  ('Sarita Vihar', 'A well-planned residential area in South Delhi', 'Sarita Vihar, Delhi', 28.5304, 77.2520, 'your-admin-user-id', true),
  ('Paschim Vihar', 'A peaceful residential colony in West Delhi', 'Paschim Vihar, Delhi', 28.6892, 77.1025, 'your-admin-user-id', true);
```

## Features Implemented

### ✅ Location Search
- GPS location detection with user permission
- Address search using OpenStreetMap Nominatim API
- Location suggestions with distance calculation
- Fallback to manual address input

### ✅ Community Selection
- Pre-defined communities: Sarita Vihar, Paschim Vihar
- Distance-based community suggestions
- Visual community cards with selection state

### ✅ Block Management
- Dynamic block loading from database
- Fallback to default blocks (A, B, C) if none defined
- Custom block name input option
- Block selection dropdown

### ✅ User Information
- Tenant/Owner role selection
- Address input field
- Form validation

### ✅ Database Integration
- Enhanced `user_communities` table with new fields
- `blocks` table for community blocks
- Proper RLS policies for security
- Membership request status management

## API Functions

### New Functions in `src/lib/blocks.ts`
- `getCommunityBlocks(communityId)` - Get blocks for a community
- `createBlock(blockData, adminId)` - Create a new block (admin only)
- `updateBlock(blockId, updates, adminId)` - Update a block (admin only)
- `deleteBlock(blockId, adminId)` - Delete a block (admin only)

### Enhanced Functions in `src/lib/communities.ts`
- `joinCommunity(joinData)` - Join community with enhanced fields
- `getPendingMembershipRequests(communityId, adminId)` - Get pending requests (admin only)
- `updateMembershipStatus(membershipId, status, adminId)` - Approve/reject requests (admin only)

## UI Components

### `JoinCommunityForm` Component
- Mobile-first responsive design
- Location search with GPS and autocomplete
- Community selection with distance display
- Block selection with dynamic loading
- Role selection (tenant/owner)
- Address input with validation
- Form submission with loading states

## Usage

1. **User Flow:**
   - User clicks "Join Your Community" on homepage
   - Form scrolls into view
   - User searches for location or uses GPS
   - System suggests nearby communities
   - User selects community and block
   - User specifies role and address
   - User submits join request

2. **Admin Flow:**
   - Admins can view pending requests
   - Admins can approve or reject requests
   - Admins can manage blocks for their communities

## Testing

To test the feature:

1. Ensure database migration is applied
2. Start the development server: `npm run dev`
3. Navigate to the homepage
4. Click "Join Your Community"
5. Test location search and community selection
6. Submit a join request
7. Check the database for the new `user_communities` record

## Environment Variables

Ensure these environment variables are set:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Notes

- The feature uses OpenStreetMap Nominatim API for location search (free, no API key required)
- GPS location requires HTTPS in production
- All database operations include proper error handling
- RLS policies ensure data security
- The form includes comprehensive validation
- Mobile-first design with responsive layout
