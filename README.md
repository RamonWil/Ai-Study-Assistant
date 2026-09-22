# AI Study Assistant & Adaptive Tutor

A personalized AI-powered study companion with interactive tutor chat, active quiz challenge modes, and document-to-flashcard generation.

## Bring Your Own Key (BYOK) & Zero-Cost Hosting

When you clone or publish this app to GitHub:

### Option 1: In-App BYOK (No Server Keys Needed)
Users can simply paste their own free Gemini API key directly into the app:
1. In the initial onboarding screen or inside the **Account Modal** (top-right header), enter a Gemini API Key.
2. The key is securely saved in the user's browser `localStorage` and sent with each tutor, challenge, and quiz request.
3. Get a free key at [Google Developer Console / Gemini](https://ai.google.dev/).
4. **This ensures users use their own Gemini quota, not mine! 😆**

### Option 2: Environment Variable
For self-hosting or deployment on Vercel / Railway / Cloud Run:
```bash
cp .env.example .env.local
```
Add your Gemini API key in `.env.local`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

## Features
- **Adaptive AI Tutor Personas**: Socratic Guide, Encouraging Coach, Drill Sergeant, Analogy Master, or build your own custom tutor.
- **Interactive Challenge Mode**: Gamified learning with real-time scoring, streaks, and confetti celebrations.
- **AI Quiz Generator**: Generates instant multi-choice assessments tailored to your exact subject and difficulty level.
- **Document to Flashcards**: Upload PDFs or text files to automatically extract concepts and study with interactive flip cards.
- **Google Sign-In & Profile Sync**: Seamless identity sync using Google OAuth 2.0.

## Getting Started
```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.
