# UniTalent - Full Stack Platform

A full-stack web application connecting university students with employers for internships and junior positions.

## 🚀 Project Overview

UniTalent is a student-employer matching platform that enables:
- **Students** to browse jobs, apply, save favorites, manage profiles, track applications, and view interview schedules
- **Employers** to post jobs, review applicants, schedule interviews, send invitations, browse student profiles, and manage their company information

## 📁 Project Structure

```
unitalent-reqruitment system/
├── frontend/                           # Frontend (HTML/CSS/JS)
│   ├── assets/                        # Static assets (logo, images)
│   │   └── logo.png
│   ├── js/                            # JavaScript modules
│   │   └── auth.js                    # Authentication utilities & guards
│   ├── index.html                     # Landing page
│   ├── jobs.html                      # Public job listings
│   ├── contact.html                   # Contact form
│   ├── student-login.html             # Student login page
│   ├── student-signup.html            # Student registration
│   ├── student-dashboard.html          # Student dashboard
│   ├── student-profile.html            # Student profile management
│   ├── student-interviews.html        # Student interview schedule
│   ├── saved-jobs.html                 # Saved jobs list
│   ├── employer-login.html             # Employer login page
│   ├── employer-signup.html           # Employer registration
│   ├── employer-dashboard.html        # Employer dashboard
│   ├── employer-profile.html          # Employer profile management
│   ├── employer-new-job.html          # Create new job posting
│   ├── employer-edit-job.html         # Edit existing job
│   ├── employer-applicants.html        # View job applicants
│   ├── employer-browse-students.html   # Browse student profiles
│   ├── employer-student-profile.html  # View individual student profile
│   ├── employer-interviews.html       # Manage interviews
│   └── styles.css                     # Custom styles
└── unitalent-backend-full/            # Backend (Node.js/Express)
    ├── prisma/                        # Database schema and migrations
    │   ├── schema.prisma              # Prisma schema definition
    │   └── migrations/                # Database migration history
    ├── src/
    │   ├── routes/                    # API route handlers
    │   │   ├── auth.routes.js         # Authentication routes
    │   │   ├── jobs.routes.js         # Job CRUD operations
    │   │   ├── applications.routes.js  # Application management
    │   │   ├── invitations.routes.js  # Invitation system
    │   │   ├── students.routes.js     # Student profile routes
    │   │   ├── employers.routes.js   # Employer profile routes
    │   │   ├── savedjobs.routes.js    # Saved jobs management
    │   │   └── contact.routes.js      # Contact form handler
    │   ├── middleware/                 # Express middleware
    │   │   └── auth.js                 # JWT authentication & RBAC
    │   ├── prisma.js                   # Prisma client instance
    │   ├── app.js                      # Express app configuration
    │   └── server.js                   # Server entry point
    ├── package.json                    # Dependencies & scripts
    └── package-lock.json               # Dependency lock file
```

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js (v18+ recommended, ES Modules)
- **Framework**: Express.js 5.2.1
- **Database**: PostgreSQL (via Prisma ORM 6.19.0)
- **Authentication**: JWT (jsonwebtoken 9.0.3)
- **Security**: 
  - Helmet 8.1.0 (security headers)
  - CORS 2.8.5 (cross-origin resource sharing)
  - bcrypt 6.0.0 (password hashing)
- **Logging**: Morgan 1.10.1 (HTTP request logger)
- **Environment**: dotenv 17.2.3
- **Development**: nodemon 3.1.11 (auto-restart)

### Frontend
- **HTML5** with semantic markup
- **Tailwind CSS** (via CDN) - Modern utility-first CSS framework
- **Vanilla JavaScript** (ES6+ modules) - No build step required
- **LocalStorage/SessionStorage** - Client-side authentication state
- **Fetch API** - HTTP requests to backend

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
cd "unitalent-reqruitment system"
# Note: The directory name may vary based on your system
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

# Option 2: Using Node.js http-server (install globally: npm i -g http-server)
npx http-server -p 8000

# Option 3: Using VS Code Live Server extension
# Right-click on index.html and select "Open with Live Server"

