# Millionaire Challenge / تحدي المليونير

A bilingual (English/Arabic) recreation of the classic **"Who Wants to Be a Millionaire"** quiz show built for the web. The project uses Firebase for authentication, Firestore for persistent storage, and ships with a rich administration console for managing every aspect of the game experience.

> ⚠️ Original sound effects are not bundled. Add the legally acquired audio cues described in [`public/assets/audio/README.md`](public/assets/audio/README.md) to unlock the full soundscape.

## ✨ Feature Highlights

- **Authentic gameplay** with all three lifelines (50:50, Ask the Audience, Phone a Friend), prize ladder logic, safe levels, and walk-away support.
- **Firebase Authentication** for email/password sign-up and sign-in, plus profile persistence in Firestore.
- **Firestore-backed content** so administrators can curate questions, answers, difficulty, and localization without touching code.
- **Professional administration panel** with create/update/delete workflows, bilingual fields, live previews, and role gating by email.
- **Persistent sessions** that save and resume in-progress games per user and device.
- **Bilingual interface** (English and Arabic) with full RTL support and dynamic translations.
- **Original audio integration hooks** ready for the official Millionaire cue sheet.

## 🗂️ Project Structure

```
public/
  index.html          # Single-page application shell
  styles.css          # Global styling and theme
  app.js              # SPA logic, Firebase integration, gameplay + admin code
  assets/
    audio/            # Drop authentic sound effects here (see README inside)
firebase.json         # Firebase Hosting configuration
```

## 🔐 Firebase Configuration

1. Create a Firebase project and enable **Email/Password** authentication.
2. Create a **Cloud Firestore** database in production mode (or test mode during development).
3. Copy your Firebase web app configuration from the project settings.
4. Update the `firebaseConfig` object in [`public/app.js`](public/app.js) with your keys.
5. (Optional) Adjust the `ADMIN_EMAILS` array in the same file with the addresses that should access the administration panel.

> 💡 Consider using Firebase security rules to restrict write access to the `questions` collection to trusted admins only.

## 🧑‍💻 Local Development

```bash
# Install the Firebase CLI if you have not already
yarn global add firebase-tools    # or: npm install -g firebase-tools

# Log in to Firebase
firebase login

# Serve the static app locally
firebase emulators:start --only hosting
# or use any static server, e.g.
npx serve public
```

Open [http://localhost:5000](http://localhost:5000) (or the port reported by your dev server) to explore the experience.

## 🧮 Data Model

| Collection | Purpose | Sample Fields |
|------------|---------|---------------|
| `users`    | Basic profile for each authenticated user. | `displayName`, `email`, `createdAt` |
| `questions`| Game content curated via the admin panel.  | `level` (1–15), `difficulty`, `question.en`, `question.ar`, `answers[]`, `correctIndex`, timestamps |
| `games`    | Historical results for completed games.    | `userId`, `userName`, `prize`, `levelReached`, `status`, `createdAt` |

### Question Document Schema

```json
{
  "level": 5,
  "difficulty": "medium",
  "question": { "en": "Which planet is known as the Red Planet?", "ar": "أي كوكب يُعرف بالكوكب الأحمر؟" },
  "answers": [
    { "en": "Mars", "ar": "المريخ" },
    { "en": "Venus", "ar": "الزهرة" },
    { "en": "Jupiter", "ar": "المشتري" },
    { "en": "Saturn", "ar": "زحل" }
  ],
  "correctIndex": 0,
  "createdAt": "Firebase timestamp",
  "updatedAt": "Firebase timestamp"
}
```

Ensure there is exactly **one question per level (1–15)** to cover a complete game run. Additional questions can be rotated manually via the admin panel.

## 🔊 Audio Assets

Place the officially licensed Millionaire cues inside [`public/assets/audio/`](public/assets/audio) with the following filenames:

| File name        | Usage                               |
|------------------|--------------------------------------|
| `intro.mp3`      | Played when a new game starts        |
| `question.mp3`   | Ambient music while answering        |
| `final-answer.mp3` | Played after locking in an answer |
| `correct.mp3`    | Celebration for correct answers      |
| `wrong.mp3`      | Reveal for incorrect answers         |

The game gracefully degrades (no crash) if the audio files are missing, but the immersive experience depends on them.

## 🌐 Multiple Languages

- Toggle between English and Arabic via the buttons in the hero banner.
- Interface copy is translated dynamically, including placeholders and button labels.
- Questions and answers support both languages. Populate both fields in the admin panel for a complete bilingual experience.

## 🛡️ Administration

- Only emails listed in `ADMIN_EMAILS` can access the admin panel.
- The panel allows adding, editing, and deleting questions across the 15 difficulty levels.
- Use the "Reset form" button to clear the editor, and "Back to menu" to return to the player dashboard.
- All edits are persisted to Firestore with timestamp metadata.

## 🇸🇦 ملاحظات عربية سريعة

- قم بتحديث إعدادات Firebase في ملف [`public/app.js`](public/app.js) قبل النشر.
- أضف الأصوات الأصلية للبرنامج في مجلد `public/assets/audio` بنفس أسماء الملفات المذكورة.
- لتعيين مسؤولين جدد للوحة التحكم، حدّث مصفوفة `ADMIN_EMAILS` وأعد النشر.
- يمكن تشغيل المشروع محلياً باستخدام Firebase CLI (`firebase emulators:start --only hosting`).

## 🚀 Deployment

```bash
firebase deploy --only hosting
```

Deploying publishes the static assets to Firebase Hosting using the configuration in `firebase.json`.

---

Enjoy crafting your own Millionaire journey! 🎉
