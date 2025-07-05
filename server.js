const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const session = require('express-session');

// Initialize express app
const app = express();
const HOST = process.env.HOST || 'localhost';
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '/')));
app.use(session({
  secret: 'drinking-nights-tracker-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 3600000 } // 1 hour
}));

// Initialize database
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    initializeDatabase();
  }
});

// Initialize database tables
function initializeDatabase() {
  db.serialize(() => {
    // Create users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      is_admin INTEGER DEFAULT 0
    )`);
    
    // Create sessions table
    db.run(`CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      type TEXT NOT NULL,
      date TEXT NOT NULL,
      location TEXT,
      duration INTEGER DEFAULT 0,
      desperation_level INTEGER DEFAULT 5,
      difficulty TEXT DEFAULT 'easy',
      rating INTEGER DEFAULT 0,
      notes TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`);
    
    // Add difficulty column to existing sessions table if it doesn't exist
    db.run(`ALTER TABLE sessions ADD COLUMN difficulty TEXT DEFAULT 'easy'`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding difficulty column:', err.message);
      }
    });
    
    // Add currency column to existing sessions table if it doesn't exist
    db.run(`ALTER TABLE sessions ADD COLUMN party_points INTEGER DEFAULT 500`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding party_points column:', err.message);
      }
    });
    
    // Add purchases column to existing sessions table if it doesn't exist
    db.run(`ALTER TABLE sessions ADD COLUMN purchases TEXT DEFAULT '[]'`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding purchases column:', err.message);
      }
    });
    
    // Add drinks tracking column to existing sessions table if it doesn't exist
    db.run(`ALTER TABLE sessions ADD COLUMN drinks TEXT DEFAULT '[]'`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding drinks column:', err.message);
      }
    });
    
    // Add food tracking column to existing sessions table if it doesn't exist
    db.run(`ALTER TABLE sessions ADD COLUMN food TEXT DEFAULT '[]'`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding food column:', err.message);
      }
    });
    
    // Migrate existing omo_points to party_points
    db.run(`UPDATE sessions SET party_points = omo_points WHERE party_points IS NULL AND omo_points IS NOT NULL`, (err) => {
      if (err) {
        console.error('Error migrating omo_points to party_points:', err.message);
      }
    });
    
    // Check if admin user exists
    db.get("SELECT * FROM users WHERE is_admin = 1", [], (err, row) => {
      if (err) {
        console.error('Error checking admin:', err.message);
      } else if (!row) {
        // Create default admin user if none exists
        bcrypt.hash('admin123', 10, (err, hash) => {
          if (err) {
            console.error('Error hashing password:', err.message);
          } else {
            db.run("INSERT INTO users (username, password, is_admin) VALUES (?, ?, 1)", 
              ['admin', hash], function(err) {
              if (err) {
                console.error('Error creating admin user:', err.message);
              } else {
                console.log('Admin user created successfully.');
              }
            });
          }
        });
      }
    });
  });
}

// Authentication middleware
function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    return next();
  }
  res.status(401).json({ success: false, message: 'Not authenticated' });
}

function isAdmin(req, res, next) {
  if (req.session.isAdmin) {
    return next();
  }
  res.status(403).json({ success: false, message: 'Not authorized' });
}

// Routes
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required' });
  }
  
  // Check if username already exists
  db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    if (row) {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }
    
    // Hash password
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error hashing password' });
      }
      
      // Insert new user
      db.run("INSERT INTO users (username, password) VALUES (?, ?)", 
        [username, hash], function(err) {
        if (err) {
          return res.status(500).json({ success: false, message: 'Error creating user' });
        }
        
        // Set session
        req.session.userId = this.lastID;
        req.session.username = username;
        req.session.isAdmin = false;
        
        res.json({ success: true, message: 'User registered successfully', userId: this.lastID, username });
      });
    });
  });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required' });
  }
  
  // Find user
  db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }
    
    // Compare password
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error comparing passwords' });
      }
      
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid username or password' });
      }
      
      // Set session
      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.isAdmin = user.is_admin === 1;
      
      res.json({ 
        success: true, 
        message: 'Login successful', 
        userId: user.id, 
        username: user.username,
        isAdmin: user.is_admin === 1
      });
    });
  });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Error logging out' });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// Session routes
app.get('/api/sessions', isAuthenticated, (req, res) => {
  db.all("SELECT * FROM sessions WHERE user_id = ? ORDER BY date DESC", [req.session.userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    res.json({ success: true, sessions: rows });
  });
});

app.post('/api/sessions', isAuthenticated, (req, res) => {
      const { type, date, location, duration, partyIntensity, difficulty, rating, notes } = req.body;
  
  if (!type || !date) {
    return res.status(400).json({ success: false, message: 'Type and date are required' });
  }
  
  db.run(`INSERT INTO sessions 
    (user_id, type, date, location, duration, desperation_level, difficulty, rating, notes, party_points, purchases, drinks, food) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
            [req.session.userId, type, date, location || '', duration || 0, partyIntensity || 5, difficulty || 'easy', rating || 0, notes || '', 500, '[]', '[]', '[]'], 
    function(err) {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error creating session' });
      }
      
      res.json({ success: true, message: 'Session created successfully', sessionId: this.lastID });
    }
  );
});

