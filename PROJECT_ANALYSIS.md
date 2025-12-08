# UniTalent Project Analysis

## 📋 Project Overview

**UniTalent** is a full-stack web application that connects university students with employers for internships and junior positions. It's a student-employer matching platform built with modern web technologies.

### Project Structure
```
Unitalent — копия/
├── frontend/              # Frontend (HTML/CSS/JS)
│   ├── assets/           # Static assets (logo, images)
│   ├── js/               # JavaScript modules
│   └── *.html           # HTML pages for different views
└── unitalent-backend — копия/  # Backend (Node.js/Express)
    ├── prisma/          # Database schema and migrations
    ├── src/
    │   ├── routes/      # API route handlers
    │   ├── middleware/  # Authentication middleware
    │   ├── app.js       # Express app configuration
    │   └── server.js    # Server entry point
    └── package.json     # Dependencies
```

---

## 🏗️ Architecture

### **Backend Architecture**

#### **Technology Stack**
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js 5.2.1
- **Database**: PostgreSQL (via Prisma ORM)
- **Authentication**: JWT (jsonwebtoken)
- **Security**: Helmet, CORS, bcrypt for password hashing
- **Logging**: Morgan

#### **Database Schema (Prisma)**
The application uses a well-structured relational database with the following models:

1. **User Model** (Polymorphic - Students & Employers)
   - Core fields: `id`, `email`, `password`, `role` (STUDENT/EMPLOYER/ADMIN)
   - Student-specific: `username`, `phone`, `university`, `major`, `studyYear`, `city`, `skills`, `bio`, `github`, `linkedin`, `portfolio`
   - Employer-specific: `bin`, `companySize`, `industry`
   - Relations: jobs, applications, invitations, savedJobs

2. **Job Model**
   - Fields: `id`, `title`, `description`, `location`, `salary`, `employerId`
   - Relations: employer, applications, invitations, savedBy

3. **Application Model**
   - Fields: `id`, `studentId`, `jobId`, `status`, `interviewDate`
   - Unique constraint: `[studentId, jobId]` (prevents duplicate applications)
   - Relations: student, job

4. **Invitation Model**
   - Fields: `id`, `employerId`, `studentId`, `jobId?`, `status`
   - Relations: employer, student, job (optional)

5. **SavedJob Model**
   - Fields: `id`, `studentId`, `jobId`
   - Unique constraint: `[studentId, jobId]` (prevents duplicate saves)

#### **API Routes Structure**

**Authentication Routes** (`/api/auth`)
- `POST /register` - Student registration
- `POST /login` - Student login
- `POST /employer/register` - Employer registration
- `POST /employer/login` - Employer login

**Jobs Routes** (`/api/jobs`)
- `GET /` - Public job listing
- `POST /` - Create job (EMPLOYER only)
- `GET /my` - Employer's own jobs
- `GET /:id` - Get single job (EMPLOYER only)
- `PATCH /:id` - Update job (EMPLOYER only)
- `DELETE /:id` - Delete job (EMPLOYER only)

**Applications Routes** (`/api/applications`)
- `POST /` - Student applies to job
- `GET /` - Employer views applicants for a job (requires `jobId` query)
- `GET /my` - Student's applications
- `GET /employer/my` - All applications across employer's jobs
- `PATCH /:id` - Update application status (EMPLOYER)
- `PATCH /:id/interview` - Schedule interview (EMPLOYER)

**Students Routes** (`/api/students`)
- `GET /me` - Get student profile
- `PUT /me` - Update student profile

**Employers Routes** (`/api/employers`)
- `GET /me` - Get employer profile
- `PUT /me` - Update employer profile

**Saved Jobs Routes** (`/api/saved-jobs`)
- `POST /` - Save a job (STUDENT)
- `DELETE /:jobId` - Unsave a job (STUDENT)
- `GET /my` - Get saved jobs (STUDENT)

**Invitations Routes** (`/api/invitations`)
- `POST /` - Employer sends invitation to student
- `GET /my` - Student views received invitations

#### **Authentication & Authorization**
- **JWT-based authentication** with Bearer token
- **Role-based access control** (RBAC) via `requireRole()` middleware
- **Password hashing** using bcrypt (10 rounds)
- Token expiration: 7 days (configurable via `JWT_EXPIRES_IN`)

#### **Security Features**
- Helmet.js for security headers
- CORS configuration (configurable origins)
- Input validation and sanitization
- SQL injection protection (Prisma ORM)
- Password never returned in API responses

---

### **Frontend Architecture**

#### **Technology Stack**
- **HTML5** with semantic markup
- **Tailwind CSS** (via CDN) for styling
- **Vanilla JavaScript** (ES6+ modules)
- **No build process** (direct HTML/JS files)

#### **Page Structure**

**Public Pages:**
- `index.html` - Landing page with featured jobs
- `jobs.html` - Public job listing
- `student-login.html` / `student-signup.html` - Student authentication
- `employer-login.html` / `employer-signup.html` - Employer authentication

**Student Pages:**
- `student-dashboard.html` - Main dashboard
- `student-profile.html` - Profile management
- `student-interviews.html` - Interview management
- `saved-jobs.html` - Saved jobs list

**Employer Pages:**
- `employer-dashboard.html` - Main dashboard
- `employer-profile.html` - Profile management
- `employer-new-job.html` - Create new job
- `employer-edit-job.html` - Edit existing job
- `employer-applicants.html` - View applicants
- `employer-interviews.html` - Interview management

#### **Frontend Features**
- **Responsive design** (mobile-first approach)
- **Dark theme** with animated background
- **Client-side routing** via role-based guards
- **LocalStorage/SessionStorage** for auth persistence
- **Dynamic UI updates** based on authentication state
- **API integration** with error handling