# Option 4: Using PHP (if installed)
php -S localhost:8000
```

The frontend will be available at `http://localhost:8000`

**Important:** Ensure the backend API is running on `http://localhost:3000` for the frontend to function properly. The frontend makes API calls to this endpoint.

## 🔑 Environment Variables

Create a `.env` file in `unitalent-backend-full/` directory:

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/unitalent` | ✅ |
| `JWT_SECRET` | Secret key for JWT tokens (use strong random string) | `your-super-secret-jwt-key-change-this` | ✅ |
| `JWT_EXPIRES_IN` | Token expiration time | `7d`, `24h`, `1h` | ❌ (default: `7d`) |
| `PORT` | Server port | `3000` | ❌ (default: `3000`) |
| `CORS_ORIGIN` | Allowed CORS origins (comma-separated for multiple) | `http://localhost:8000` | ❌ (default: `*`) |
| `NODE_ENV` | Environment mode | `development`, `production` | ❌ (default: `development`) |

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

### API Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

Tokens are returned upon successful login/registration and should be stored client-side (localStorage/sessionStorage).

## 📚 API Endpoints

### Authentication
| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| `POST` | `/api/auth/register` | Student registration | ❌ | - |
| `POST` | `/api/auth/login` | Student login | ❌ | - |
| `POST` | `/api/auth/employer/register` | Employer registration | ❌ | - |
| `POST` | `/api/auth/employer/login` | Employer login | ❌ | - |

**Request Body Examples:**
- Registration: `{ email, password, firstName?, lastName?, username? }`
- Login: `{ email, password }`

**Response:** `{ token: string, user: { id, email, role, ... } }`

### Jobs
| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| `GET` | `/api/jobs` | Get all jobs (public, with search/filter) | ❌ | - |
| `POST` | `/api/jobs` | Create new job posting | ✅ | EMPLOYER |
| `GET` | `/api/jobs/my` | Get employer's own jobs | ✅ | EMPLOYER |
| `GET` | `/api/jobs/:id` | Get single job for editing | ✅ | EMPLOYER |
| `PATCH` | `/api/jobs/:id` | Update job details | ✅ | EMPLOYER |
| `DELETE` | `/api/jobs/:id` | Delete job posting | ✅ | EMPLOYER |

**Query Parameters for GET /api/jobs:**
- `q` - Search keyword (searches title & description)
- `location` - Filter by location
- `type` - Filter by job type (INTERNSHIP, PART_TIME, FULL_TIME)
- `workMode` - Filter by work mode (ON_SITE, HYBRID, REMOTE)

**Request Body for POST/PATCH:**
```json
{
  "title": "string (required)",
  "description": "string (required)",
  "location": "string?",
  "salary": "string?",
  "type": "INTERNSHIP | PART_TIME | FULL_TIME",
  "workMode": "ON_SITE | HYBRID | REMOTE",
  "requirements": "string?"
}
```

### Applications
| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| `POST` | `/api/applications` | Apply to a job | ✅ | STUDENT |
| `GET` | `/api/applications?jobId=:id` | Get applicants for specific job | ✅ | EMPLOYER |
| `GET` | `/api/applications/my` | Get student's own applications | ✅ | STUDENT |
| `GET` | `/api/applications/employer/my` | Get all applications across employer's jobs | ✅ | EMPLOYER |
| `PATCH` | `/api/applications/:id` | Update application status | ✅ | EMPLOYER |
| `PATCH` | `/api/applications/:id/interview` | Schedule interview | ✅ | EMPLOYER |
| `PATCH` | `/api/applications/:id/interview/cancel` | Cancel interview | ✅ | STUDENT |

**Request Body Examples:**
- Apply: `{ jobId: number }`
- Update status: `{ status: string, interviewDate?: string }`
- Schedule interview: `{ interviewDate: string (ISO format) }`

**Application Statuses:** `APPLIED`, `INTERVIEW`, `ACCEPTED`, `REJECTED`

