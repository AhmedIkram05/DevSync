import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const { login, loading, error: authError } = useAuth();
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState("");
  
  // Check for existing user in localStorage
  const storedUser = localStorage.getItem('user');
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  
  // If user is already logged in, redirect to dashboard
  if (currentUser) {
    return currentUser.role === "admin" ? (
      <Navigate to="/admin" replace />
    ) : (
      <Navigate to="/clientdashboard" replace />
    );
  }
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials({
      ...credentials,
      [name]: value,
    });
  };
  
  // Updated login handler that uses the AuthContext
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");
    
    if (!credentials.email || !credentials.password) {
      setLoginError("Please enter both email and password");
      return;
    }
    
    try {
      setIsSubmitting(true);
      console.log("Attempting login with:", credentials.email);
      
      // Use auth context login which will handle GitHub prompts if needed
      await login(credentials);
      
      // No need to navigate - AuthContext will handle that after login
      
    } catch (err) {
      console.error("Login error:", err.message);
      setLoginError(err.message || "Invalid email or password");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Rest of the component remains unchanged
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6">DevSync</h1>
        <h2 className="text-xl text-gray-600 text-center mb-6">Sign In to Your Account</h2>
        
        {(loginError || authError) && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {loginError || authError}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={credentials.email}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="you@example.com"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="********"
            />
          </div>
          
          <div className="flex items-center justify-between mb-6">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
              disabled={isSubmitting || loading}
            >
              {isSubmitting || loading ? "Signing In..." : "Sign In"}
            </button>
          </div>
          
          <div className="text-center">
            <p className="text-gray-600">
              Don't have an account?{" "}
              <Link to="/register" className="text-blue-600 hover:text-blue-800">
                Create one now
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;