#### **JavaScript Modules**
- `js/auth.js` - Centralized authentication utilities
  - `readUniTalentAuth()` - Read auth from storage
  - `clearAllAuth()` - Clear all auth data
  - `guardRole(role)` - Route protection
  - `guardGuest()` - Prevent authenticated users from auth pages
  - `setupNavbarAuthUI()` - Dynamic navbar updates

---

## 🔑 Key Features

### **For Students**
1. ✅ User registration and authentication
2. ✅ Profile management (university, major, skills, portfolio links)
3. ✅ Browse and search jobs
4. ✅ Apply to jobs (one-click application)
5. ✅ Save jobs for later
6. ✅ Track application status
7. ✅ View interview invitations
8. ✅ Interview scheduling

### **For Employers**
1. ✅ User registration and authentication
2. ✅ Company profile management (BIN, size, industry)
3. ✅ Post job listings (title, description, location, salary)
4. ✅ Edit and delete job postings
5. ✅ View applicants for each job
6. ✅ Update application status (APPLIED → INTERVIEW → ACCEPTED/REJECTED)
7. ✅ Schedule interviews with students
8. ✅ Send invitations to students

---

## 📊 Database Migrations

The project includes 7 migrations showing evolution:
1. `20251205052713_init` - Initial schema
2. `20251205073021_add_username` - Added username field
3. `20251206084222_add_student_profile_fields` - Student profile expansion
4. `20251206150918_add_employer_profile_fields` - Employer profile expansion
5. `20251206165824_add_on_delete_cascade` - Cascade deletion setup
6. `20251206173836_add_saved_jobs` - Saved jobs feature
7. `20251206185231_add_interview_date_to_application` - Interview scheduling

---

## 🔒 Security Considerations

### **Strengths**
- ✅ Password hashing with bcrypt
- ✅ JWT token authentication
- ✅ Role-based access control
- ✅ SQL injection protection (Prisma)
- ✅ CORS configuration
- ✅ Security headers (Helmet)
- ✅ Input validation on backend

### **Areas for Improvement**
- ⚠️ No rate limiting (vulnerable to brute force)
- ⚠️ No email verification
- ⚠️ No password strength requirements
- ⚠️ No CSRF protection (though JWT helps)
- ⚠️ No input sanitization on frontend
- ⚠️ No file upload validation (if implemented)
- ⚠️ Environment variables not checked (could crash if missing)

---

## 🐛 Potential Issues & Recommendations

### **Code Quality**
1. **Error Handling**: Some routes have generic error messages that could expose internal details
2. **Validation**: Frontend lacks input validation (relies on backend)
3. **Type Safety**: No TypeScript (could benefit from it)
4. **Testing**: No test files found (unit/integration tests needed)

### **Performance**
1. **Database Queries**: Some queries could be optimized with proper indexing
2. **Frontend**: No code splitting or lazy loading
3. **API**: No pagination on job listings (could be slow with many jobs)
4. **Caching**: No caching strategy implemented

### **User Experience**
1. **Loading States**: Some pages may lack loading indicators
2. **Error Messages**: Could be more user-friendly
3. **Accessibility**: Should verify ARIA labels and keyboard navigation
4. **Mobile**: Should test on various devices

### **DevOps**
1. **Environment Variables**: Need `.env.example` file
2. **Documentation**: API documentation could be improved
3. **Deployment**: No deployment configuration (Docker, CI/CD)
4. **Logging**: Could use structured logging (Winston, Pino)

---

## 📦 Dependencies

### **Backend Dependencies**
- `express@^5.2.1` - Web framework
- `@prisma/client@^6.19.0` - Database ORM client
- `prisma@^6.19.0` - Database ORM
- `bcrypt@^6.0.0` - Password hashing
- `jsonwebtoken@^9.0.3` - JWT authentication
- `cors@^2.8.5` - CORS middleware
- `helmet@^8.1.0` - Security headers
- `morgan@^1.10.1` - HTTP request logger
- `dotenv@^17.2.3` - Environment variables

### **Dev Dependencies**
- `nodemon@^3.1.11` - Development server with auto-reload

---

## 🚀 Getting Started

### **Prerequisites**
- Node.js (v18+ recommended)
- PostgreSQL database
- npm or yarn

### **Backend Setup**
```bash
cd "unitalent-backend — копия"
npm install
# Create .env file with:
# DATABASE_URL="postgresql://user:password@localhost:5432/unitalent"
# JWT_SECRET="your-secret-key"
# JWT_EXPIRES_IN="7d"
# CORS_ORIGIN="http://localhost:3000"
# PORT=3000
npx prisma generate
npx prisma migrate dev
npm run dev
```

### **Frontend Setup**
```bash
# Serve frontend files (use any static server)
# Example with Python:
cd frontend
python -m http.server 8000
# Or use Live Server extension in VS Code
```

---

## 📈 Project Maturity

**Current State**: **MVP/Production-Ready Prototype**

The project appears to be a functional MVP with:
- ✅ Complete authentication flow
- ✅ Core features implemented
- ✅ Database schema well-designed
- ✅ Basic security measures
- ⚠️ Needs testing and optimization
- ⚠️ Needs deployment configuration
- ⚠️ Needs documentation

---

## 🎯 Summary

**UniTalent** is a well-structured full-stack application that successfully implements a student-employer matching platform. The codebase shows good separation of concerns, proper use of modern technologies, and thoughtful feature implementation. The main areas for improvement are testing, performance optimization, and additional security measures.

**Overall Assessment**: **Good** - Solid foundation with room for enhancement.

