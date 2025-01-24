import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { 
  Button, 
  TextField, 
  Box, 
  Typography, 
  AppBar, 
  Toolbar, 
  Alert,
  Autocomplete
} from '@mui/material';
import { AccountCircle } from '@mui/icons-material';

const socket = io('http://localhost:5000');
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
};

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [commitSha, setCommitSha] = useState('');
  const [user, setUser] = useState(null);
  const [commitSearch, setCommitSearch] = useState('');
  const [commits, setCommits] = useState([]);
  const [sessionTimer, setSessionTimer] = useState(30 * 60);

  useEffect(() => {
    // Fetch user session
    axios.get('http://localhost:5000/auth/user', { withCredentials: true })
      .then(res => {
        if (res.data.id) {
          setUser(res.data);
        } else {
          window.location.href = 'http://localhost:5000/auth/github';
        }
      })
      .catch(() => {
        window.location.href = 'http://localhost:5000/auth/github';
      });

    // Fetch tasks on initial load
    axios.get('http://localhost:5000/api/tasks', { withCredentials: true })
      .then(res => {
        console.log('Tasks fetched from backend:', res.data); // Log fetched tasks
        setTasks(res.data);
      })
      .catch(error => {
        console.error('Error fetching tasks:', error); // Log errors
      });

    // Listen for new tasks via WebSocket
    socket.on('task_update', newTask => {
      console.log('New task received via WebSocket:', newTask); // Log new task
      setTasks(prevTasks => [...prevTasks, newTask]); // Add new task to the list
    });

    // Listen for task status updates via WebSocket
    socket.on('task_status_update', updatedTask => {
      console.log('Task status update received via WebSocket:', updatedTask); // Log status update
      setTasks(prevTasks => prevTasks.map(task => 
        task.id === updatedTask.id ? { ...task, status: updatedTask.status } : task
      )); // Update the task status in the list
    });

    // Cleanup WebSocket listeners on component unmount
    return () => {
      socket.off('task_update');
      socket.off('task_status_update');
    };
  }, []);

  const handleLogin = () => window.location.href = 'http://localhost:5000/auth/github';

  const handleLogout = () => {
    axios.post('http://localhost:5000/auth/logout', {}, { withCredentials: true })
      .finally(() => {
        setUser(null);
        setTasks([]);
        setSessionTimer(30 * 60);
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post('http://localhost:5000/api/tasks', 
      { title, commit_sha: commitSha },
      { withCredentials: true }
    ).then(() => {
      setTitle('');
      setCommitSha('');
    });
  };

  const handleStatusUpdate = (taskId, newStatus) => {
    axios.patch(`http://localhost:5000/api/tasks/${taskId}/status`, 
      { status: newStatus },
      { withCredentials: true }
    ).catch(console.error);
  };

  const searchCommits = debounce(async (query) => {
    if (query.length < 3) return;
    try {
      const response = await axios.get(
        'http://localhost:5000/api/github/commits',
        { withCredentials: true }
      );
      setCommits(response.data.filter(c => 
        c.message.toLowerCase().includes(query.toLowerCase()) ||
        c.sha.startsWith(query)
      ));
    } catch (error) {
      console.error('Commit search failed:', error);
    }
  }, 500);

  const StatusButton = ({ task, status }) => (
    <Button
      variant={task.status === status ? 'contained' : 'outlined'}
      color={status === 'closed' ? 'success' : 'primary'}
      onClick={() => handleStatusUpdate(task.id, status)}
      sx={{ mx: 1 }}
    >
      {status}
    </Button>
  );

  return (
    <div>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            DevTaskFlow
          </Typography>
          {user ? (
            <Box display="flex" alignItems="center">
              <AccountCircle sx={{ mr: 1 }} />
              <Typography>{user.username}</Typography>
              <Button color="inherit" onClick={handleLogout} sx={{ ml: 2 }}>
                Logout
              </Button>
            </Box>
          ) : (
            <Button color="inherit" onClick={handleLogin}>
              Login with GitHub
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
        {sessionTimer <= 300 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Session expiring in {Math.floor(sessionTimer / 60)} minutes
          </Alert>
        )}

        {user && (
          <form onSubmit={handleSubmit}>
            <Box mb={2}>
              <TextField
                fullWidth
                label="Task Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                margin="normal"
                required
              />
              
              <Autocomplete
                freeSolo
                options={commits}
                getOptionLabel={(option) => 
                  `${option.sha.substring(0,7)} - ${option.message} (${option.repo})`
                }
                onInputChange={(_, value) => {
                  setCommitSearch(value);
                  searchCommits(value);
                }}
                onChange={(_, value) => value && setCommitSha(value.sha)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search GitHub Commits"
                    margin="normal"
                    required
                  />
                )}
              />

              <Button type="submit" variant="contained" sx={{ mt: 2 }}>
                Create Task
              </Button>
            </Box>
          </form>
        )}

        <Box>
          <Typography variant="h5" gutterBottom>Tasks</Typography>
          {tasks.length > 0 ? (
            tasks.map(task => (
              <Box key={task.id} sx={{ p: 2, mb: 2, border: 1, borderRadius: 1 }}>
                <Typography variant="h6">{task.title}</Typography>
                <Typography>Commit: {task.commit_sha}</Typography>
                <Typography>Status: {task.status}</Typography>
                <Box sx={{ mt: 1 }}>
                  <StatusButton task={task} status="open" />
                  <StatusButton task={task} status="in-progress" />
                  <StatusButton task={task} status="closed" />
                </Box>
              </Box>
            ))
          ) : (
            <Typography>No tasks found.</Typography>
          )}
        </Box>
      </Box>
    </div>
  );
}

export default App;