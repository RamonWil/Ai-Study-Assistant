# AI Study Assistant

A full-stack AI-powered learning platform designed to make studying more interactive and personalized.

AI Study Assistant combines adaptive AI tutoring, quizzes, challenge-based learning, and automatic flashcard generation into one application powered by **Google Gemini**.

## Features

### Adaptive AI Tutor

Chat with an AI tutor that adapts its explanations based on the student's subject, learning level, and preferred teaching style.

Available tutor personalities include:

* Socratic Guide
* Encouraging Coach
* Drill Sergeant
* Analogy Master
* Custom tutor personas

### Challenge Mode

Turn tutoring sessions into interactive challenges with:

* Real-time answer evaluation
* Scoring
* Streak tracking
* Continuous AI-generated questions
* Immediate explanations and feedback

### AI Quiz Generator

Generate multiple-choice quizzes based on a selected:

* Subject
* Topic
* Difficulty level

The AI dynamically generates questions to help students test their understanding.

### Document to Flashcards

Upload study material and automatically turn it into interactive flashcards.

Supported study materials include:

* PDF files
* Text files

### Google Sign-In

Google authentication allows users to sign in and maintain a personalized profile within the application.

### Bring Your Own Gemini Key

Users can provide their own Gemini API key directly through the application.

The key is stored locally in the browser and can be used for AI tutor, challenge, and quiz requests without requiring the developer's API quota.

The application can also use a server-side Gemini API key through environment variables.

## Tech Stack

**Frontend**

* Next.js
* React
* TypeScript
* Tailwind CSS
* Motion

**AI**

* Google Gemini
* Google GenAI SDK

**Authentication & Services**

* Firebase
* Google Authentication

**Document Processing**

* PDF parsing
* Text processing

**Additional Tools**

* ESLint
* Canvas Confetti
* Lucide React

## Architecture

The application uses the Next.js App Router with server-side API routes handling communication between the frontend and Gemini.

```text
User
  |
  v
Next.js / React Interface
  |
  v
Next.js API Routes
  |
  +---- Tutor API
  |
  +---- Quiz API
  |
  +---- Upload API
  |
  +---- API Key Verification
  |
  v
Google Gemini
```

AI requests are processed through backend API routes rather than directly embedding server credentials into the frontend.

Users can either provide their own Gemini API key or use a server-configured key.

## Project Structure

```text
Ai-Study-Assistant/
|
├── app/
|   ├── api/
|   |   ├── quiz/
|   |   ├── tutor/
|   |   ├── upload/
|   |   └── verify-key/
|   ├── layout.tsx
|   └── page.tsx
|
├── hooks/
├── lib/
├── assets/
├── public/
|
├── .env.example
├── next.config.ts
├── package.json
└── README.md
```

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/RamonWil/Ai-Study-Assistant.git
cd Ai-Study-Assistant
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure Gemini

Create a local environment file:

```bash
cp .env.example .env.local
```

Add your Gemini API key:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Alternatively, a Gemini API key can be entered directly inside the application.

### 4. Start the development server

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

## How the AI Tutor Works

The tutor receives information such as:

* Student name
* Student learning level
* Subject
* Selected tutor persona
* Conversation history
* Whether Challenge Mode is active

This context is used to dynamically construct instructions for Gemini so explanations can adapt to the student's learning preferences.

During Challenge Mode, the tutor evaluates answers, provides immediate feedback, and generates another question to continue the learning session.

## API Routes

```text
/api/tutor       AI tutoring and challenge conversations
/api/quiz        AI-generated assessments
/api/upload      Study material processing
/api/verify-key  Gemini API key verification
```

## Skills Demonstrated

This project demonstrates experience with:

* Full-stack web development
* Generative AI integration
* Large language model APIs
* Prompt engineering
* REST-style API development
* React and Next.js
* TypeScript
* Authentication
* Document processing
* State management
* Responsive UI development
* Environment variable and API-key management

## Future Improvements

* Persistent study history across devices
* Student performance analytics
* Expanded document format support
* Saved flashcard decks
* Personalized study recommendations
* Progress tracking
* Additional tutor customization
* Improved adaptive difficulty based on student performance

## Author

**[Ramon Williams](https://ramonwilliams.com)**
Computer Engineering — University of Kentucky

[Website](https://ramonwilliams.com) • [LinkedIn](https://www.linkedin.com/in/itsramon-williams)