app.get('/api/sessions/:id', isAuthenticated, (req, res) => {
  const sessionId = req.params.id;
  
  // Verify ownership and get session data
  db.get("SELECT * FROM sessions WHERE id = ? AND user_id = ?", [sessionId, req.session.userId], (err, row) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    if (!row) {
      return res.status(404).json({ success: false, message: 'Session not found or not authorized' });
    }
    
    // Parse purchases JSON
    try {
      row.purchases = JSON.parse(row.purchases || '[]');
    } catch (e) {
      row.purchases = [];
    }
    
    res.json({ success: true, session: row });
  });
});

app.delete('/api/sessions/:id', isAuthenticated, (req, res) => {
  const sessionId = req.params.id;
  
  // Verify ownership
  db.get("SELECT * FROM sessions WHERE id = ? AND user_id = ?", [sessionId, req.session.userId], (err, row) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    if (!row) {
      return res.status(404).json({ success: false, message: 'Session not found or not authorized' });
    }
    
    // Delete session
    db.run("DELETE FROM sessions WHERE id = ?", [sessionId], function(err) {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error deleting session' });
      }
      
      res.json({ success: true, message: 'Session deleted successfully' });
    });
  });
});

// Session currency and purchase routes
app.post('/api/sessions/:id/purchase', isAuthenticated, (req, res) => {
  const sessionId = req.params.id;
  const { itemId, itemName, price } = req.body;
  
  if (!itemId || !itemName || !price) {
    return res.status(400).json({ success: false, message: 'Item ID, name, and price are required' });
  }
  
  // Verify ownership and get current session data
  db.get("SELECT * FROM sessions WHERE id = ? AND user_id = ?", [sessionId, req.session.userId], (err, session) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found or not authorized' });
    }
    
    // Check if user has enough currency
    const currentPoints = session.party_points || 0;
    if (currentPoints < price) {
      return res.status(400).json({ success: false, message: 'Not enough Party Points' });
    }
    
    // Parse current purchases
    let purchases = [];
    try {
      purchases = JSON.parse(session.purchases || '[]');
    } catch (e) {
      purchases = [];
    }
    
    // Add new purchase
    const purchase = {
      id: itemId,
      name: itemName,
      price: price,
      timestamp: new Date().toISOString()
    };
    purchases.push(purchase);
    
    // Update database
    const newPoints = currentPoints - price;
    db.run("UPDATE sessions SET party_points = ?, purchases = ? WHERE id = ?", 
      [newPoints, JSON.stringify(purchases), sessionId], function(err) {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error processing purchase' });
      }
      
      res.json({ 
        success: true, 
        message: 'Purchase successful',
        newBalance: newPoints,
        purchase: purchase
      });
    });
  });
});

app.get('/api/sessions/:id/currency', isAuthenticated, (req, res) => {
  const sessionId = req.params.id;
  
  // Verify ownership and get currency
  db.get("SELECT party_points FROM sessions WHERE id = ? AND user_id = ?", [sessionId, req.session.userId], (err, row) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    if (!row) {
      return res.status(404).json({ success: false, message: 'Session not found or not authorized' });
    }
    
    res.json({ success: true, partyPoints: row.party_points || 0 });
  });
});

// Session actions tracking routes
app.post('/api/sessions/:id/actions/drink', isAuthenticated, (req, res) => {
  const sessionId = req.params.id;
  const { amount, type } = req.body;
  
  if (!amount || !type) {
    return res.status(400).json({ success: false, message: 'Amount and type are required' });
  }
  
  // Verify ownership and get current session data
  db.get("SELECT drinks FROM sessions WHERE id = ? AND user_id = ?", [sessionId, req.session.userId], (err, session) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found or not authorized' });
    }
    
    // Parse current drinks
    let drinks = [];
    try {
      drinks = JSON.parse(session.drinks || '[]');
    } catch (e) {
      drinks = [];
    }
    
    // Add new drink
    const drink = {
      amount: parseInt(amount),
      type: type,
      timestamp: new Date().toISOString()
    };
    drinks.push(drink);
    
    // Update database
    db.run("UPDATE sessions SET drinks = ? WHERE id = ?", 
      [JSON.stringify(drinks), sessionId], function(err) {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error saving drink' });
      }
      
      res.json({ 
        success: true, 
        message: 'Drink added successfully',
        drink: drink
      });
    });
  });
});

