import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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
function App() {
  // You can manage this role state with context or redux
  const userRole = "admin"; // Change this to "admin" for admin view

  return (
    <Router>
      <Navbar role={userRole} />
      <Routes>
        {/* Common Routes */}
        <Route path="/login" element={<Login />} />
        
        {/* Developer/Client Routes */}
        <Route path="/clientdashboard" element={<ClientDashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/TaskDetailUser" element={<TaskDetailsUser />} />
        <Route path="/tasks" element={<TaskList />} />
        <Route path="/tasks/:id" element={<TaskDetails />} />
        <Route path="/github" element={<GitHubIntegration />} />
        <Route path="/githubintegrationdetail" element={<GitHubIntegrationDetail />} />
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/create-task" element={<TaskCreation />} />
        <Route path="/admin/developer-progress" element={<DeveloperProgress />} />
        <Route path="/admin/reports" element={<Reports />} />

   
      </Routes>
    </Router>
  );
}

export default App;