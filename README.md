# Drinking Nights Tracker

A web application for tracking and managing drinking nights and party sessions with friends, featuring both anonymous and authenticated user modes.

## Features

- **User Authentication**: Register and login with username and password
- **Admin Dashboard**: Admin users can view all users and party sessions
- **User Management**: Admins can edit usernames, change passwords, and delete users
- **Party Session Management**: Create, view, and delete drinking sessions
- **Anonymous Mode**: Use the app without creating an account
- **Dark Mode**: Toggle between light and dark themes
- **Responsive Design**: Works on desktop and mobile devices
- **Party Points System**: Earn points during sessions and unlock party achievements
- **Drink & Food Tracking**: Log what you drink and eat during party sessions
- **Party Games**: Interactive elements for group activities
- **Session Intensity Levels**: Choose from Chill, Party, or Wild intensity modes

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express
- **Database**: SQLite (local database file)
- **Authentication**: bcrypt for password hashing, express-session for session management

## Setup Instructions

1. **Clone the repository**:
   ```
   git clone <repository-url>
   cd drinking-nights-tracker
   ```

2. **Install dependencies**:
   ```
   npm install
   ```

3. **Start the server**:
   ```
   npm start
   ```
   
   For development with auto-restart:
   ```
   npm run dev
   ```

4. **Access the application**:
   Open your browser and navigate to `http://localhost:3000`

## Default Admin Account

The application automatically creates an admin account on first run:

- **Username**: admin
- **Password**: admin123

You should change this password after the first login for security.

## User Modes

### Authenticated Users
- Create an account to store data in the database
- Data persists between browser sessions
- Admin users have access to all data

### Anonymous Users
- Use the app without creating an account
- Data is stored in the browser's localStorage
- Data will be lost when clearing browser data

## Admin Features

Administrators have access to:
- View all users in the system
- Edit usernames for any user
- Reset passwords for any user
- Delete users (which also removes all their sessions)
- View all party sessions from all users
- Grant Party Points to users
- View system statistics

## Party Session Features

### Session Types
- **Chill**: Relaxed drinking session with friends
- **Party**: Moderate intensity party with games and activities
- **Wild**: High intensity party with challenging activities

### Tracking Features
- Drink consumption logging (type and amount)
- Food consumption tracking
- Party Points earning system
- Session duration and location tracking
- Friend group management
- Party games and challenges

## File Structure

- `/css` - Stylesheets
- `/js` - JavaScript files
- `/pages` - HTML pages (login, dashboard, admin, party session)
- `server.js` - Express server and API endpoints
- `database.sqlite` - SQLite database file (created on first run)

## API Endpoints

### Authentication
- `POST /api/register` - Register a new user
- `POST /api/login` - Login a user
- `POST /api/logout` - Logout current user
- `GET /api/auth/status` - Check authentication status

### Sessions
- `GET /api/sessions` - Get current user's sessions
- `POST /api/sessions` - Create a new session
- `DELETE /api/sessions/:id` - Delete a session
- `GET /api/sessions/:id` - Get session details
- `POST /api/sessions/:id/actions/drink` - Log a drink
- `POST /api/sessions/:id/actions/food` - Log food consumption
- `POST /api/sessions/:id/purchase` - Make a purchase in party shop

### Admin Only
- `GET /api/admin/users` - Get all users
- `GET /api/admin/sessions` - Get all sessions
- `PUT /api/admin/users/:id/username` - Update a user's username
- `PUT /api/admin/users/:id/password` - Update a user's password
- `DELETE /api/admin/users/:id` - Delete a user and all their sessions

## Party Points System

Users earn Party Points during sessions based on:
- Session intensity level
- Duration of party
- Participation in games and challenges
- Drink and food consumption tracking

Points can be spent in the Party Shop for virtual items and achievements.

## Safety Notice

This application is designed for tracking social drinking experiences responsibly. Please:
- Drink responsibly and know your limits
- Never drink and drive
- Be aware of local laws regarding alcohol consumption
- Consider the safety of yourself and others

## License

This project is licensed under the ISC License. 