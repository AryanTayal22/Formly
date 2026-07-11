# Formly — Typeform Clone

A full-stack conversational form builder closely inspired by Typeform. It includes a beautiful creator workspace, a builder with drag-and-drop capabilities and live previews, a polished one-question-at-a-time respondent flow with keyboard navigation, a responses dashboard, and a full Python backend.

## Tech Stack Used

- **Frontend:** Next.js 14, React, TypeScript, pure CSS (no Tailwind) for custom animations and glassmorphic designs.
- **Backend:** Python, FastAPI, SQLAlchemy ORM, Pydantic (for data validation).
- **Database:** SQLite (`formly.db`).

## Setup & Deployment Instructions

### Local Development Setup
You can run both servers using the convenient npm scripts in the project root. Make sure you have Node.js and Python installed.

**1. Install all dependencies:**
```bash
# Install frontend dependencies
cd frontend && npm install && cd ..

# Install backend dependencies
cd backend && pip install -r requirements.txt && cd ..
```

**2. Run the development servers:**
Open two terminal windows in the root of the project.

In Terminal 1 (Frontend):
```bash
npm run dev
# The Next.js app will start on http://localhost:3000
```

In Terminal 2 (Backend):
```bash
npm run backend
# The FastAPI server will start on http://localhost:8080
# The database will be created and seeded automatically.
```

### Deployment Guide
The project is built to easily deploy across platforms like Vercel and Render.

**1. Preparing GitHub:**
Push your repository to GitHub using:
```bash
git branch -M main
git remote add origin <YOUR_GITHUB_URL>
git push -u origin main
```

**2. Backend Deployment (Render.com):**
- Create a new **Web Service** on Render and connect your repository.
- **Root Directory:** `backend`
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- *Note:* The repository includes a `.python-version` file specifying Python 3.11.0 to ensure successful installation of `pydantic-core` in Render's build environment.

**3. Frontend Deployment (Vercel):**
- Create a new **Project** on Vercel and connect your repository.
- **Framework Preset:** Next.js
- **Root Directory:** `frontend` *(CRITICAL: Vercel must step into this folder to find Next.js!)*
- **Environment Variables:** Add `NEXT_PUBLIC_API_URL` and set its value to your new Render backend URL.
- Deploy!

## Architecture Overview

The application follows a standard Client-Server architecture:
- **Client (Frontend):** A Next.js App Router multi-page application. It utilizes dynamic routing (`/forms`, `/forms/[id]`, `/forms/[id]/edit`, `/forms/[id]/results`) to provide clean, shareable URLs for every workspace and public respondent view, making asynchronous `fetch` calls to the backend REST API for all state changes. The UI heavily utilizes CSS variables and custom animations to replicate the premium Typeform feel. It's modularized into distinct components (Dashboard, Builder, PublicForm, Results).
- **Server (Backend):** A FastAPI application that exposes a fully RESTful API. It handles all validation logic (e.g., verifying required fields and email formats on submission) and persists data using SQLAlchemy.

## Database Seeding

On a fresh startup (e.g., when the `formly.db` SQLite file does not exist or is completely empty, such as during a fresh Render deployment), the backend automatically seeds the database with 4 robust template forms:
- A Welcome Survey
- A Customer Satisfaction Survey
- A Community Event RSVP
- A Product Feedback (Draft)

These forms are fully populated with a variety of question types and mock respondent submissions to instantly demonstrate the platform's analytics and builder capabilities.

## Database Schema

The backend uses a normalized relational database schema with four core tables, utilizing foreign keys and `cascade="all, delete-orphan"` rules to prevent orphaned records:

1. **`forms`**: The core form entity.
   - `id` (Primary Key)
   - `title`, `status` (draft/published), `thank_you_message`
   - `created_at`, `updated_at`

2. **`questions`**: Linked to a form.
   - `id` (Primary Key)
   - `form_id` (Foreign Key -> forms.id)
   - `position` (integer for drag-and-drop ordering)
   - `type` (short_text, multiple_choice, rating, etc.)
   - `title`, `description`, `required`
   - `options` (JSON array for multiple choice/dropdown items)

3. **`responses`**: Represents a single submission session.
   - `id` (Primary Key)
   - `form_id` (Foreign Key -> forms.id)
   - `submitted_at`

4. **`answers`**: Stores the actual data submitted by the respondent.
   - `id` (Primary Key)
   - `response_id` (Foreign Key -> responses.id)
   - `question_id` (Foreign Key -> questions.id)
   - `value` (Text payload containing the answer)

## API & Routing Overview

The platform uses clean, predictable URL structures for both the frontend client and the backend REST API.

### Frontend Routes (Next.js App Router)
- `/forms` — Creator Dashboard (Workspace).
- `/forms/{id}` — Public Respondent Flow (e.g. `/forms/1`).
- `/forms/{id}/edit` — Creator Builder and Question Editor.
- `/forms/{id}/results` — Analytics and Individual Responses Dashboard.

The FastAPI backend exposes a clean RESTful interface:

### Creator API
- `GET /forms` — Lists all forms for the dashboard.
- `POST /forms` — Creates a new form.
- `GET /forms/{id}` — Fetches a full form definition for the builder.
- `PUT /forms/{id}` — Updates a form's metadata and completely syncs its questions.
- `DELETE /forms/{id}` — Deletes a form and cascades to all its questions and responses.
- `GET /forms/{id}/responses` — Retrieves all full submission records.
- `GET /forms/{id}/analytics` — Computes and returns summary statistics and option counts.

### Public API
- `GET /public/forms/{id}` — Safely fetches a published form for respondents (fails if draft).
- `POST /public/forms/{id}/responses` — Submits a respondent's answers. Enforces strict server-side validation (e.g. required fields, valid email structures, number checking) before persisting.

## Assumptions Made

- **Creator Authentication:** Real authentication is simplified for this MVP. We assume a default logged-in creator ("Aryan") who owns all forms in the single workspace.
- **State Integrity:** When a creator modifies a form's questions in the builder, the backend is smart enough to perform a differential update (matching existing question IDs) so that historical responses and answers are strictly preserved.
- **Placeholders:** Advanced features outside of the core CRUD and respondent flow—such as Theme Customization, Logic Jumps, Webhook Integrations, Team Collaboration, and Payment/File-Upload question types—are represented by deliberate "Coming Soon" UI placeholders as per the requirements.
- **Analytics Metrics:** The "Completion Rate" and "Average Time" metrics shown on the Results dashboard are hardcoded for reference/UI placeholder purposes and do not reflect actual calculated user tracking data.
