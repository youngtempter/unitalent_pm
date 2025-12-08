# UniTalent - Full Stack Platform

A full-stack web application connecting university students with employers for internships and junior positions.

## 🚀 Project Overview

UniTalent is a student-employer matching platform that enables:
- **Students** to browse jobs, apply, save favorites, and manage their profiles
- **Employers** to post jobs, review applicants, schedule interviews, and send invitations

## 📁 Project Structure

```
unitalent - full stack/
├── frontend/                    # Frontend (HTML/CSS/JS)
│   ├── assets/                 # Static assets (logo, images)
│   ├── js/                     # JavaScript modules
│   └── *.html                  # HTML pages for different views
└── unitalent-backend-full/     # Backend (Node.js/Express)
    ├── prisma/                 # Database schema and migrations
    ├── src/
    │   ├── routes/             # API route handlers
    │   ├── middleware/         # Authentication middleware
    │   ├── app.js              # Express app configuration
    │   └── server.js           # Server entry point
    └── package.json            # Dependencies
```

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js 5.2.1
- **Database**: PostgreSQL (via Prisma ORM)
- **Authentication**: JWT (jsonwebtoken)
- **Security**: Helmet, CORS, bcrypt

### Frontend
- **HTML5** with semantic markup
- **Tailwind CSS** (via CDN)
- **Vanilla JavaScript** (ES6+ modules)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18+ recommended)
- **PostgreSQL** database
- **npm** or **yarn**
- **Git**

## 🔧 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/youngtempter/unitalent_pm.git
cd "unitalent - full stack"
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd unitalent-backend-full

# Install dependencies
npm install

# Create .env file in unitalent-backend-full/ directory
# Copy the following and update with your values:
```

Create a `.env` file in `unitalent-backend-full/` with:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/unitalent"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"
PORT=3000
CORS_ORIGIN="http://localhost:8000"
NODE_ENV="development"
```

```bash
# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Start the development server
npm run dev
```

The backend API will be running at `http://localhost:3000`

### 3. Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Serve the frontend using any static server
# Option 1: Using Python
python -m http.server 8000

# Option 2: Using Node.js http-server
npx http-server -p 8000

# Option 3: Using VS Code Live Server extension
# Right-click on index.html and select "Open with Live Server"
```

The frontend will be available at `http://localhost:8000`

## 🔑 Environment Variables

Create a `.env` file in `unitalent-backend-full/` directory:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/unitalent` |
| `JWT_SECRET` | Secret key for JWT tokens | `your-secret-key` |
| `JWT_EXPIRES_IN` | Token expiration time | `7d` |
| `PORT` | Server port | `3000` |
| `CORS_ORIGIN` | Allowed CORS origins | `http://localhost:8000` |
| `NODE_ENV` | Environment mode | `development` |

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Student registration
- `POST /api/auth/login` - Student login
- `POST /api/auth/employer/register` - Employer registration
- `POST /api/auth/employer/login` - Employer login

### Jobs
- `GET /api/jobs` - Get all jobs (public)
- `POST /api/jobs` - Create job (EMPLOYER only)
- `GET /api/jobs/my` - Get employer's jobs
- `GET /api/jobs/:id` - Get single job
- `PATCH /api/jobs/:id` - Update job (EMPLOYER only)
- `DELETE /api/jobs/:id` - Delete job (EMPLOYER only)

### Applications
- `POST /api/applications` - Apply to job (STUDENT)
- `GET /api/applications?jobId=:id` - Get applicants for job (EMPLOYER)
- `GET /api/applications/my` - Get student's applications
- `GET /api/applications/employer/my` - Get all employer's applications
- `PATCH /api/applications/:id` - Update application status
- `PATCH /api/applications/:id/interview` - Schedule interview

### Profiles
- `GET /api/students/me` - Get student profile
- `PUT /api/students/me` - Update student profile
- `GET /api/employers/me` - Get employer profile
- `PUT /api/employers/me` - Update employer profile

### Saved Jobs
- `POST /api/saved-jobs` - Save a job (STUDENT)
- `DELETE /api/saved-jobs/:jobId` - Unsave a job (STUDENT)
- `GET /api/saved-jobs/my` - Get saved jobs (STUDENT)

### Invitations
- `POST /api/invitations` - Send invitation (EMPLOYER)
- `GET /api/invitations/my` - Get received invitations (STUDENT)

## 🗄️ Database Schema

The application uses PostgreSQL with Prisma ORM. Key models:
- **User** - Polymorphic model for Students and Employers
- **Job** - Job postings
- **Application** - Job applications
- **Invitation** - Employer invitations to students
- **SavedJob** - Student saved jobs

See `unitalent-backend-full/prisma/schema.prisma` for full schema.

## 🔒 Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT token authentication
- ✅ Role-based access control (RBAC)
- ✅ SQL injection protection (Prisma)
- ✅ CORS configuration
- ✅ Security headers (Helmet)

## 📝 Available Scripts

### Backend
- `npm run dev` - Start development server with nodemon
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:generate` - Generate Prisma Client

## 🐛 Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Verify `DATABASE_URL` in `.env` is correct
- Check database exists: `CREATE DATABASE unitalent;`

### Port Already in Use
- Change `PORT` in `.env` file
- Or kill the process using the port

### CORS Errors
- Ensure `CORS_ORIGIN` in `.env` matches your frontend URL
- For multiple origins: `CORS_ORIGIN="http://localhost:8000,http://localhost:3001"`

## 📄 License

ISC

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Note**: Make sure to never commit `.env` files or sensitive information to version control.
