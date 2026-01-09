# TravelOps Admin Panel

React admin panel for TravelOps built with Vite, React, and Tailwind CSS.

## Features

- **Authentication**: Login with Laravel Sanctum
- **Dashboard**: View statistics and metrics
- **Leads Management**: Create, assign, and update lead status
- **Followups**: View today's and overdue followups
- **Payments**: Track pending and due payments
- **WhatsApp Inbox**: View conversations and send messages
- **Employee Performance**: View performance metrics (Admin only)
- **Analytics**: Source ROI and Destination Performance (Admin only)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update `.env` with your Laravel API URL:
```
VITE_API_BASE_URL=http://localhost:8000/api
```

4. Start development server:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
```

## Project Structure

```
src/
  ├── components/       # Reusable components
  ├── contexts/          # React contexts (Auth)
  ├── pages/            # Page components
  ├── services/         # API service layer
  └── App.jsx          # Main app with routing
```

## API Integration

All API calls are handled through `src/services/api.js` which uses axios and includes:
- Automatic token injection
- 401 error handling (redirects to login)
- Centralized API endpoints

## Pages

- `/login` - Login page
- `/dashboard` - Dashboard with statistics
- `/leads` - Leads management
- `/followups` - Followups list
- `/payments` - Payments tracking
- `/whatsapp` - WhatsApp inbox
- `/performance` - Employee performance (Admin)
- `/analytics` - Source ROI & Destination analytics (Admin)
