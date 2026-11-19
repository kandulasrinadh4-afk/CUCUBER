# 🏏 CUCUBER – Cricket Beyond Boundaries

**Your Cricket. Your Moments. Your CUCUBER.**

CUCUBER is a cricket-focused web application designed to keep cricket fans connected with the game through match updates, detailed scorecards, cricket news, live fan interactions, and interactive batting and bowling learning experiences.

Whether you're following a live match or improving your cricket knowledge, CUCUBER brings multiple cricket experiences together in one place.

---

## 🚀 Features

### 🏏 Match Center
- Live, upcoming, and recently completed matches.
- Match overview with scores and results.
- Detailed scorecards for both teams.
- Individual batting statistics:
  - Runs
  - Balls faced
  - Fours and sixes
  - Strike rate
  - Dismissal details
- Bowling statistics, extras, fall of wickets, and partnerships.

### 📰 Cricket News
- Cricket-related news and updates.
- Search-grounded information.
- News organized into relevant sections.

### 🔔 Smart Alerts
- Customizable cricket notifications.
- Wicket, boundary, and other match-event alerts.
- Busy Mode and alert preferences.
- Sound preview options.

### ❤️ Fan Pulse
- Interactive match reactions.
- Community polls and predictions.
- Real-time fan interactions.

### 🎓 Cricket Masterclass
**Train smarter. Play better.**

- Dedicated batting and bowling learning sections.
- Structured modules and lessons.
- Practice activities.
- Learning progress tracking.

### 🔐 Authentication
- Firebase Authentication.
- Email and password sign-in.
- Google Sign-In.
- User-specific app experience.

### 🌗 User Experience
- Dark and light themes.
- Responsive interface.
- Organized match and news sections.
- User-focused navigation.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, TypeScript |
| Styling | Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | Firebase Cloud Firestore |
| Authentication | Firebase Authentication |
| AI Integration | Google Gemini API |
| Search Grounding | Google Search Grounding |
| Development Platform | Google AI Studio |

---

## 🏗️ Application Architecture

```text
             USER
               |
               v
       REACT + TYPESCRIPT
          (Frontend)
               |
               v
       NODE.JS + EXPRESS
          (Backend)
          /         \
         v           v
    FIREBASE       GEMINI API
    FIRESTORE         +
    AUTHENTICATION  GOOGLE SEARCH
                    GROUNDING
```

### Architecture Overview

- **Frontend:** Displays match information, scorecards, news, alerts, and learning content.
- **Backend:** Handles API requests, cricket data processing, and communication with external services.
- **Firebase:** Supports authentication, database storage, and real-time application features.
- **Gemini:** Supports grounded cricket information retrieval and processing.

---

## 📂 Project Structure

The project is organized into frontend, backend, and shared application resources.

```text
CUCUBER/
│
├── src/
│   ├── components/
│   ├── services/
│   ├── lib/
│   ├── types/
│   └── App.tsx
│
├── server/
│   └── geminiCricketService.ts
│
├── public/
│
├── .gitignore
├── package.json
├──
