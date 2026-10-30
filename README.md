# Gender Equality Quiz — multi-participant results

This package keeps the existing quiz and adds a small Express API + MongoDB storage so multiple participants' results are saved centrally. The organiser can enter an admin key, view aggregate results, and download all saved results as one CSV.

## Files
- `frontend/index.html` — quiz frontend. Its API URL must be updated after backend deployment.
- `backend/server.js` — API that saves and returns results.

## 1. Create MongoDB database
1. Create a free MongoDB Atlas cluster at https://www.mongodb.com/atlas/database.
2. Create a database user and allow network access for your deployed API (for a simple setup, Atlas allows `0.0.0.0/0`; use a strong database password and do not share the connection string).
3. Copy the connection string. Replace the username/password placeholders and URL-encode special characters in the password if necessary.

## 2. Deploy backend to Render
1. Put the `backend` folder in a GitHub repository (or put its contents at the repository root).
2. In Render, create a **Web Service** connected to that repo.
3. If the backend folder is the repository root: Build command `npm install`; Start command `npm start`.
4. If using a monorepo with `backend/` as a subfolder, set Root Directory to `backend`, then use the same commands.
5. Add these environment variables in Render:
   - `MONGODB_URI` = your Atlas connection string
   - `DB_NAME` = `gender_quiz`
   - `ADMIN_KEY` = a long, private random string (do not put it in public code or share it with participants)
   - `FRONTEND_ORIGIN` = your exact Vercel site origin, e.g. `https://your-quiz.vercel.app` (no trailing slash). For multiple origins, separate them with commas.
6. Deploy. Open `https://YOUR-BACKEND.onrender.com/health`; it should show `{"ok":true}`.

## 3. Connect the frontend
1. Open `frontend/index.html` and find:
   `const API_BASE="https://YOUR-BACKEND-NAME.onrender.com";`
2. Replace it with your actual Render backend URL, e.g. `const API_BASE="https://gender-quiz-api.onrender.com";`.
3. Deploy `frontend/index.html` to Vercel as a static site. You can also serve it from another static host.

## 4. Use it
- Participants take the quiz; their score is posted to MongoDB automatically.
- On the start screen, click **View collected results (admin)** and enter the same `ADMIN_KEY` configured on Render.
- Click **Download CSV** to download all saved participant results into one `gender_quiz_results.csv` file.
- The CSV includes score, total, result category, time taken, submission time, and whether it was auto-submitted.

## Notes / privacy
- The quiz currently saves scores only, not names or answer-by-answer choices, matching the anonymous notice in the page.
- The admin key is a shared secret. Keep it private. Anyone who knows it can view the results.
- The public result-submit endpoint accepts score data from browsers. For a formal/high-stakes deployment, add stronger abuse prevention and server-side score validation.
- Free hosting services may sleep when inactive, so the first request after inactivity may take a little longer.
