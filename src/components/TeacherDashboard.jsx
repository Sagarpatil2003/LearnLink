import { useEffect, useState, useRef } from "react"
import { db, auth } from "../firebaseConfigration/firebaseConfigration"
import { collection, query, where, onSnapshot, updateDoc, doc } from "firebase/firestore"
import { Plus, LogOut, Loader2, Calendar, BookOpen, Clock, XCircle } from "lucide-react"
import { CreateSession } from "./CreateSession"
import { signInAnonymously, signInWithCustomToken, signOut, onAuthStateChanged } from "firebase/auth"
import { useNavigate } from "react-router"
import logo from "../assets/Learn Link Logo.png"

export function TeacherDashboard() {
  const [sessions, setSessions] = useState([])
  const [doneSessions, setDoneSessions] = useState([])
  const [activeTab, setActiveTab] = useState("active")
  const [currentUser, setCurrentUser] = useState(null)
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [isCreateSessionModalOpen, setIsCreateSessionModalOpen] = useState(false)
  const [userId, setUserId] = useState("")
  const [activeMeeting, setActiveMeeting] = useState(null)
  const jitsiContainerRef = useRef(null)
  const jitsiApiRef = useRef(null)
  const usenavigate = useNavigate()

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async user => {
      if (user) {
        setCurrentUser(user)
        setUserId(user.uid)
      } else {
        try {
          if (window.initialAuthToken) await signInWithCustomToken(auth, window.initialAuthToken)
          else await signInAnonymously(auth)
        } catch (e) {}
      }
      setLoadingAuth(false)
    })
    return () => unsubscribeAuth()
  }, [])

  useEffect(() => {
    if (!userId) return
    const sessionsCollectionRef = collection(db, "sessions")
    const q = query(sessionsCollectionRef, where("teacherId", "==", userId))
    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const active = []
        const ended = []
        snapshot.forEach(docSnap => {
          const raw = docSnap.data()
          const item = { id: docSnap.id, ...raw, status: raw?.status || "active" }
          if (item.status === "ended") ended.push(item)
          else active.push(item)
        })
        active.sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
        ended.sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
        setSessions(active)
        setDoneSessions(ended)
      },
      () => {}
    )
    return () => unsubscribe()
  }, [userId])

  const formatDateTime = isoString => {
    if (!isoString) return "-"
    const date = new Date(isoString)
    return date.toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })
  }

  const getRoomName = meeting => {
    const url = meeting?.meetingUrl || ""
    const direct = meeting?.roomName || ""
    if (url) {
      try {
        const u = new URL(url.includes("://") ? url : `https://meet.jit.si/${url}`)
        const parts = u.pathname.split("/").filter(Boolean)
        if (parts.length) return parts.pop()
      } catch (e) {
        const parts = url.split("/").filter(Boolean)
        if (parts.length) return parts.pop()
      }
    }
    if (direct) return direct
    return meeting?.id || "room"
  }

  useEffect(() => {
    if (!jitsiContainerRef.current) return
    if (!activeMeeting) {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose()
        jitsiApiRef.current = null
      }
      jitsiContainerRef.current.innerHTML = ""
      return
    }
    if (!window.JitsiMeetExternalAPI) {
      alert("Jitsi Meet API not loaded.")
      return
    }
    const roomName = getRoomName(activeMeeting)
    jitsiContainerRef.current.innerHTML = ""
    const api = new window.JitsiMeetExternalAPI("meet.jit.si", {
      roomName,
      width: "100%",
      height: 600,
      parentNode: jitsiContainerRef.current,
      userInfo: { displayName: "Teacher" },
      configOverwrite: {
      startWithAudioMuted: true,
      startWithVideoMuted: false,
      prejoinPageEnabled: false,
      enableWelcomePage: false,
      enableUserRolesBasedOnToken: false 
  },
      interfaceConfigOverwrite: { filmStripOnly: false }
    })
    jitsiApiRef.current = api
    return () => {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose()
        jitsiApiRef.current = null
      }
    }
  }, [activeMeeting])

  const handleJoin = session => setActiveMeeting(session)

  const handleLeaveMeeting = () => setActiveMeeting(null)

  const handleEndSession = async id => {
    try {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose()
        jitsiApiRef.current = null
      }
      setActiveMeeting(null)
      if (jitsiContainerRef.current) jitsiContainerRef.current.innerHTML = ""
      await updateDoc(doc(db, "sessions", id), { status: "ended" })
    } catch (e) {}
  }

  const handleLogout = async () => {
    await signOut(auth)
    usenavigate("/")
  }

  const displayedSessions = activeTab === "active" ? sessions : doneSessions

  if (loadingAuth) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <Loader2 className="animate-spin text-blue-500 mr-2" size={32} />
        <span className="text-xl font-medium text-gray-700">Loading Dashboard...</span>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100 p-4 text-center">
        <XCircle className="text-red-500 mb-4" size={48} />
        <h1 className="text-3xl font-bold mb-2">Authentication Failed</h1>
        <p className="text-gray-700 mb-6">Could not load user data. Please refresh.</p>
        <button onClick={() => window.location.reload()} className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition">
          Refresh
        </button>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100 text-gray-900 overflow-hidden font-sans">
      <aside className="w-64 bg-white shadow-xl flex flex-col justify-between rounded-r-xl">
        <div>
          <div className="flex justify-center mb-4">
                    <img src={logo} alt="Learn Link Logo" className="h-30 w-auto mix-blend-darken" />
          </div>
          <div className="p-4 text-sm text-gray-600 border-b border-gray-100">
            Logged in as: <span className="font-semibold text-blue-800 break-words">{userId}</span>
          </div>
          <nav className="p-4 space-y-3">
            <button onClick={() => setActiveTab("active")} className={`flex items-center gap-2 w-full text-left px-4 py-3 rounded-xl font-medium text-lg transition-all duration-200 ${activeTab === "active" ? "bg-blue-600 text-white shadow-md" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"}`}>
              <BookOpen size={20} /> Active Sessions
            </button>
            <button onClick={() => setActiveTab("done")} className={`flex items-center gap-2 w-full text-left px-4 py-3 rounded-xl font-medium text-lg transition-all duration-200 ${activeTab === "done" ? "bg-green-600 text-white shadow-md" : "text-gray-700 hover:bg-green-50 hover:text-green-600"}`}>
              <Calendar size={20} /> Done Sessions
            </button>
             <button
            onClick={() => usenavigate('/white-board')}
            className={`flex items-center gap-2 w-full text-left px-4 py-3 rounded-xl font-medium text-lg transition-all duration-200 ${
              activeTab === "done" ? "bg-green-600 text-white shadow-md" : "text-gray-700 hover:bg-green-50 hover:text-green-600"
            }`}
          >
            <Calendar size={20} /> White Board
          </button>

          </nav>
        </div>
        <div className="p-4 border-t border-gray-100">
          <button onClick={handleLogout} className="w-full bg-red-600 text-white py-3 rounded-xl hover:bg-red-700 transition-all duration-200 shadow-md flex items-center justify-center gap-2 font-medium text-lg">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">{activeTab === "active" ? "Active Sessions" : "Done Sessions"}</h1>
          {activeTab === "active" && (
            <button onClick={() => setIsCreateSessionModalOpen(true)} className="px-6 py-3 bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700 transition-all duration-200 flex items-center gap-2 font-medium text-lg">
              <Plus size={20} /> Create New Session
            </button>
          )}
        </div>

        {displayedSessions.map(session => (
          <div key={session.id} className="p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition mb-4 flex flex-col justify-between border border-gray-200">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-800 mb-2">{session.title}</h2>
              <p className="text-sm text-gray-600 flex items-center gap-2 mb-1">
                <Clock size={16} className="text-blue-500" />
                <span className="font-medium">Start Time:</span> {formatDateTime(session.startTime)}
              </p>
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <BookOpen size={16} className={session.status === "active" ? "text-green-500" : "text-gray-500"} />
                <span className="font-medium">Status:</span>
                <span className={`capitalize font-semibold ${session.status === "active" ? "text-green-600" : "text-gray-600"}`}>{session.status}</span>
              </p>
            </div>
            {activeTab === "active" && (
              <div className="flex gap-3 mt-auto">
                <button onClick={() => handleJoin(session)} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm font-medium">Join</button>
                <button onClick={() => handleEndSession(session.id)} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 shadow-sm font-medium">End</button>
              </div>
            )}
          </div>
        ))}

        {activeMeeting && (
          <div className="mt-8 bg-white p-4 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-bold">Live Meeting: {activeMeeting.title}</h2>
              <button onClick={handleLeaveMeeting} className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700">Leave</button>
            </div>
            <div ref={jitsiContainerRef} className="w-full h-[600px]"></div>
          </div>
        )}
      </main>

      <CreateSession isOpen={isCreateSessionModalOpen} onClose={() => setIsCreateSessionModalOpen(false)} userId={userId} />
    </div>
  )
}
