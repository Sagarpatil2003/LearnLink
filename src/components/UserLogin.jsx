import { useState } from "react"
import logo from "../assets/Learn Link Logo.png"
import { Link, useNavigate } from "react-router"

export function UserLogin() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("")
  const [error, setError] = useState("")  
  const [loading, setLoading] = useState(false) 
 
  const navigate = useNavigate()
  const handleLogin = (e)=>{
    e.preventDefault()
    
    setLoading(true)
    setError("")
    

  }

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-r from-yellow-100 via-red-100 to-pink-100 ">
      <div className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-lg">
        <div className="flex justify-center mb-4">
          <img src={logo} alt="Learn Link Logo" className="h-40 w-auto mix-blend-darken" />
        </div>
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">Login</h2>
        <form className="space-y-4">
           {error && <p className="text-red-500 text-sm">{error}</p>}
           <br />
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e)=> setUsername(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring focus:ring-blue-200"
              placeholder="Enter username"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e)=> setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring focus:ring-blue-200"
              placeholder="Enter password"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select 
             value={role}
             onChange={(e)=> setRole(e.target.value)}
             className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring focus:ring-blue-200">
              <option value="">Select role</option>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Login Up..." : "Login"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Don’t have an account?{" "}
          <Link to="/signup" className="text-blue-600 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