### Student Profiles
| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| `GET` | `/api/students/me` | Get current student profile | ✅ | STUDENT |
| `PUT` | `/api/students/me` | Update student profile | ✅ | STUDENT |
| `GET` | `/api/students` | Search/browse students | ✅ | EMPLOYER |
| `GET` | `/api/students/:id` | Get student profile by ID | ✅ | EMPLOYER |

**Query Parameters for GET /api/students:**
- `q` - Search keyword (name, username, skills, major, university)
- `city` - Filter by city
- `studyYear` - Filter by study year
- `major` - Filter by major
- `university` - Filter by university

**Profile Fields:**
```json
{
  "firstName": "string?",
  "lastName": "string?",
  "username": "string? (unique)",
  "phone": "string?",
  "university": "string?",
  "major": "string?",
  "studyYear": "string?",
  "city": "string?",
  "skills": "string?",
  "bio": "string?",
  "github": "string?",
  "linkedin": "string?",
  "portfolio": "string?"
}
```

### Employer Profiles
| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| `GET` | `/api/employers/me` | Get current employer profile | ✅ | EMPLOYER |
| `PUT` | `/api/employers/me` | Update employer profile | ✅ | EMPLOYER |

**Profile Fields:**
```json
{
  "firstName": "string?",
  "lastName": "string?",
  "bin": "string?",
  "companySize": "string?",
  "city": "string?",
  "industry": "string?"
}
```

### Saved Jobs
| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| `POST` | `/api/saved-jobs` | Save a job (idempotent) | ✅ | STUDENT |
| `DELETE` | `/api/saved-jobs/:jobId` | Unsave a job | ✅ | STUDENT |
| `GET` | `/api/saved-jobs/my` | Get all saved jobs | ✅ | STUDENT |

**Request Body for POST:** `{ jobId: number }`

### Invitations
| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| `POST` | `/api/invitations` | Send invitation to student | ✅ | EMPLOYER |
| `GET` | `/api/invitations/my` | Get received invitations | ✅ | STUDENT |

**Request Body for POST:** `{ studentId: number, jobId?: number }`

### Contact
| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| `POST` | `/api/contact` | Submit contact form | ❌ | - |

**Request Body:** `{ name: string, email: string, message: string (min 10 chars) }`

### Health Check
| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| `GET` | `/health` | API health check | ❌ | - |

## 🗄️ Database Schema

The application uses PostgreSQL with Prisma ORM. The database schema includes:

### Models

#### User (Polymorphic)
Single model for both Students and Employers, differentiated by `role` field.

**Fields:**
- `id` (Int, Primary Key)
- `email` (String, Unique)
- `password` (String, Hashed)
- `role` (Enum: STUDENT, EMPLOYER, ADMIN)
- `firstName`, `lastName`, `username` (Optional)
- **Student-specific fields:** `phone`, `university`, `major`, `studyYear`, `city`, `skills`, `bio`, `github`, `linkedin`, `portfolio`
- **Employer-specific fields:** `bin`, `companySize`, `industry`
- `createdAt` (DateTime)

**Relations:**
- `employerJobs` → Job[]
- `applications` → Application[]
- `invitationsSent` → Invitation[]
- `invitationsReceived` → Invitation[]
- `savedJobs` → SavedJob[]

#### Job
Job postings created by employers.

**Fields:**
- `id` (Int, Primary Key)
- `title` (String, Required)
- `description` (String, Required)
- `location`, `salary`, `type`, `workMode`, `requirements` (Optional)
- `employerId` (Int, Foreign Key → User)
- `createdAt` (DateTime)

**Relations:**
- `employer` → User
- `applications` → Application[]
- `invitations` → Invitation[]
- `savedBy` → SavedJob[]

#### Application
Job applications submitted by students.

**Fields:**
- `id` (Int, Primary Key)
- `studentId` (Int, Foreign Key → User)
- `jobId` (Int, Foreign Key → Job, Cascade Delete)
- `status` (String, Default: "APPLIED")
- `interviewDate` (DateTime, Optional)
- `createdAt` (DateTime)
- Unique constraint: `[studentId, jobId]`

