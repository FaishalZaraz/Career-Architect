# JobTracker

JobTracker is a modern, full-stack application designed to help users manage their job applications efficiently. It features a comprehensive dashboard with real-time analytics, job pipeline management, and seamless authentication.

Formerly known as **Career Architect**, this platform provides tools to track every stage of your job search journey.

## 🚀 Features

- **Personalized Dashboard**: View Application Statuses, Interview Rates, and Active Opportunities.
- **Analytics Visualization**: Dynamic charts for application sources and monthly activity.
- **Job Pipeline**: Manage job listings from application to offer.
- **Secure Authentication**: Integrated with Google OAuth and social logins via Better-Auth.
- **Responsive Design**: Built with Tailwind CSS for a premium, mobile-friendly experience.

## 📁 Project Structure

This project is a monorepo organized into two main applications:

- `apps/web`: The React-based frontend built with Vite and Tailwind CSS.
- `apps/api`: The Express-based backend using Drizzle ORM and PostgreSQL.

## 🛠 Tech Stack

### Frontend (Web)
- **Framework**: [React](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management & Data Fetching**: [TanStack Query (React Query)](https://tanstack.com/query/latest)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Authentication**: [Better-Auth](https://better-auth.com/)

### Backend (API)
- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express](https://expressjs.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (via Supabase)
- **Utility**: [tsx](https://tsx.is/) for seamless TypeScript execution

## 🏁 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [npm](https://www.npmjs.com/) (Standard package manager)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/JobTracker-Web.git
    cd JobTracker-Web
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Setup Environment Variables:**
    - Create a `.env` file in `apps/api` using `.env.example` as a template.
    - Create a `.env` file in `apps/web` with the necessary API URLs.

4.  **Run the development server:**
    ```bash
    # Run the entire monorepo in dev mode
    npm run dev
    ```

## 📜 Available Scripts

From the root directory, you can run:

- `npm run dev`: Starts the web application (and typically the API if workspace scripts are configured).
- `npm run build`: Builds the applications for production.
- `npm run preview`: Previews the production build of the web app.

---

Built with ❤️ by [Kira](https://github.com/Kira) (or Zarazir Corp).
v1.0.0
