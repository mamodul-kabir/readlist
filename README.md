# ReadList

ReadList is a minimalist web application for tracking books read over time. Built using Next.js App Router, TypeScript, Vanilla CSS, and SQLite.

## Features

- **Public Reader Profile**: Accessible at `/@usertag`, displaying books grouped chronologically by year.
- **Currently Reading Section**: Highlights active reads at the top of the profile, enforced by a strict maximum limit of 4 books.
- **Google Books Integration**: Live book search by title with automated metadata retrieval and direct Google Search links.
- **Privacy Controls**: Global account privacy settings as well as per-book visibility toggles (`book-hidden`).
- **Short Reviews**: Optional reviews up to 250 words per book, accessible via expandable card overlays.
- **Undated and Unfinished Lists**: Dedicated sections for read books without a specified year and partially read books.

## Getting Started

### Prerequisites
- Node.js 18.0 or higher
- npm

### Installation and Local Development

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

To build and run the production bundle locally:
```bash
npm run build
npm start
```

## Testing

Run the automated integration test suite to verify database constraints, authentication flows, and API endpoints:

```bash
node scripts/test-app.js
```