**Relations:**
- `student` → User
- `job` → Job

#### Invitation
Invitations sent by employers to students.

**Fields:**
- `id` (Int, Primary Key)
- `employerId` (Int, Foreign Key → User)
- `studentId` (Int, Foreign Key → User)
- `jobId` (Int, Foreign Key → Job, Optional, Cascade Delete)
- `status` (String, Default: "SENT")
- `createdAt` (DateTime)

**Relations:**
- `employer` → User
- `student` → User
- `job` → Job (Optional)

#### SavedJob
Jobs saved by students for later viewing.

**Fields:**
- `id` (Int, Primary Key)
- `studentId` (Int, Foreign Key → User, Cascade Delete)
- `jobId` (Int, Foreign Key → Job, Cascade Delete)
- `createdAt` (DateTime)
- Unique constraint: `[studentId, jobId]`

**Relations:**
- `student` → User
- `job` → Job

### Database Migrations

The project includes migration history in `prisma/migrations/`:
- Initial schema setup
- Username field addition
- Student profile fields
- Employer profile fields
- Cascade delete constraints
- Saved jobs feature
- Interview date field
- Additional job fields

See `unitalent-backend-full/prisma/schema.prisma` for the complete schema definition.

## ✨ Key Features

### For Students
- 🔐 Secure registration and login with password validation
- 📝 Comprehensive profile management (education, skills, portfolio links)
- 🔍 Advanced job search with filters (location, type, work mode)
- 💾 Save favorite jobs for later
- 📤 One-click job applications
- 📊 Track application status (Applied, Interview, Accepted, Rejected)
- 📅 View and manage interview schedules
- 🎯 Browse personalized job recommendations
- 📧 Receive employer invitations

### For Employers
- 🏢 Company profile management
- 📋 Create, edit, and delete job postings
- 🔍 Browse and search student profiles
- 👥 View applicants for each job posting
- 📊 Manage all applications in one dashboard
- 📅 Schedule interviews with applicants
- ✉️ Send invitations to promising students
- 📈 Track application statistics

### Platform Features
- 🎨 Modern, responsive UI with Tailwind CSS
- 🔒 Secure authentication with JWT tokens
- 🛡️ Role-based access control
- 🔍 Full-text search capabilities
- 📱 Mobile-friendly design
- ⚡ Fast, RESTful API
- 🗄️ Robust database with Prisma ORM

## 🔒 Security Features

- ✅ **Password Security**: bcrypt hashing with salt rounds
- ✅ **Authentication**: JWT tokens with configurable expiration
- ✅ **Authorization**: Role-based access control (RBAC) middleware
- ✅ **SQL Injection Protection**: Prisma ORM parameterized queries
- ✅ **CORS**: Configurable cross-origin resource sharing
- ✅ **Security Headers**: Helmet.js for HTTP security headers
- ✅ **Input Validation**: Email format, password strength requirements
- ✅ **Token Verification**: Middleware validates JWT on protected routes
- ✅ **Unique Constraints**: Database-level uniqueness for emails, usernames

## 🖥️ Frontend Pages

### Public Pages
- **index.html** - Landing page with featured jobs, how it works, testimonials
- **jobs.html** - Public job listings with search and filter functionality
- **contact.html** - Contact form for inquiries

### Student Pages
- **student-login.html** - Student authentication
- **student-signup.html** - Student registration
- **student-dashboard.html** - Overview of applications, saved jobs, interviews
- **student-profile.html** - Profile management (education, skills, links)
- **student-interviews.html** - View and manage scheduled interviews
- **saved-jobs.html** - Browse saved job postings

### Employer Pages
- **employer-login.html** - Employer authentication
- **employer-signup.html** - Employer registration
- **employer-dashboard.html** - Overview of jobs, applications, statistics
- **employer-profile.html** - Company profile management
- **employer-new-job.html** - Create new job posting
- **employer-edit-job.html** - Edit existing job posting
- **employer-applicants.html** - View applicants for a specific job
- **employer-browse-students.html** - Search and browse student profiles
- **employer-student-profile.html** - View individual student profile
- **employer-interviews.html** - Manage interview schedules

