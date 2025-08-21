import { useState } from 'react'
import logo from '../assets/Learn Link Logo.png'
import { Link, useNavigate } from "react-router"
import { createUserWithEmailAndPassword } from 'firebase/auth'
import {doc, setDoc} from "firebase/firestore"
import {auth,db} from "../firebaseConfigration/firebaseConfigration"



function generateUserCode(role){
    let prefix = role === "student" ? "st" : "tc"
    let randomNum = Math.floor(100000 + Math.random()*900000)
    return `${prefix}_${randomNum}`
}

export function SignUp() {
    const [fullName, setFullName] = useState("")
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [role, setRole] = useState("")
    const [className, setClassName] = useState("")
    const [subject, setSubject] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    let navigate = useNavigate()
    
function resetForm(){
    setFullName("")
    setUsername("")
    setPassword("")
    setRole("")
    setClassName("")
    setSubject("")
    
}

let handleSignUp = async (e) => {
  e.preventDefault()
  setLoading(true)
  setError("")
  setSuccess("")

  try {
    let userCredential = await createUserWithEmailAndPassword(auth, username, password)
    let user = userCredential.user
    // console.log(userCredential)
    let userid = generateUserCode(role)

    let extraData = { role, code: userid }

    if (role === "student" && className) {
      extraData.className = className
    }
    if (role === "teacher" && subject) {
      extraData.subject = subject
    }

    await setDoc(doc(db, "users", user.uid), {
      name: fullName,
      email: username,
      ...extraData,
      createdAt: new Date().toISOString()
,
    })
   
    setSuccess(`User registered successfully 🎉`)
    resetForm()
    navigate('/')
  } catch (error) {
    console.error("Firestore Error:", error)
    setError(error.message)
  }
  setLoading(false)
}

  return (
    <div className="flex h-screen items-center bg-gradient-to-r from-yellow-100 via-red-100 to-pink-100 justify-center bg-gray-100">
      <div className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-lg">
        <div className="flex justify-center mb-4">
          <img src={logo} alt="Learn Link Logo" className="h-25 w-auto mix-blend-darken" />
        </div>
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">SignUp</h2>
        <form className="space-y-4" onSubmit={handleSignUp}>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {success && <p className="text-green-600 text-sm">{success}</p>}
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder="Enter your full name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring focus:ring-blue-200"
              placeholder="Enter email"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring focus:ring-blue-200"
              placeholder="Enter password"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring focus:ring-blue-200"
              required
            >
              <option value="">Select role</option>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>

          {/* Conditionally render role-specific inputs */}
          {role === "student" && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Class</label>
              <input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="Enter class"
                required
              />
            </div>
          )}

          {role === "teacher" && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="Enter subject"
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Signing up..." : "SignUp"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link to="/" className="text-blue-600 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}





