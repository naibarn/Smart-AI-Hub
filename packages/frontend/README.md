# Frontend

## Overview

The Frontend is the user interface for Smart AI Hub using React, TypeScript, and Vite for building and development. It uses Material-UI for styling and components, with a basic app structure.

## Setup Instructions

### Prerequisites

- Node.js 20+
- TypeScript 5+
- npm or yarn

### Installation

1. Navigate to the service directory:

   ```
   cd frontend
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Copy environment variables:
   ```
   cp .env.example .env
   ```
   Edit `.env` (e.g., VITE_API_URL=http://localhost:3000).

### Development

1. Run in development mode:

   ```
   npm run dev
   ```

   The app will start on http://localhost:5173 (Vite default).

2. Build for production:

   ```
   npm run build
   ```

3. Preview production build:
   ```
   npm run preview
   ```

### Docker

1. Build the image:

   ```
   docker build -t frontend .
   ```

2. Run the container:
   ```
   docker run -p 3000:3000 -e NODE_ENV=production frontend
   ```

### Components

- `src/App.tsx`: Main app component with MUI styling.
- `src/index.tsx`: Entry point rendering App.

### Dependencies

- react, react-dom: React framework.
- @mui/material: Material-UI components.
- vite: Build tool and dev server.

### TypeScript Configuration

Extends root `tsconfig.base.json` with JSX support for React.

### Troubleshooting

- If TS errors occur, ensure `@types/react` is installed and tsconfig jsx is "react-jsx".
- For Vite issues, check vite.config.ts if added.

For more details, see the main project README.