### Frontend Architecture
- **Authentication Guard**: Role-based page protection via `data-guard` attribute
- **Auth Module**: Centralized authentication utilities (`js/auth.js`)
- **Local Storage**: Token and user data persistence
- **Dynamic UI**: Navbar and buttons adapt based on authentication state
- **API Integration**: All pages communicate with backend via Fetch API

## 📝 Available Scripts

### Backend
```bash
npm run dev              # Start development server with nodemon (auto-restart)
npm run prisma:migrate   # Run database migrations
npm run prisma:generate  # Generate Prisma Client after schema changes
```

### Frontend
The frontend is static HTML/CSS/JS, served via any static file server:
- Python: `python -m http.server 8000`
- Node.js: `npx http-server -p 8000`
- VS Code: Live Server extension

## 🐛 Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running on your system
- Verify `DATABASE_URL` in `.env` matches your PostgreSQL credentials
- Create the database if it doesn't exist:
  ```sql
  CREATE DATABASE unitalent;
  ```
- Test connection: `psql -U your_user -d unitalent`

### Port Already in Use
- **Backend (3000)**: Change `PORT` in `.env` file or kill the process:
  ```bash
  # Windows
  netstat -ano | findstr :3000
  taskkill /PID <PID> /F
  
  # Linux/Mac
  lsof -ti:3000 | xargs kill
  ```
- **Frontend (8000)**: Use a different port or kill the process

### CORS Errors
- Ensure `CORS_ORIGIN` in `.env` matches your frontend URL exactly
- For multiple origins: `CORS_ORIGIN="http://localhost:8000,http://localhost:3001"`
- Check browser console for specific CORS error messages
- Verify backend is running and accessible

### Prisma Issues
- **Client not generated**: Run `npm run prisma:generate`
- **Migration errors**: Check database connection and ensure migrations are up to date
- **Schema changes**: After modifying `schema.prisma`, run:
  ```bash
  npm run prisma:generate
  npm run prisma:migrate
  ```

### Authentication Issues
- **Token expired**: Log in again to get a new token
- **Invalid credentials**: Check email/password format
- **Role mismatch**: Ensure you're using the correct login endpoint (student vs employer)
- **Token not found**: Clear browser storage and log in again

### Frontend Not Loading Data
- Check browser console for errors
- Verify backend API is running: `curl http://localhost:3000/health`
- Check network tab for failed API requests
- Ensure API URL in frontend code matches backend URL

## 🔄 Development Workflow

### Making Changes

1. **Backend Changes:**
   ```bash
   cd unitalent-backend-full
   # Make your changes
   npm run dev  # Auto-restarts on file changes
   ```

2. **Database Schema Changes:**
   ```bash
   # Edit prisma/schema.prisma
   npm run prisma:migrate  # Creates and applies migration
   npm run prisma:generate  # Regenerates Prisma Client
   ```

3. **Frontend Changes:**
   - Edit HTML/CSS/JS files in `frontend/`
   - Refresh browser (or use Live Server for auto-reload)
   - Check browser console for errors

### Testing API Endpoints

Use tools like:
- **Postman** or **Insomnia** for API testing
- **curl** for command-line testing:
  ```bash
  # Health check
  curl http://localhost:3000/health
  
  # Login (example)
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"Test1234"}'
  ```

### Code Structure

- **Routes**: Each feature has its own route file in `src/routes/`
- **Middleware**: Authentication and authorization in `src/middleware/`
- **Frontend**: Each page is a separate HTML file with inline or module scripts
- **Auth**: Centralized in `frontend/js/auth.js` for consistency

## 📄 License

ISC

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Contribution Guidelines
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📧 Contact

For questions or support, please open an issue on GitHub.

## 🙏 Acknowledgments

- Built with modern web technologies
- Designed for university students and early-career professionals
- Focus on simplicity and user experience

---

**Note**: Make sure to never commit `.env` files or sensitive information to version control. Always use `.gitignore` to exclude sensitive files.
