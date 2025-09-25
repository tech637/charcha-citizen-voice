PRD — Charcha: Community-first RWA Platform (copy-paste for Cursor)
1. Title

Charcha — Community-first RWA platform (Community pages, President role, Complaints & Finance)

2. Summary

Charcha helps small residential communities (colonies / RWAs) coordinate and resolve local issues. Each community has a dedicated page with membership, a single elected President, finance tracking (collected/spent), and a complaints feed. Presidents approve members and manage complaints for their community. The platform has a Super Admin for global control.

3. Goals

Provide a simple, trustable digital space for locality-level reporting and governance.

Make it easy for residents to raise & track complaints.

Give Presidents precise tools to manage membership, finances, and complaint resolution.

Keep the platform extensible (polls, notices, analytics later).

4. Personas

Resident (Member) — joins community, views feed, raises complaints, tracks status.

President (Community Admin) — single elected user per community; approves members, resolves complaints, updates finances/profile.

Super Admin (Platform Owner) — manages communities, assigns/replaces presidents, views global metrics.

Developer — implements features per this PRD.

5. Core Features (MVP)

Community Page (per community):

Header: community name, banner, short description.

Stats: member count, active complaints count.

President card: name, phone, email, tenure start.

Finance card: collected, spent, balance, last transactions (basic).

Complaints feed: list, filter by status (open/in progress/resolved), raise complaint button.

Membership: join request button (requires approval by President).

President-only panel: membership requests, complaint management UI, finance update form.

Roles & Permissions

Exactly one President per community (must be assigned by Super Admin or elected via future flow).

President permissions: approve/reject membership, modify community profile, update finance entries, mark complaints resolved.

Member permissions: raise complaint, comment on own complaint, view community details.

Super Admin permissions: create/delete communities, assign president, global analytics.