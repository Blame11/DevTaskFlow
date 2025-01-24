# **DevTaskFlow**

**DevTaskFlow** is an integrated task management system designed to streamline software development workflows. It provides features like task tracking, GitHub commit integration, real-time collaboration, workspace state management, and a **VS Code extension** for seamless integration with your development environment.

---

## **Features**
- **Task Management:** Create, update, and track tasks with statuses (open, in-progress, closed).
- **GitHub Integration:** Link tasks to GitHub commits and search for commits directly in the app.
- **Real-Time Collaboration:** Sync task updates across team members in real-time using WebSocket.
- **Workspace State Management:** Save and restore IDE workspace states (open files, debugger breakpoints).
- **VS Code Extension:** Save and restore workspace states directly from VS Code.
- **Authentication:** Secure login via GitHub OAuth.

---

## **Technologies Used**
- **Frontend:** React.js, Material-UI, Socket.IO Client
- **Backend:** Node.js, Express.js, SQLite, Socket.IO
- **VS Code Extension:** TypeScript, VS Code API
- **Authentication:** GitHub OAuth
- **Database:** SQLite (for tasks), GitHub API (for commits)

---

## **Setup Instructions**

### **1. Prerequisites**
- Node.js (v16 or higher)
- npm (v8 or higher)
- GitHub OAuth App (for authentication)
- VS Code (for the extension)

---

### **2. Backend Setup**

#### **Clone the Repository**
```bash
git clone https://github.com/your-username/devtaskflow.git
cd devtaskflow/backend
```

#### **Install Dependencies**
```bash
npm install
```

#### **Set Up Environment Variables**
Create a `.env` file in the `backend` directory with the following variables:
```env
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
SESSION_SECRET=your_random_session_secret
FRONTEND_URL=http://localhost:3000
```

#### **Run the Backend**
```bash
node server.js
```
The backend will run on `http://localhost:5000`.

---

### **3. Frontend Setup**

#### **Navigate to the Frontend Directory**
```bash
cd ../frontend
```

#### **Install Dependencies**
```bash
npm install
```

#### **Run the Frontend**
```bash
npm start
```
The frontend will run on `http://localhost:3000`.

---

### **4. VS Code Extension Setup**

#### **Navigate to the Extension Directory**
```bash
cd ../devtaskflow-vscode-extension
```

#### **Install Dependencies**
```bash
npm install
```

#### **Run the Extension**
1. Open the extension project in VS Code.
2. Press `F5` to launch the extension in debug mode.
3. Use the following commands in the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`):
   - **Save Workspace:** Save the current workspace state for a task.
   - **Restore Workspace:** Restore a previously saved workspace state.

---

### **5. GitHub OAuth Setup**
1. Go to your [GitHub Developer Settings](https://github.com/settings/developers).
2. Create a new OAuth App:
   - **Application Name:** DevTaskFlow
   - **Homepage URL:** `http://localhost:3000`
   - **Authorization Callback URL:** `http://localhost:5000/auth/github/callback`
3. Copy the **Client ID** and **Client Secret** and add them to the `.env` file.

---

## **Usage**

### **1. Log In**
- Click the "Login with GitHub" button to authenticate using your GitHub account.

### **2. Create a Task**
- Enter a task title and link it to a GitHub commit (optional).
- Click "Create Task" to add the task to the list.

### **3. Update Task Status**
- Use the buttons (open, in-progress, closed) to update the status of a task.

### **4. Search GitHub Commits**
- Use the search bar to find and link GitHub commits to tasks.

### **5. Real-Time Updates**
- Task updates are synced across all connected clients in real-time.

### **6. VS Code Extension**
- **Save Workspace:** Save the current workspace state (open files) for a task.
- **Restore Workspace:** Restore a previously saved workspace state.

---

## **Future Improvements**
While DevTaskFlow validates core concepts, the following improvements will bridge gaps between the prototype and the original design goals:

### **GitHub API Automation**
- **Current:** Manual SHA input with regex validation.
- **Goal:** Auto-link tasks to commits via GitHub API, enabling searchable commit lists and pull request integration.

### **Enhanced Security**
- **Current:** Basic GitHub OAuth with no encryption.
- **Goal:** Implement AES-256 encryption for workspace states and JWT-based RBAC (Admin/Developer roles).

### **Full Debugger State Capture**
- **Current:** Saves open files only.
- **Goal:** Serialize debugger variables, breakpoints, and terminal sessions for full context restoration.

### **Scalability Improvements**
- **Current:** SQLite and JSON files for single-user use.
- **Goal:** Migrate to PostgreSQL (tasks) and Amazon S3 (workspace states) for multi-team scalability.

### **Multi-IDE Support**
- **Current:** VS Code-only integration.
- **Goal:** Extend to JetBrains IDEs (IntelliJ/PyCharm) via REST APIs and IDE-specific plugins.

### **AI-Driven Automation**
- **Current:** No AI/ML components.
- **Goal:** Predict task deadlines using commit history and prioritize tasks via GPT-4 integration.

### **Enterprise Readiness**
- **Current:** Minimal collaboration features.
- **Goal:** Add SSO (SAML), audit logs, and compliance reporting for enterprise adoption.

---

## **Project Structure**

### **Backend**
```
backend/
├── server.js            # Main backend server file
├── tasks.db             # SQLite database for tasks
├── workspaces/          # Directory for saved workspace states
├── .env                 # Environment variables
├── package.json         # Backend dependencies
└── README.md            # Backend documentation
```

### **Frontend**
```
frontend/
├── public/              # Static assets
├── src/
│   ├── App.js           # Main React component
│   ├── index.js         # Entry point
│   └── styles/          # CSS files
├── package.json         # Frontend dependencies
└── README.md            # Frontend documentation
```

### **VS Code Extension**
```
devtaskflow-vscode-extension/
├── src/
│   ├── extension.ts     # Main extension logic
├── package.json         # Extension dependencies
└── README.md            # Extension documentation
```

---

## **API Endpoints**

### **Auth**
- `GET /auth/github` - Initiate GitHub OAuth login.
- `GET /auth/github/callback` - GitHub OAuth callback.
- `GET /auth/user` - Get current user session.
- `POST /auth/logout` - Log out the user.

### **Tasks**
- `GET /api/tasks` - Fetch all tasks for the current user.
- `POST /api/tasks` - Create a new task.
- `PATCH /api/tasks/:id/status` - Update a task's status.

### **Workspace**
- `POST /api/workspace` - Save a workspace state.
- `GET /api/workspace/:taskId` - Fetch a workspace state.

### **GitHub**
- `GET /api/github/commits` - Fetch GitHub commits for the authenticated user.

---

## **Contributing**
Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature`).
3. Commit your changes (`git commit -m 'Add some feature'`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a pull request.

---

## **License**
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## **Acknowledgments**
- [GitHub API](https://docs.github.com/en/rest) for commit integration.
- [Socket.IO](https://socket.io/) for real-time updates.
- [Material-UI](https://mui.com/) for UI components.
- [VS Code API](https://code.visualstudio.com/api) for the extension.

---

## **Author**
- **Tushar Kand** - [GitHub Profile](https://github.com/Blame11)  
