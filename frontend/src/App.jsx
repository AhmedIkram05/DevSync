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

function App() {
  return (
    <Router>
      <Navbar role="admin" /> {/* Change role to "developer" for client app */}
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tasks" element={<TaskList />} />
        <Route path="/tasks/:id" element={<TaskDetails />} />
        <Route path="/github" element={<GitHubIntegration />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/create-task" element={<TaskCreation />} />
        <Route path="/admin/developer-progress" element={<DeveloperProgress />} />
        <Route path="/admin/reports" element={<Reports />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;