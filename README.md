# Charcha - Citizen Voice Platform

A civic engagement platform that allows citizens to report and track civic problems in their area.

## Features

- **Complaint Filing**: Report civic issues with photos, location, and detailed descriptions
- **User Authentication**: Secure signup and login with email or Google OAuth
- **Dashboard**: Track your complaints and their status
- **Community Feed**: View public complaints from other citizens
- **Real-time Updates**: Get notified about complaint status changes

## Technologies Used

This project is built with:

- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **Backend**: Supabase (Database, Authentication, Storage)
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router DOM
- **Form Handling**: React Hook Form with Zod validation

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <YOUR_GIT_URL>
   cd charcha-citizen-voice
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```bash
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:8080`

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   ├── Dashboard.tsx   # User dashboard
│   ├── ComplaintForm.tsx # Main complaint form
│   └── ...
├── contexts/           # React contexts
├── lib/               # Utility functions and services
├── pages/             # Route components
└── hooks/             # Custom React hooks
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

© 2025 Charcha. All rights reserved.
