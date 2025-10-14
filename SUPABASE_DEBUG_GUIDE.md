# 🔍 Supabase MCP Debug Guide

## **🚀 How to Set Up Supabase MCP for Proper Debugging**

### **Option 1: Using Supabase CLI (Recommended)**

1. **Install Supabase CLI:**
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase:**
   ```bash
   supabase login
   ```

3. **Link your project:**
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. **Get access token for MCP:**
   ```bash
   supabase status
   ```
   This will show you the project details and access tokens.

### **Option 2: Direct Debugging Steps**

**Step 1: Run the debug script in Supabase SQL Editor**

Copy and run this in your Supabase SQL Editor:

```sql
-- Run this in Supabase SQL Editor
-- Replace with your actual community ID: d656d56d-e15a-4897-84d7-d65813e2eec4

SELECT 
  'Community Status' as check_type,
  id,
  name,
  admin_id,
  is_active,
  created_at
FROM communities 
WHERE id = 'd656d56d-e15a-4897-84d7-d65813e2eec4';
```

**Step 2: Find blocking constraints**

```sql
-- Find ALL foreign key constraints blocking deletion
SELECT 
    tc.table_name,
    kcu.column_name,
    tc.constraint_name,
    'BLOCKING CONSTRAINT' as status
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE constraint_type = 'FOREIGN KEY' 
  AND ccu.table_name = 'communities';
```

**Step 3: Check data in blocking tables**

```sql
-- Check what data exists for your community
SELECT 'User Communities' as table_name, COUNT(*) as blocking_records 
FROM user_communities 
WHERE community_id = 'd656d56d-e15a-4897-84d7-d65813e2eec4'

UNION ALL

SELECT 'Complaints', COUNT(*) 
FROM complaints 
WHERE community_id = 'd656d56d-e15a-4897-84d7-d65813e2eec4'

UNION ALL

SELECT 'Community Transactions', COUNT(*) 
FROM community_transactions 
WHERE community_id = 'd656d56d-e15a-4897-84d7-d65813e2eec4';
```

## **🎯 What This Will Tell Us**

Running these queries will show us:

1. **✅ Is the community still there?** (Should show the community details)
2. **✅ Which foreign keys are blocking deletion?** (List of all constraints)
3. **✅ What data is still referencing it?** (Count of blocking records)
4. **✅ What's the exact constraint causing 409 error?**

## **🛠️ Once We Identify the Blocking Table**

Based on the results, we can:

1. **Update our cleanup function** to include the missing table
2. **Fix the constraint** by updating/deleting the blocking records
3. **Deploy a permanent solution** to prevent future issues

## **📋 Expected Output Format**

When you run these queries, you should see something like:

```
Community Status:
- id: d656d56d-e15a-4897-84d7-d65813e2eec4
- name: Ramesh Nagar  
- admin_id: some-user-id

Blocking Constraints:
- table_name: complaints
- column_name: community_id
- constraint_name: complaints_community_id_fkey

Blocking Records:
- User Communities: 0 (should be 0 after cleanup)
- Complaints: 5 (this might be the issue!)
- Community Transactions: 0
```

## **🚀 Action Items**

1. **Copy the debug script** (`debug-community-deletion.sql`) 
2. **Run it in Supabase SQL Editor**
3. **Share the results** with me
4. **I'll fix the specific blocking table** based on what we find


