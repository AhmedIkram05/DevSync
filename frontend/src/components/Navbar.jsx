import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="bg-blue-600 p-4 text-white">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">DevSync</Link>
        <div className="flex space-x-4">
          <Link to="/dashboard" className="hover:text-gray-300">Dashboard</Link>
          <Link to="/tasks" className="hover:text-gray-300">Tasks</Link>
          <Link to="/github" className="hover:text-gray-300">GitHub</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;