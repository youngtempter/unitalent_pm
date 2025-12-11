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
│   │   ├── auth.js                    # Authentication utilities & guards
│   │   └── toast.js                   # Toast notification system
│   ├── assets/                        # Static assets
│   │   └── logo.png                   # Platform logo
│   ├── index.html                     # Landing page
│   ├── jobs.html                      # Public job listings
│   ├── job-details.html               # Job details page (full job information)
│   ├── contact.html                   # Contact form
│   ├── forgot-password.html           # Password reset request page
│   ├── reset-password.html            # Password reset form
│   ├── student-login.html             # Student login page
│   ├── student-signup.html            # Student registration
│   ├── student-dashboard.html         # Student dashboard
│   ├── student-profile.html           # Student profile management
│   ├── student-interviews.html        # Student interview schedule
│   ├── saved-jobs.html                # Saved jobs list
│   ├── employer-login.html            # Employer login page
│   ├── employer-signup.html           # Employer registration
│   ├── employer-dashboard.html        # Employer dashboard
│   ├── employer-profile.html          # Employer profile management
│   ├── employer-new-job.html          # Create new job posting
│   ├── employer-edit-job.html         # Edit existing job
│   ├── employer-applicants.html       # View job applicants
│   ├── employer-browse-students.html  # Browse student profiles
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
- **Toast Notifications** - Custom toast system for user feedback (replaces alerts)

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

# Download the better-sqlite3
npm install better-sqlite3

# Install all required packages at once for scraping SDU Portal
pip install flask requests beautifulsoup4 lxml

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
| `PATCH` | `/api/auth/me/credentials` | Change email and/or password | ✅ | Any |
| `POST` | `/api/auth/forgot-password` | Request password reset | ❌ | - |
| `GET` | `/api/auth/reset-password/:token` | Verify reset token | ❌ | - |
| `POST` | `/api/auth/reset-password/:token` | Reset password with token | ❌ | - |

**Request Body Examples:**
- Registration: `{ email, password, firstName?, lastName?, username? }`
- Login: `{ email, password }`
- Change Credentials: `{ currentPassword: string, newEmail?: string, newPassword?: string }`
- Forgot Password: `{ email: string }`
- Reset Password: `{ newPassword: string }`

**Response:** `{ token: string, user: { id, email, role, ... } }`

**Notes:**
- Change credentials endpoint requires current password verification and returns a fresh token with updated user data.
- Password reset tokens expire after 1 hour and can only be used once.
- Forgot password endpoint always returns success (to prevent email enumeration).

### Jobs
| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| `GET` | `/api/jobs` | Get all jobs (public, with search/filter) | ❌ | - |
| `POST` | `/api/jobs` | Create new job posting | ✅ | EMPLOYER |
| `GET` | `/api/jobs/my` | Get employer's own jobs | ✅ | EMPLOYER |
| `GET` | `/api/jobs/:id` | Get single job (public, increments view count) | ❌ | - |
| `GET` | `/api/jobs/:id/edit` | Get single job for editing | ✅ | EMPLOYER |
| `PATCH` | `/api/jobs/:id` | Update job details | ✅ | EMPLOYER |
| `DELETE` | `/api/jobs/:id` | Delete job posting | ✅ | EMPLOYER |
| `POST` | `/api/jobs/:id/view` | Increment view count | ❌ | - |

**Query Parameters for GET /api/jobs:**
- `q` - Search keyword (searches title & description)
- `location` - Filter by location
- `type` - Filter by job type (INTERNSHIP, PART_TIME, FULL_TIME)
- `workMode` - Filter by work mode (ON_SITE, HYBRID, REMOTE)
- `sortBy` - Sort order (`recent`, `oldest`, `views`, or omit for default)

**Request Body for POST/PATCH:**
```json
{
  "title": "string (required)",
  "description": "string (required)",
  "location": "string?",
  "salary": "string?",
  "type": "INTERNSHIP | PART_TIME | FULL_TIME",
  "workMode": "ON_SITE | HYBRID | REMOTE",
  "requirements": "string?",
  "expiresAt": "ISO date string?",
  "applicationDeadline": "ISO date string?"
}
```

**Note:** Jobs with `expiresAt` in the past are automatically excluded from public listings. Jobs with `applicationDeadline` in the past cannot receive new applications.

