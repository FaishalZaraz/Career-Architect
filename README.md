# ![Logo](./apps/web/public/logo.png) JobTracker (Career Architect)

JobTracker is a modern, full-stack application designed to help you organize, track, and manage your job applications efficiently. 

Featuring a comprehensive dashboard with real-time analytics, pipeline management, and secure Google authentication, this platform is your ultimate sidekick in the job hunting journey.

---

## 🚀 Features

- **Personalized Dashboard**: View Application Statuses, Interview Rates, and Active Opportunities at a glance.
- **Analytics Visualization**: Dynamic and responsive charts tracing your monthly job hunt velocity.
- **Job Pipeline**: Track job listings meticulously from the initial application up to the offer phase.
- **Secure Authentication**: Integrated seamlessly with Google OAuth (powered by Better-Auth).
- **Responsive Design**: Beautiful, mobile-friendly interfaces built with Tailwind CSS.

---

## 🛠 Tech Stack

- **Frontend**: [React](https://react.dev/), [Vite](https://vitejs.dev/), [Tailwind CSS](https://tailwindcss.com/), [TanStack Query](https://tanstack.com/)
- **Backend**: [Node.js](https://nodejs.org/), [Express](https://expressjs.com/), [TypeScript](https://www.typescriptlang.org/)
- **Database Engine**: [PostgreSQL](https://www.postgresql.org/), [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication**: [Better-Auth](https://better-auth.com/)

---

## 📖 Beginners Guide: How to Run on Your Local Computer

Follow these step-by-step instructions carefully to run this application on your own machine.

### Step 1: Install Prerequisites
Before you start, make sure you have installed:
1. **[Node.js](https://nodejs.org/)** (Version 18 or newer). Download and install it on your PC.
2. **[Git](https://git-scm.com/)** (To clone this repository).
3. A **PostgreSQL Database**. The easiest way is to create a free online database at **[Supabase](https://supabase.com/)** or **[Neon.tech](https://neon.tech/)**.

### Step 2: Clone the Repository & Install
Open your Terminal or Command Prompt and run the following commands:
```bash
# 1. Download the code to your PC
git clone https://github.com/FaishalZaraz/JobTracker-Web.git

# 2. Enter the project folder
cd JobTracker-Web

# 3. Install all required dependencies
npm install
```

### Step 3: Setup Variables (The `.env` file)
The application needs to know your Database and Google Login keys. 

1. Navigate to the `apps/api` folder.
2. You will see a file named `.env.example`. Duplicate this file and rename the copy to `.env`.
3. Open the `.env` file in your code editor and fill in the blanks:

```env
# Fill this with your PostgreSQL connection URL (from Supabase/Neon)
DATABASE_URL=postgresql://username:password@hostname:5432/postgres

# Generate a random string of characters and paste it here for security
BETTER_AUTH_SECRET=rahasia_acak_bebas_yang_penting_aman
BETTER_AUTH_URL=http://localhost:4000

# To enable Google Sign-In, get these keys from Google Cloud Console
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Required for APIs
PORT=4000
FRONTEND_URL=http://localhost:3000
```

### Step 4: Push the Database Schema
Before running the app, you need to create the necessary tables in your database. Open your terminal and run:
```bash
# Go to the backend directory
cd apps/api

# Push the database structure
npm run db:push

# Go back to the root folder
cd ../..
```

*(Note: If you want to view your database using a friendly interface, you can also run `npm run db:studio` inside the `apps/api` folder!)*

### Step 5: Start the Application!
You are almost done! Make sure you are at the root `JobTracker-Web` folder on your terminal, then type:
```bash
npm run dev
```
- Your **Frontend** will automatically open at: `http://localhost:3000`
- Your **Backend API** will run quietly at: `http://localhost:4000`

Open your browser, navigate to `http://localhost:3000` and enjoy the app!

---

## 🙋‍♂️ Troubleshooting (Common Issues)

- **"Port 3000 is already in use"**: Another application is using the port. Find and close it, or restart your computer.
- **"Database Connection Failed"**: Double check your `DATABASE_URL` in the `.env` file. Ensure your database password doesn't contain unescaped special characters.
- **"Google OAuth Redirect Mismatch"**: Ensure you have added `http://localhost:4000/api/auth/callback/google` to your Google Cloud Console "Authorized redirect URIs" section.
- **"Google keeps asking for 2FA"**: This is standard Google security behavior for local unverified development sites (`localhost`). It will vanish once deployed to a production domain later.

---

Built with ☕ by [Zarazir](https://github.com/FaishalZaraz).
v1.0.0
