# FarmDirect

FarmDirect is a demand-driven farmer-to-consumer platform designed to eliminate middleman margins by aggregating consumer demand into collective pools, matching them directly with local farmer supply, and optimizing fulfillment using a deterministic matching engine and AI demand intelligence.

---

## Features

- **Demand-driven collective pooling**: Consumers place crop demands or join existing area pools to achieve volume pricing.
- **Farmer supply declarations**: Farmers list available crops, location, availability window, and quantities.
- **Deterministic matching engine**: Evaluates compatibility across 5 factors (Product 35%, Quantity 25%, Location 20%, Date 10%, Price 10%) with transparent score breakdowns.
- **Greedy fulfillment optimizer**: Computes optimal multi-farmer supply combinations for any demand.
- **AI Demand Intelligence**: Powered by Groq API to provide read-only risk analysis, urgency scoring, and market guidance without altering database state.
- **Secure authentication**: JWT stored in HTTP-only cookies with role-based access control (Consumer & Farmer roles).
- **MongoDB persistence**: Multi-document transactional commitments preventing over-allocation.

---

## Tech Stack

### Frontend
- **Framework**: React (Vite SPA)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Routing**: React Router DOM

### Backend
- **Runtime**: Node.js + Express
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT in HTTP-only cookies + bcryptjs
- **AI Integration**: Groq API (`qwen/qwen3.6-27b`)

---

## Project Structure

```text
farmdirect/
├── backend/
│   ├── src/
│   │   ├── config/          # Database connection
│   │   ├── controllers/     # HTTP route controllers
│   │   ├── middleware/      # Auth & error handling
│   │   ├── models/          # Mongoose schemas (User, Demand, Supply, Commitment, DemandParticipant)
│   │   ├── routes/          # Express route definitions
│   │   ├── services/        # Matching engine, location service, AI service
│   │   ├── utils/           # Product normalization & helpers
│   │   ├── app.js           # Express app configuration & middleware
│   │   └── server.js        # Entry point
│   ├── tests/               # Unit test suites (matching & AI tests)
│   └── .env.example         # Backend environment variable template
├── public/                  # Static assets & SPA fallback routing (_redirects)
├── src/                     # Frontend React SPA
│   ├── components/          # Reusable UI components & modals
│   ├── context/             # AuthContext
│   ├── data/                # Category & location constants
│   ├── pages/               # Consumer & Farmer dashboards, Landing, Auth
│   ├── routes/              # Protected & public routes
│   └── utils/               # Centralized API client
└── .env.example             # Frontend environment variable template
```

---

## Local Setup

### 1. Frontend Setup

```bash
# Install dependencies
npm install

# Start development server (http://localhost:5173)
npm run dev
```

Create a `.env` file in the root directory based on `.env.example`:

```env
VITE_API_URL=http://localhost:5000/api
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Run unit tests
npm test

# Start backend server (http://localhost:5000)
npm run dev
```

Create a `.env` file in the `backend/` directory based on `backend/.env.example`:

```env
MONGODB_URI=mongodb://localhost:27017/farmdirect
PORT=5000
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
JWT_COOKIE_DAYS=7
NODE_ENV=development
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=qwen/qwen3.6-27b
```

---

## API Endpoints

### Health Check
- `GET /api/health` — Public API health status check.

### Authentication
- `POST /api/auth/register` — Register a new Consumer or Farmer account.
- `POST /api/auth/login` — Authenticate and issue HTTP-only JWT cookie.
- `POST /api/auth/logout` — Clear authentication cookie.
- `GET /api/auth/me` — Get current logged-in user profile.

### Demands
- `GET /api/demands` — List open collective demands (supports search, category, location filters).
- `POST /api/demands` — Create a new consumer demand pool (Consumer only).
- `GET /api/demands/:id` — Retrieve single demand details.
- `POST /api/demands/:id/join` — Join an existing collective demand pool (Consumer only).

### Supplies
- `GET /api/supplies` — List active supply declarations for logged-in farmer (Farmer only).
- `POST /api/supplies` — Declare crop availability (Farmer only).
- `GET /api/supplies/:id` — Retrieve single supply details.

### Commitments
- `GET /api/commitments` — List active supply commitments made by farmer (Farmer only).
- `POST /api/commitments` — Commit farmer supply toward a demand pool (Farmer only).

### Matching Engine
- `GET /api/matching/demands/:demandId` — Get ranked supply matches with 5-factor score breakdowns.
- `GET /api/matching/demands/:demandId/recommendation` — Get greedy multi-farmer fulfillment recommendation.
- `GET /api/matching/my-opportunities` — Get demand opportunities ranked by match score for logged-in farmer.

### AI Demand Intelligence
- `GET /api/ai/demands/:demandId/intelligence` — Get read-only AI demand outlook, risk assessment, and market recommendation (Authenticated users).