app.post('/api/sessions/:id/actions/food', isAuthenticated, (req, res) => {
  const sessionId = req.params.id;
  const { item, portions } = req.body;
  
  if (!item || !portions) {
    return res.status(400).json({ success: false, message: 'Item and portions are required' });
  }
  
  // Verify ownership and get current session data
  db.get("SELECT food FROM sessions WHERE id = ? AND user_id = ?", [sessionId, req.session.userId], (err, session) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found or not authorized' });
    }
    
    // Parse current food
    let food = [];
    try {
      food = JSON.parse(session.food || '[]');
    } catch (e) {
      food = [];
    }
    
    // Add new food item
    const foodItem = {
      item: item.trim(),
      portions: parseFloat(portions),
      timestamp: new Date().toISOString()
    };
    food.push(foodItem);
    
    // Update database
    db.run("UPDATE sessions SET food = ? WHERE id = ?", 
      [JSON.stringify(food), sessionId], function(err) {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error saving food' });
      }
      
      res.json({ 
        success: true, 
        message: 'Food added successfully',
        food: foodItem
      });
    });
  });
});

app.get('/api/sessions/:id/actions', isAuthenticated, (req, res) => {
  const sessionId = req.params.id;
  
  // Verify ownership and get actions data
  db.get("SELECT drinks, food FROM sessions WHERE id = ? AND user_id = ?", [sessionId, req.session.userId], (err, session) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found or not authorized' });
    }
    
    let drinks = [];
    let food = [];
    
    try {
      drinks = JSON.parse(session.drinks || '[]');
      food = JSON.parse(session.food || '[]');
    } catch (e) {
      console.error('Error parsing actions data:', e);
    }
    
    res.json({ 
      success: true, 
      actions: {
        drinks: drinks,
        food: food
      }
    });
  });
});

// User account management routes
app.post('/api/user/change-password', isAuthenticated, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Current password and new password are required' });
  }
  
  // Get user's current password hash
  db.get("SELECT password FROM users WHERE id = ?", [req.session.userId], (err, user) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Verify current password
    bcrypt.compare(currentPassword, user.password, (err, match) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error verifying password' });
      }
      
      if (!match) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      }
      
      // Hash new password
      bcrypt.hash(newPassword, 10, (err, hash) => {
        if (err) {
          return res.status(500).json({ success: false, message: 'Error hashing new password' });
        }
        
        // Update password in database
        db.run("UPDATE users SET password = ? WHERE id = ?", [hash, req.session.userId], function(err) {
          if (err) {
            return res.status(500).json({ success: false, message: 'Error updating password' });
          }
          
          res.json({ success: true, message: 'Password changed successfully' });
        });
      });
    });
  });
});

app.post('/api/user/delete-account', isAuthenticated, (req, res) => {
  const { currentPassword } = req.body;
  
  if (!currentPassword) {
    return res.status(400).json({ success: false, message: 'Current password is required to delete account' });
  }
  
  // Get user's password hash to verify
  db.get("SELECT password FROM users WHERE id = ?", [req.session.userId], (err, user) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Verify password
    bcrypt.compare(currentPassword, user.password, (err, match) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error verifying password' });
      }
      
      if (!match) {
        return res.status(400).json({ success: false, message: 'Password is incorrect' });
      }
      
      // Delete user's sessions first
      db.run("DELETE FROM sessions WHERE user_id = ?", [req.session.userId], function(err) {
        if (err) {
          return res.status(500).json({ success: false, message: 'Error deleting user sessions' });
        }
        
        // Then delete the user
        db.run("DELETE FROM users WHERE id = ?", [req.session.userId], function(err) {
          if (err) {
            return res.status(500).json({ success: false, message: 'Error deleting account' });
          }
          
          // Destroy session
          req.session.destroy((err) => {
            if (err) {
              console.error('Error destroying session:', err);
            }
          });
          
          res.json({ success: true, message: 'Account deleted successfully' });
        });
      });
    });
  });
});

// Currency update endpoint
app.post('/api/sessions/:sessionId/currency', (req, res) => {
    const { sessionId } = req.params;
    const { currency } = req.body;
    
    // Get session from database
    db.get("SELECT * FROM sessions WHERE id = ?", [sessionId], (err, session) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        
        // Update currency in database
        db.run("UPDATE sessions SET party_points = ? WHERE id = ?", [currency, sessionId], function(err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            res.json({ success: true });
    });
  });
});

// Admin routes
app.get('/api/admin/users', isAuthenticated, isAdmin, (req, res) => {
  db.all("SELECT id, username, is_admin FROM users", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    res.json({ success: true, users: rows });
  });
});

