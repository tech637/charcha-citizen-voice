<!-- 5c972d69-3f32-4efb-80a7-3e4247d52913 36fdb6b0-1a1c-4847-a15e-3bce2da4a03b -->
# Leaders Dashboard Implementation Plan

## Overview

Implement three separate leader dashboards (MP, MLA, Councillor) that allow elected representatives to manage complaints and view analytics for their assigned communities. Leaders are distinct from Presidents and are assigned by Super Admin.

## Database Changes

### 1. Create `community_leaders` Table

**File**: New migration file `src/lib/leader-dashboard-migration.sql`

- Add table with columns: `id`, `community_id`, `user_id`, `leader_type` (mp/mla/councillor), `assigned_by`, `assigned_at`, `is_active`
- Add foreign keys: `community_id` → communities, `user_id` → users, `assigned_by` → users
- Add unique constraint: one leader per type per community
- Add indexes on `community_id`, `user_id`, `leader_type`
- Enable RLS policies:
- Anyone can read active leader assignments
- Only global admins can insert/update/delete
- Create trigger to auto-add leader as approved member when assigned

### 2. Add Helper Functions

**File**: `src/lib/database-rpc-functions.sql` (append)

- `is_user_leader(user_uuid, community_uuid, leader_type_text)` - Check if user is assigned leader
- `get_user_leader_communities(user_uuid, leader_type_text)` - Get all communities where user is assigned leader
- `get_community_leaders(community_uuid)` - Get all leaders (MP, MLA, Councillor) for a community

## Frontend Implementation

### 3. Create Leader Utilities

**File**: `src/lib/leaders.ts` (new)

- `isUserLeader(userId, communityId, leaderType)` - Check leader access
- `getUserLeaderCommunities(userId, leaderType)` - Get assigned communities
- `getCommunityLeaders(communityId)` - Get all leaders for community
- `assignCommunityLeader(communityId, userEmail, leaderType, adminId)` - Assign leader (admin only)
- `removeCommunityLeader(leaderId, adminId)` - Remove leader assignment
- `getLeaderComplaints(communityId, userId, leaderType)` - Get complaints for leader's community

### 4. Create Leader Dashboard Component

**File**: `src/components/leaders/LeaderDashboard.tsx` (new)

- Generic dashboard component accepting `leaderType` prop ('mp' | 'mla' | 'councillor')
- Similar structure to AdminPanel but scoped to single community
- Header with leader type badge and community selector (if multiple assignments)
- Tabs: Overview, Complaints, Analytics, Community Info
- Access control: verify user is assigned leader for selected community

### 5. Create Leader Tabs Components

**Files**: New components in `src/components/leaders/`

#### `LeaderOverview.tsx`

- Display community stats (members, complaints by status)
- Recent complaint activity
- Quick actions (view pending complaints)

#### `LeaderComplaints.tsx`

- List all complaints for the community
- Filter by status (pending, in_progress, resolved, rejected)
- Update complaint status (dropdown selector)
- View full complaint details (description, location, user info, attachments)
- Real-time updates via Supabase subscription

#### `LeaderAnalytics.tsx`

- Reuse Analytics component from admin panel
- Filter data to show only selected community
- Community selector dropdown (if leader has multiple assignments)
- Display: complaint status distribution, category breakdown, resolution trends
- Community-specific metrics (resolution rate, avg resolution time)

#### `LeaderCommunityInfo.tsx`

- Display community profile (name, description, location)
- Show MP/MLA/Councillor info (from locality_data)
- Display President contact info
- Member statistics
- Finance summary (read-only)

### 6. Create Route Components

**Files**: `src/components/leaders/` (new)

- `MPDashboard.tsx` - Wrapper passing leaderType='mp'
- `MLADashboard.tsx` - Wrapper passing leaderType='mla'
- `CouncillorDashboard.tsx` - Wrapper passing leaderType='councillor'

Each wrapper:

- Renders `<LeaderDashboard leaderType="mp|mla|councillor" />`
- Sets appropriate header title ("MP Dashboard" / "MLA Dashboard" / "Councillor Dashboard")
- Verifies user has leader access before rendering

### 7. Add Routing

**File**: `src/App.tsx`

- Add route `/mp-dashboard` → MPDashboard
- Add route `/mla-dashboard` → MLADashboard  
- Add route `/councillor-dashboard` → CouncillorDashboard
- Add routes BEFORE the catch-all "*" route

### 8. Update Admin Panel - Leader Assignment

**File**: `src/components/admin/CommunityManagement.tsx`

- Add "Assign Leaders" section to each community card
- Three input fields + buttons: MP (email + assign), MLA (email + assign), Councillor (email + assign)
- Display currently assigned leaders with remove button
- Call `assignCommunityLeader()` on assign
- Show success/error toasts

### 9. Update Navigation

**File**: `src/components/Navigation.tsx`

- Add conditional navigation items for leaders
- Check if user is leader (any type) and show appropriate dashboard link
- Logic: If user is MP → show "MP Dashboard", if MLA → show "MLA Dashboard", etc.

### 10. Update Community Page - Display Leaders

**File**: `src/components/CommunityPage.tsx`

- Add "Leaders" section alongside President card (in details section)
- Display MP, MLA, and Councillor info (name, email) if assigned
- Fetch leaders using `getCommunityLeaders(communityId)`
- Show "Not Assigned" if no leader for a type

## Testing & Verification

### 11. Test Scenarios

- Super admin assigns MP/MLA/Councillor to community
- Leader logs in and sees their dashboard with assigned community
- Leader updates complaint status (pending → in_progress → resolved)
- Leader views analytics filtered to their community
- Leader with multiple communities switches between them
- Verify leaders auto-become approved community members
- Verify leaders can see all complaint details including user info
- Verify non-leaders cannot access leader dashboards (redirect to home)

## Key Design Decisions

1. **Separate from President**: Leaders and Presidents coexist - communities have 1 President + up to 3 Leaders
2. **One Leader Per Type**: Each community can have max 1 MP, 1 MLA, 1 Councillor
3. **Single Community Focus**: Each dashboard focuses on ONE community at a time (dropdown if multiple)
4. **Full Access**: Leaders see all complaint details (like President panel)
5. **Identical Dashboards**: MP/MLA/Councillor dashboards are functionally identical, only branding differs
6. **Admin Assignment Only**: Only Super Admin can assign/remove leaders via Admin Panel

### To-dos

- [ ] Create community_leaders table with RLS policies and triggers
- [ ] Add RPC helper functions for leader access checks
- [ ] Create src/lib/leaders.ts with leader management functions
- [ ] Build generic LeaderDashboard component with tabs
- [ ] Create LeaderOverview, LeaderComplaints, LeaderAnalytics, LeaderCommunityInfo components
- [ ] Create MPDashboard, MLADashboard, CouncillorDashboard wrapper components
- [ ] Add leader dashboard routes to App.tsx
- [ ] Add leader assignment UI to CommunityManagement component
- [ ] Update Navigation component with leader dashboard links
- [ ] Add leaders display section to CommunityPage
- [ ] Test all leader workflows and access controls