### Applications
| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| `POST` | `/api/applications` | Apply to a job | ✅ | STUDENT |
| `GET` | `/api/applications?jobId=:id` | Get applicants for specific job | ✅ | EMPLOYER |
| `GET` | `/api/applications/my` | Get student's own applications | ✅ | STUDENT |
| `GET` | `/api/applications/employer/my` | Get all applications across employer's jobs | ✅ | EMPLOYER |
| `GET` | `/api/applications/employer/interviews` | Get scheduled interviews for employer's jobs | ✅ | EMPLOYER |
| `GET` | `/api/applications/employer/funnel` | Get hiring funnel statistics | ✅ | EMPLOYER |
| `GET` | `/api/applications/employer/interviews/upcoming/count` | Get count of upcoming interviews | ✅ | EMPLOYER |
| `GET` | `/api/applications/my/interviews/upcoming/count` | Get count of student's upcoming interviews | ✅ | STUDENT |
| `PATCH` | `/api/applications/:id` | Update application status | ✅ | EMPLOYER |
| `PATCH` | `/api/applications/:id/interview` | Schedule interview | ✅ | EMPLOYER |
| `PATCH` | `/api/applications/:id/interview/cancel` | Cancel interview | ✅ | STUDENT |
| `PATCH` | `/api/applications/:id/offer` | Send job offer to applicant | ✅ | EMPLOYER |
| `DELETE` | `/api/applications/:id` | Withdraw application (STUDENT only) | ✅ | STUDENT |
| `PATCH` | `/api/applications/bulk` | Bulk update application statuses | ✅ | EMPLOYER |
| `GET` | `/api/applications/:id/logs` | Get application status history | ✅ | Any |

**Request Body Examples:**
- Apply: `{ jobId: number }`
- Update status: `{ status: string, interviewDate?: string }`
- Schedule interview: `{ interviewDate: string (ISO format) }`
- Send offer: No body required (updates status to "OFFERED")
- Bulk update: `{ applicationIds: [1,2,3] or ids: [1,2,3], status: string }`

**Note:** 
- Students can only withdraw applications with status `APPLIED` or `IN_REVIEW`
- Bulk update allows employers to update multiple applications at once
- Application logs track all status changes with timestamps and notes

**Application Statuses:** `APPLIED`, `IN_REVIEW`, `INTERVIEW`, `OFFERED`, `ACCEPTED`, `REJECTED`

**Hiring Funnel Response:**
```json
{
  "applicationsReceived": number,
  "inReview": number,
  "interviews": number,
  "offersMade": number
}
```

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

**Request Body:** `{ name: string (min 2 chars), email: string, message: string (min 10 chars) }`

**Response:** `{ ok: true, message: "Message received" }`

**Note:** Messages are stored in the `ContactMessage` table in the database. The endpoint validates input and returns appropriate error messages for invalid data.

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
- `expiresAt` (DateTime, Optional) - Job expiration date
- `applicationDeadline` (DateTime, Optional) - Application deadline
- `views` (Int, Default: 0) - View count tracker
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
- `notes` (Text, Optional) - Employer notes on application
- `createdAt` (DateTime)
- Unique constraint: `[studentId, jobId]`

**Relations:**
- `student` → User
- `job` → Job
- `logs` → ApplicationLog[]

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

#### ContactMessage
Contact form submissions from the public contact page.

**Fields:**
- `id` (Int, Primary Key)
- `name` (String, Required, min 2 chars)
- `email` (String, Required, valid email format)
- `message` (String, Required, min 10 chars, stored as Text)
- `createdAt` (DateTime, Default: now())

#### PasswordReset
Password reset tokens for secure password recovery.

**Fields:**
- `id` (Int, Primary Key)
- `userId` (Int, Foreign Key → User, Cascade Delete)
- `token` (String, Unique) - Secure random token
- `expiresAt` (DateTime) - Token expiration (1 hour)
- `used` (Boolean, Default: false) - Prevents reuse
- `createdAt` (DateTime)

**Relations:**
- `user` → User

**Indexes:**
- `token` (for fast lookup)
- `userId` (for cleanup)

#### ApplicationLog
Audit trail for application status changes.

**Fields:**
- `id` (Int, Primary Key)
- `applicationId` (Int, Foreign Key → Application, Cascade Delete)
- `status` (String) - Status changed to
- `changedBy` (Int) - User ID who made the change
- `notes` (Text, Optional) - Optional note about the change
- `createdAt` (DateTime)

**Relations:**
- `application` → Application

**Indexes:**
- `applicationId` (for fast lookup)
- `changedBy` (for audit queries)

### Database Migrations

The project includes migration history in `prisma/migrations/`:
- Initial schema setup
- Username field addition
- Student profile fields
- Employer profile fields
- Cascade delete constraints
- Saved jobs feature
- Interview date field
- Additional job fields (expiresAt, applicationDeadline, views)
- Contact messages table
- Password reset tokens
- Application logs and notes

See `unitalent-backend-full/prisma/schema.prisma` for the complete schema definition.

## ✨ Key Features

### For Students
- 🔐 Secure registration and login with password validation
- 🔑 Change email and password securely (with current password verification)
- 🔄 Password reset functionality (forgot password & reset with secure token)
- 📝 Comprehensive profile management (education, skills, portfolio links)
- 🔍 Advanced job search with filters (location, type, work mode) and sorting (Any, Recent, Oldest, Most Viewed)
- 📄 Paginated job listings (6 jobs per page with Previous/Next navigation)
- 📋 View detailed job information (full description, requirements, deadlines)
- 💾 Save favorite jobs for later
- 📤 One-click job applications
- 📊 Track application status (Applied, In Review, Interview, Offer Received, Accepted, Rejected)
- 📅 View and manage interview schedules (shows all interviews and offers)
- 📈 View upcoming interviews count on dashboard
- 🎯 Browse personalized job recommendations
- 📧 Receive employer invitations
- ❌ Withdraw applications (for APPLIED and IN_REVIEW statuses)
- 👁️ Password visibility toggle on login/signup forms
- 🔔 Toast notifications for better user feedback

