require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const axios = require('axios');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

// Database initialization
const db = new sqlite3.Database('./tasks.db');
db.run(`CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  commit_sha TEXT,
  user_id TEXT
)`);

// Passport configuration
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: "http://localhost:5000/auth/github/callback",
  scope: ['repo', 'user:email']
},
(accessToken, refreshToken, profile, done) => {
  profile.accessToken = accessToken;
  return done(null, profile);
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 60 * 1000, // 30 minutes
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  }
}));
app.use(passport.initialize());
app.use(passport.session());

// Session validation middleware
app.use((req, res, next) => {
  if (req.path.startsWith('/auth') || req.path === '/') return next();
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  req.session.touch();
  next();
});

// Auth routes
app.get('/auth/github', passport.authenticate('github'));

app.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/login' }),
  (req, res) => {
    console.log('User authenticated:', req.user.username); // Log authenticated user
    res.redirect(process.env.FRONTEND_URL);
  }
);

app.get('/auth/user', (req, res) => {
  console.log('Fetching user session:', req.user ? req.user.username : 'No user'); // Log user session
  req.user ? res.json(req.user) : res.status(401).json({ error: 'Unauthorized' });
});

app.post('/auth/logout', (req, res) => {
  console.log('User logging out:', req.user.username); // Log user logout
  req.logout(() => {
    req.session.destroy();
    res.clearCookie('connect.sid');
    res.status(204).end();
  });
});

// Task routes
app.get('/api/tasks', (req, res) => {
  console.log('Fetching tasks for user:', req.user.id); // Log user ID

  db.all('SELECT * FROM tasks WHERE user_id = ?', [req.user.id], (err, rows) => {
    if (err) {
      console.error('Error fetching tasks:', err); // Log errors
      return res.status(500).json({ error: 'Failed to fetch tasks' });
    }

    console.log('Tasks fetched:', rows); // Log fetched tasks
    res.json(rows);
  });
});

app.post('/api/tasks', (req, res) => {
  const { title, commit_sha } = req.body;
  console.log('Creating task:', { title, commit_sha, user_id: req.user.id }); // Log task data

  const stmt = db.prepare(`
    INSERT INTO tasks (title, commit_sha, user_id)
    VALUES (?, ?, ?)
  `);
  
  stmt.run(title, commit_sha, req.user.id, function(err) {
    if (err) {
      console.error('Error creating task:', err); // Log errors
      return res.status(500).json({ error: 'Failed to create task' });
    }

    const newTask = { 
      id: this.lastID, 
      title, 
      commit_sha, 
      status: 'open',
      user_id: req.user.id
    };
    console.log('Task created:', newTask); // Log created task
    io.emit('task_update', newTask); // Emit WebSocket event
    res.status(201).json(newTask);
  });
});

app.patch('/api/tasks/:id/status', (req, res) => {
  const { status } = req.body;
  console.log('Updating task status:', { taskId: req.params.id, status, user_id: req.user.id }); // Log status update

  const validStatuses = ['open', 'in-progress', 'closed'];
  
  if (!validStatuses.includes(status)) {
    console.error('Invalid status:', status); // Log invalid status
    return res.status(400).json({ error: 'Invalid status' });
  }

  db.run(
    'UPDATE tasks SET status = ? WHERE id = ? AND user_id = ?',
    [status, req.params.id, req.user.id],
    function(err) {
      if (err) {
        console.error('Error updating task status:', err); // Log errors
        return res.status(500).json({ error: 'Failed to update task status' });
      }

      const updatedTask = { 
        id: req.params.id, 
        status,
        title: req.body.title, 
        commit_sha: req.body.commit_sha 
      };
      console.log('Task status updated:', updatedTask); // Log updated task
      io.emit('task_status_update', updatedTask); // Emit WebSocket event
      res.json(updatedTask);
    }
  );
});

// GitHub API routes
app.get('/api/github/commits', async (req, res) => {
  console.log('Fetching GitHub commits for user:', req.user.username); // Log user

  try {
    const response = await axios.get('https://api.github.com/user/repos', {
      headers: {
        Authorization: `token ${req.user.accessToken}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });

    const commits = await Promise.all(
      response.data.map(async repo => {
        const commitsRes = await axios.get(
          `https://api.github.com/repos/${repo.full_name}/commits`,
          { headers: { Authorization: `token ${req.user.accessToken}` } }
        );
        return commitsRes.data.map(commit => ({
          sha: commit.sha,
          message: commit.commit.message,
          repo: repo.name,
          date: commit.commit.author.date
        }));
      })
    );

    console.log('GitHub commits fetched:', commits.flat().length); // Log number of commits
    res.json(commits.flat());
  } catch (error) {
    console.error('Error fetching GitHub commits:', error); // Log errors
    res.status(500).json({ error: 'Failed to fetch commits' });
  }
});

// WebSocket setup
io.on('connection', (socket) => {
  console.log('Client connected via WebSocket'); // Log WebSocket connection

  socket.on('disconnect', () => {
    console.log('Client disconnected'); // Log WebSocket disconnection
  });
});
// Extention
app.post('/api/workspace', (req, res) => {
  const { task_id, open_files } = req.body;
  const workspaceDir = path.join(__dirname, 'workspaces');
  if (!fs.existsSync(workspaceDir)) {
    fs.mkdirSync(workspaceDir, { recursive: true });
  }

  const workspacePath = path.join(workspaceDir, `workspace_${task_id}.json`);
  fs.writeFileSync(workspacePath, JSON.stringify({ open_files }));

  res.status(201).json({ message: 'Workspace saved' });
});

app.get('/api/workspace/:taskId', (req, res) => {
  const workspacePath = path.join(__dirname, 'workspaces', `workspace_${req.params.taskId}.json`);
  if (!fs.existsSync(workspacePath)) {
    return res.status(404).json({ error: 'Workspace not found' });
  }

  const workspaceState = JSON.parse(fs.readFileSync(workspacePath, 'utf-8'));
  res.json(workspaceState);
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});