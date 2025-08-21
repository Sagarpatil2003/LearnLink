
import logo from "../assets/Learn Link Logo.png"
import { Link } from "react-router"

export function SignUp() {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-lg">
        <div className="flex justify-center mb-4">
          <img src={logo} alt="Learn Link Logo" className="h-40 w-auto mix-blend-darken" />
        </div>
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">SignUp</h2>
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring focus:ring-blue-200"
              placeholder="Enter username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring focus:ring-blue-200"
              placeholder="Enter password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring focus:ring-blue-200">
              <option value="">Select role</option>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 py-2 text-white hover:bg-blue-700"
          >
            SignUp
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
         login here {" "}
          <Link to="/" className="text-blue-600 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}