### For Employers
- 🏢 Company profile management
- 🔑 Change email and password securely (with current password verification)
- 🔄 Password reset functionality (forgot password & reset with secure token)
- 📋 Create, edit, and delete job postings
- ⏰ Set job expiration dates and application deadlines
- 📊 Track job view counts
- 🔍 Browse and search student profiles
- 👥 View applicants for each job posting
- 📊 Manage all applications in one dashboard
- 📈 Hiring funnel statistics (applications received, in review, interviews, offers made)
- 📅 Schedule interviews with applicants
- 📅 View all scheduled interviews in one place
- 📈 View upcoming interviews count on dashboard
- 💼 Send job offers to applicants (can re-offer after status changes)
- 📝 Add notes to applications
- 📜 View application status history/logs
- 🔄 Bulk update application statuses
- ✉️ Send invitations to promising students
- 👁️ Password visibility toggle on login/signup forms
- 🔔 Toast notifications for better user feedback

### Platform Features
- 🎨 Modern, responsive UI with Tailwind CSS
- 🔒 Secure authentication with JWT tokens
- 🔄 Password reset system with secure tokens (1-hour expiration)
- 🛡️ Role-based access control
- 🔍 Full-text search capabilities
- 📄 Pagination for job listings (6 jobs per page)
- 📋 Job details page with full information
- 📱 Mobile-friendly design
- ⚡ Fast, RESTful API
- 🗄️ Robust database with Prisma ORM
- 📧 Functional contact form with database storage
- 👁️ Password visibility toggles for better UX
- 📊 Real-time hiring funnel statistics
- 🔔 Toast notification system (replaces browser alerts)
- 📜 Application audit trail (status change history)
- ⏰ Job expiration and deadline management
- 📊 Job view tracking

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
- ✅ **Credential Change Security**: Current password verification required for email/password changes

## 🖥️ Frontend Pages

### Public Pages
- **index.html** - Landing page with featured jobs, how it works, testimonials
- **jobs.html** - Public job listings with search, filter, sorting, and pagination (6 jobs per page)
- **job-details.html** - Detailed job view with full description, requirements, and all job information
- **contact.html** - Functional contact form that saves messages to database
- **forgot-password.html** - Password reset request page
- **reset-password.html** - Password reset form (requires valid token)

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
- **Toast System**: Custom toast notifications (`js/toast.js`) for user feedback
- **Local Storage**: Token and user data persistence
- **Dynamic UI**: Navbar and buttons adapt based on authentication state
- **API Integration**: All pages communicate with backend via Fetch API
- **Form Validation**: Client-side validation with server-side verification
- **Error Handling**: Graceful error handling with user-friendly messages

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

## 🆕 Recent Features & Improvements

### Latest Updates
- ✅ **Password Reset System**: Complete password recovery flow with secure tokens (1-hour expiration)
- ✅ **Job Details Page**: Dedicated page for viewing complete job information with full description and requirements
- ✅ **Toast Notifications**: Custom toast system replacing browser alerts for better UX
- ✅ **Application Withdrawal**: Students can withdraw applications with status APPLIED or IN_REVIEW
- ✅ **Application History**: Complete audit trail of application status changes with timestamps and notes
- ✅ **Bulk Operations**: Employers can bulk update multiple application statuses at once
- ✅ **Job Expiration & Deadlines**: Jobs can have expiration dates and application deadlines
- ✅ **Job View Tracking**: Automatic view count tracking for job postings
- ✅ **Enhanced Interview View**: Students can see all interviews and offers in one place
- ✅ **Re-offer Capability**: Employers can send offers again after status changes
- ✅ **Job Sorting**: Added "Any" option to job sorting (recent, oldest, most viewed, any)
- ✅ **Contact Form**: Fully functional contact form with database persistence
- ✅ **Credential Management**: Users can securely change email and password
- ✅ **Hiring Funnel Analytics**: Employers can track application pipeline statistics
- ✅ **Job Offers**: Employers can send job offers directly to applicants
- ✅ **Interview Management**: Enhanced interview scheduling and viewing for both students and employers
- ✅ **Pagination**: Job listings now support pagination (6 jobs per page)
- ✅ **Password Visibility Toggle**: Eye icon to show/hide passwords on login/signup forms
- ✅ **Application Statuses**: Added `IN_REVIEW` and `OFFERED` statuses for better workflow tracking
- ✅ **Dashboard KPIs**: Upcoming interviews count widgets on student and employer dashboards

## 🙏 Acknowledgments

- Built with modern web technologies
- Designed for university students and early-career professionals
- Focus on simplicity and user experience

---

**Note**: Make sure to never commit `.env` files or sensitive information to version control. Always use `.gitignore` to exclude sensitive files.
