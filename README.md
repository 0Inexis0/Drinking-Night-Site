# Drinking Nights Tracker

A secure web application for tracking and managing drinking nights and party sessions with friends. All users must register and login to use the application.

## Features

- **User Authentication**: Required registration and login with username and password
- **Session Management**: Create, view, and delete drinking sessions with custom names
- **User Dashboard**: View recent sessions, statistics, and manage account
- **Admin Dashboard**: Admin users can view all users and sessions, manage accounts
- **User Management**: Admins can edit usernames, reset passwords, and delete user accounts
- **Party Points System**: Earn points during sessions (500 points awarded per session)
- **Dark Mode**: Toggle between light and dark themes
- **Responsive Design**: Works on desktop and mobile devices
- **Secure Data Storage**: All data stored securely in database with encrypted passwords

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

**Important**: Change this password after the first login for security.

## User Types

### Regular Users
- Must create an account to access any features
- Can create and manage their own drinking sessions
- Data is securely stored in the database
- Can view their own statistics and session history

### Admin Users
- All regular user capabilities
- Access to admin dashboard with system-wide overview
- Can manage all user accounts
- Can view all sessions from all users
- Can grant Party Points to users

## Application Pages

### Main Pages
- **Homepage**: Welcome page with login/register options
- **Login/Register**: Authentication forms
- **Dashboard**: Main user interface for session management
- **Settings**: Account management and password changes
- **Play Session**: Simple session overview page

### Admin Only
- **Admin Dashboard**: Complete system management interface

## Admin Features

Administrators have access to:
- View and manage all user accounts
- Edit usernames for any user
- Reset passwords for any user
- Delete users (removes all their sessions)
- View all drinking sessions from all users
- Grant Party Points to users
- View system statistics (total users, sessions, weekly activity)

## Session Management

### Creating Sessions
- Simple session creation with custom names
- Default session name is "Untitled Session" if none provided
- Sessions are immediately saved to the database

### Session Features
- View session details (date, time, location, duration, notes)
- Play sessions with dedicated overview page
- Delete sessions with confirmation
- Automatic Party Points awarded (500 points per session)

## File Structure

```
drinking-nights-tracker/
├── css/                 # Stylesheets
│   ├── styles.css      # Global styles and themes
│   ├── login.css       # Login/register page styles
│   ├── dashboard.css   # Dashboard and main interface
│   └── admin.css       # Admin panel styles
├── js/                 # JavaScript files
│   ├── app.js          # Homepage functionality
│   ├── login.js        # Authentication handling
│   ├── dashboard.js    # Main dashboard logic
│   ├── settings.js     # Account settings
│   ├── play-session.js # Session overview
│   └── admin.js        # Admin panel functionality
├── pages/              # HTML pages
│   ├── login.html      # Login and registration
│   ├── dashboard.html  # Main user dashboard
│   ├── settings.html   # Account settings
│   ├── play-session.html # Session overview
│   └── admin.html      # Admin dashboard
├── index.html          # Homepage
├── server.js           # Express server and API
├── package.json        # Dependencies and scripts
└── database.sqlite     # SQLite database (auto-created)
```

## API Endpoints

### Authentication (Required for all operations)
- `POST /api/register` - Register a new user account
- `POST /api/login` - Login with username and password
- `POST /api/logout` - Logout current user
- `GET /api/auth/status` - Check current authentication status

### User Sessions
- `GET /api/sessions` - Get current user's drinking sessions
- `POST /api/sessions` - Create a new drinking session
- `DELETE /api/sessions/:id` - Delete a specific session
- `GET /api/sessions/:id` - Get details for a specific session

### User Account Management
- `POST /api/user/change-password` - Change current user's password
- `POST /api/user/delete-account` - Delete current user's account

### Admin Only Endpoints
- `GET /api/admin/users` - Get all users in the system
- `GET /api/admin/sessions` - Get all sessions from all users
- `PUT /api/admin/users/:id/username` - Update any user's username
- `PUT /api/admin/users/:id/password` - Reset any user's password
- `DELETE /api/admin/users/:id` - Delete user and all their sessions
- `POST /api/admin/users/:id/currency` - Grant Party Points to a user

## Party Points System

- **Automatic Rewards**: 500 Party Points awarded for each session created
- **Admin Grants**: Administrators can manually grant additional points to users
- **Future Use**: Points system ready for future features and rewards

## Security Features

- **Password Encryption**: All passwords are encrypted using bcrypt
- **Session Management**: Secure server-side session handling
- **Authentication Required**: All pages and features require login
- **Admin Protection**: Admin-only areas properly secured
- **Data Validation**: Input validation on all forms and API endpoints

## Database Schema

The SQLite database includes:
- **Users table**: User accounts with encrypted passwords and admin flags
- **Sessions table**: Drinking session records with user association
- **Automatic migrations**: Database updates handled automatically

## Development

### Running in Development Mode
```bash
npm run dev
```

This starts the server with nodemon for automatic restarts on code changes.

### Environment
- Node.js version 14 or higher recommended
- No external database setup required (SQLite is embedded)
- All dependencies managed through npm

## Safety and Responsible Use

This application is designed for tracking social drinking experiences responsibly. Please:

- **Drink Responsibly**: Know your limits and drink in moderation
- **Never Drink and Drive**: Always have a designated driver or use alternative transportation
- **Legal Compliance**: Be aware of and follow local laws regarding alcohol consumption
- **Safety First**: Prioritize the safety and wellbeing of yourself and others
- **Adult Use Only**: This application is intended for users of legal drinking age

## License

This project is licensed under the ISC License. 