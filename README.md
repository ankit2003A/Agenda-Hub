# Agenda Hub

A modern meeting and calendar management application built with React and Node.js.

## Features

- Create and manage meetings
- Schedule meetings with start and end times
- Add participants to meetings
- View upcoming meetings in a clean interface
- Real-time updates using MongoDB

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Setup

1. Install dependencies:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

2. Start MongoDB if not already running

3. Start the backend server:
```bash
cd backend
npm run dev
```

4. Start the frontend development server:
```bash
cd frontend
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

## Project Structure

```
agenda-hub/
├── backend/           # Node.js Express backend
│   ├── src/          # Source code
│   │   ├── models/   # MongoDB models
│   │   └── routes/   # API routes
│   ├── package.json
│   └── tsconfig.json
├── frontend/         # React frontend
│   ├── src/         # Source code
│   │   └── components/  # React components
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

## Technologies Used

- Frontend: React, TypeScript, Vite, Tailwind CSS
- Backend: Node.js, Express, TypeScript
- Database: MongoDB
- API: RESTful

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.