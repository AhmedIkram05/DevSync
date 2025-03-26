import { Link } from "react-router-dom";

const Navbar = ({ role }) => {
  return (
    <nav className="bg-blue-600 p-4 text-white">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">DevSync</Link>
        <div className="flex space-x-4">
          <Link to="/dashboard" className="hover:text-gray-300">Dashboard</Link>
          {role === "admin" && (
            <Link to="/admin" className="hover:text-gray-300">Admin</Link>
          )}

          {/* {role === "developer" && ( */}
            <>
              <Link to="/clientdashboard" className="hover:text-gray-300">UserDashboard</Link>
              <Link to="/tasks" className="hover:text-gray-300">Tasks</Link>
              <Link to="/TaskDetailUser" className="hover:text-gray-300">TaskDetailUser</Link>
              <Link to="/githubintegrationdetail" className="hover:text-gray-300">GitHubIntegrationDetail</Link>
            </>
          {/* )} */}

         
          {/* <Link to="/github" className="hover:text-gray-300">GitHub</Link> */}
          <Link to="/login" className="hover:text-gray-300">Login</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;