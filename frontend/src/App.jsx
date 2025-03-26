import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import TaskList from "./pages/TaskList";
import TaskDetails from "./pages/TaskDetails";
import GitHubIntegration from "./pages/GitHubIntegration";
import AdminDashboard from "./pages/AdminDashboard";
import TaskCreation from "./pages/TaskCreation";
import DeveloperProgress from "./pages/DeveloperProgress";
import Reports from "./pages/Reports";
import Login from "./pages/Login";
import Navbar from "./components/Navbar";
import ClientDashboard from "./pages/clientdashboard";
import TaskDetailsUser from "./pages/TaskDetailsUser";
import GitHubIntegrationDetail from "./pages/GithubIntegrationDetail";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import Register from "./pages/Register"; // We'll create this next

// Protected route wrapper component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
    // Redirect based on role
    return currentUser.role === 'admin' ? 
      <Navigate to="/admin" replace /> : 
      <Navigate to="/clientdashboard" replace />;
  }

  return children;
};

function AppRoutes() {
  const { currentUser } = useAuth();

  return (
    <>
      {currentUser && <Navbar />}
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Client/Developer Routes */}
        <Route path="/clientdashboard" element={
          <ProtectedRoute allowedRoles={['developer', 'client']}>
            <ClientDashboard />
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={['developer', 'client']}>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/TaskDetailUser/:id" element={
          <ProtectedRoute allowedRoles={['developer', 'client']}>
            <TaskDetailsUser />
          </ProtectedRoute>
        } />
        <Route path="/tasks" element={
          <ProtectedRoute allowedRoles={['developer', 'client', 'admin']}>
            <TaskList />
          </ProtectedRoute>
        } />
        <Route path="/tasks/:id" element={
          <ProtectedRoute allowedRoles={['developer', 'client', 'admin']}>
            <TaskDetails />
          </ProtectedRoute>
        } />
        <Route path="/github" element={
          <ProtectedRoute allowedRoles={['developer', 'client', 'admin']}>
            <GitHubIntegration />
          </ProtectedRoute>
        } />
        <Route path="/githubintegrationdetail/:repoId" element={
          <ProtectedRoute allowedRoles={['developer', 'client', 'admin']}>
            <GitHubIntegrationDetail />
          </ProtectedRoute>
        } />
        
        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/create-task" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <TaskCreation />
          </ProtectedRoute>
        } />
        <Route path="/admin/developer-progress" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DeveloperProgress />
          </ProtectedRoute>
        } />
        <Route path="/admin/reports" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Reports />
          </ProtectedRoute>
        } />
        
        {/* Default route */}
        <Route path="/" element={
          currentUser ? 
            currentUser.role === 'admin' ? 
              <Navigate to="/admin" replace /> : 
              <Navigate to="/clientdashboard" replace /> 
            : 
            <Navigate to="/login" replace />
        } />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <AppRoutes />
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;