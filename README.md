# Team Task Manager

Full-stack task management web app with role-based access control for Admin and Member users.

## Features
- Authentication with signup/login
- Project management with members
- Task creation, assignment, and status tracking
- Dashboard with task summary, status breakdown, and overdue counts
- REST API backend and React frontend

## Tech stack
- Backend: Node.js, Express, Prisma, PostgreSQL
- Frontend: React, Vite, TypeScript
- Deployment target: Railway

## Setup

### Backend
1. Open `backend` folder
2. Copy `.env.example` to `.env` and set `DATABASE_URL` and `JWT_SECRET`
3. Install dependencies:
   ```bash
   npm install
   ```
4. Generate Prisma client:
   ```bash
   npx prisma generate
   ```
5. Run migrations or use `prisma db push` to create schema:
   ```bash
   npx prisma db push
   ```
6. Start backend:
   ```bash
   npm run dev
   ```
7. Check health:
   ```bash
   http://localhost:4000/health
   ```

### Frontend
1. Open `frontend` folder
2. For local development, copy `.env.example` to `.env`
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start frontend:
   ```bash
   npm run dev
   ```

## Assignment Coverage
- REST APIs: auth, projects, project members, tasks
- Database: PostgreSQL with Prisma models and relations
- Validation: required fields, email/password checks, task status and due date checks
- RBAC: Admin users create projects, add members, and create tasks; Members can view projects/tasks and update status
- Dashboard: project count, task count, To Do, In Progress, Completed, and Overdue

## Demo Flow
1. Sign up as an Admin
2. Create a project
3. Sign up a second user as Member
4. Log back in as Admin and add the Member email to the project
5. Create a task, assign it to the Member, and set a due date
6. Log in as Member and update the task status

## Deployment
- Create a Railway PostgreSQL database
- Deploy `backend` as a Railway service
- Set backend variables:
  - `DATABASE_URL` from Railway PostgreSQL
  - `JWT_SECRET` to a long random string
  - `PORT` is provided by Railway automatically
- Deploy `frontend` as a Railway service
- Set frontend variable:
  - `VITE_API_BASE=https://your-backend-service.up.railway.app/api`
- Backend `npm start` runs `prisma db push` before starting the API

## Notes
- API base URL is configured in `frontend/src/api.ts`
- Use the created user credentials to login and manage projects/tasks
- Admin users can create projects, add members, and create tasks. Members can view project tasks and update task status.