// Add new admin endpoints for user management
app.put('/api/admin/users/:id/username', isAuthenticated, isAdmin, (req, res) => {
  const userId = req.params.id;
  const { username } = req.body;
  
  if (!username) {
    return res.status(400).json({ success: false, message: 'Username is required' });
  }
  
  // Check if username already exists
  db.get("SELECT * FROM users WHERE username = ? AND id != ?", [username, userId], (err, row) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    if (row) {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }
    
    // Update username
    db.run("UPDATE users SET username = ? WHERE id = ?", [username, userId], function(err) {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error updating username' });
      }
      
      res.json({ success: true, message: 'Username updated successfully' });
    });
  });
});

app.put('/api/admin/users/:id/password', isAuthenticated, isAdmin, (req, res) => {
  const userId = req.params.id;
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({ success: false, message: 'Password is required' });
  }
  
  // Hash the new password
  bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Error hashing password' });
    }
    
    // Update password
    db.run("UPDATE users SET password = ? WHERE id = ?", [hash, userId], function(err) {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error updating password' });
      }
      
      res.json({ success: true, message: 'Password updated successfully' });
    });
  });
});

app.delete('/api/admin/users/:id', isAuthenticated, isAdmin, (req, res) => {
  const userId = req.params.id;
  
  // Don't allow admins to delete themselves
  if (userId == req.session.userId) {
    return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
  }
  
  // Check if user exists
  db.get("SELECT * FROM users WHERE id = ?", [userId], (err, user) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Delete user's sessions first
    db.run("DELETE FROM sessions WHERE user_id = ?", [userId], function(err) {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error deleting user sessions' });
      }
      
      // Then delete the user
      db.run("DELETE FROM users WHERE id = ?", [userId], function(err) {
        if (err) {
          return res.status(500).json({ success: false, message: 'Error deleting user' });
        }
        
        res.json({ success: true, message: 'User deleted successfully' });
      });
    });
  });
});

app.get('/api/admin/sessions', isAuthenticated, isAdmin, (req, res) => {
  db.all(`SELECT s.*, u.username 
    FROM sessions s 
    JOIN users u ON s.user_id = u.id 
    ORDER BY s.date DESC`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    res.json({ success: true, sessions: rows });
  });
});

// Admin currency management endpoint
app.post('/api/admin/users/:id/currency', isAuthenticated, isAdmin, (req, res) => {
  const userId = req.params.id;
  const { amount, reason } = req.body;
  
  if (!amount || isNaN(amount)) {
    return res.status(400).json({ success: false, message: 'Valid amount is required' });
  }
  
  const currencyAmount = parseInt(amount);
  
  // Check if user exists
  db.get("SELECT * FROM users WHERE id = ?", [userId], (err, user) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Get user's most recent session to add currency to
    db.get("SELECT * FROM sessions WHERE user_id = ? ORDER BY date DESC LIMIT 1", [userId], (err, session) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Database error' });
      }
      
      if (!session) {
        // Create a new session for the user to hold the currency
        const sessionData = {
          user_id: userId,
          type: 'Admin Currency Grant',
          date: new Date().toISOString(),
          location: '',
          duration: 0,
          party_intensity: 5,
          difficulty: 'easy',
          rating: 0,
          notes: reason || 'Currency granted by admin',
          party_points: currencyAmount
        };
        
        db.run(`INSERT INTO sessions (user_id, type, date, location, duration, desperation_level, difficulty, rating, notes, party_points)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
          [sessionData.user_id, sessionData.type, sessionData.date, sessionData.location, sessionData.duration, 
           sessionData.party_intensity, sessionData.difficulty, sessionData.rating, sessionData.notes, sessionData.party_points], 
          function(err) {
            if (err) {
              return res.status(500).json({ success: false, message: 'Error creating session for currency' });
            }
            
            res.json({ 
              success: true, 
              message: `Successfully granted ${currencyAmount} Party Points to ${user.username}`,
              newBalance: currencyAmount
            });
          });
      } else {
        // Add currency to existing session
        const currentPoints = session.party_points || 0;
        const newBalance = currentPoints + currencyAmount;
        
        db.run("UPDATE sessions SET party_points = ? WHERE id = ?", [newBalance, session.id], function(err) {
          if (err) {
            return res.status(500).json({ success: false, message: 'Error updating currency' });
          }
          
          res.json({ 
            success: true, 
            message: `Successfully granted ${currencyAmount} Party Points to ${user.username}`,
            newBalance: newBalance
          });
        });
      }
    });
  });
});

// Check authentication status
app.get('/api/auth/status', (req, res) => {
  if (req.session.userId) {
    res.json({ 
      authenticated: true, 
      userId: req.session.userId,
      username: req.session.username,
      isAdmin: req.session.isAdmin
    });
  } else {
    res.json({ authenticated: false });
  }
});

// Serve pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages/dashboard.html'));
});

app.get('/admin', isAuthenticated, isAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'pages/admin.html'));
});

// Start server
app.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
}); 