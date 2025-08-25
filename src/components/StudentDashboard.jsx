import { useEffect, useState, useRef } from "react";
import { db, auth } from "../firebaseConfigration/firebaseConfigration";
import { collection, query, where, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { XCircle, Calendar } from "lucide-react";
import { useNavigate } from "react-router"; // Corrected import path for useNavigate
import { Whiteboard } from "./Whiteboard"; // Assuming this is correct

export function StudentDashboard() {
  const [activeSessions, setActiveSessions] = useState([]);
  const [doneSessions, setDoneSessions] = useState([]);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeMeeting, setActiveMeeting] = useState(null);
  const jitsiContainerRef = useRef(null);
  const jitsiApiRef = useRef(null);
  const navigate = useNavigate(); // Corrected variable name to 'navigate' for clarity

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) setCurrentUser(user);
      setLoadingAuth(false);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "sessions"), where("status", "in", ["active", "ended"]));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const active = [];
      const ended = [];
      snapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() };
        if (data.status === "ended") ended.push(data);
        else active.push(data);
      });
      setActiveSessions(active);
      setDoneSessions(ended);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!jitsiContainerRef.current) return;

    if (!activeMeeting) {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
        jitsiApiRef.current = null;
      }
      return;
    }

    if (!window.JitsiMeetExternalAPI) {
      alert("Jitsi Meet API not loaded.");
      return;
    }

    jitsiContainerRef.current.innerHTML = "";
    const api = new window.JitsiMeetExternalAPI("meet.jit.si", {
      roomName: activeMeeting.roomName,
      width: "100%",
      height: 600,
      parentNode: jitsiContainerRef.current,
      userInfo: { displayName: "Student" },
      configOverwrite: { startWithAudioMuted: true },
      interfaceConfigOverwrite: { filmStripOnly: false },
    });

    jitsiApiRef.current = api;

    return () => {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
        jitsiApiRef.current = null;
      }
    };
  }, [activeMeeting]);

  const handleJoin = (session) => setActiveMeeting(session);

  const handleLeaveMeeting = () => setActiveMeeting(null);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  async function deleteSession(id) {
    try {
      await deleteDoc(doc(db, "sessions", id));
    } catch (err) {
      console.error("Error deleting session:", err);
    }
  }

  if (loadingAuth) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <XCircle size={48} className="text-red-500 mb-4" />
        <h1 className="text-3xl font-bold mb-2">Authentication Failed</h1>
        <button onClick={() => window.location.reload()} className="px-6 py-3 bg-blue-600 text-white rounded-lg">
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <aside className="w-64 bg-white shadow-lg flex flex-col justify-between">
        <div>
          <div className="p-6 font-bold text-xl border-b">Student Panel</div>
          <button
            onClick={() => navigate("/white-board")}
            className={`flex items-center gap-2 w-full text-left px-4 py-3 font-medium text-lg transition-all duration-200 text-gray-700 hover:bg-green-50 hover:text-green-600`}
          >
            <Calendar size={20} /> White Board
          </button>
        </div>
        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-3xl font-semibold mb-6">Active Sessions</h1>
        {activeSessions.length === 0 ? (
          <p className="text-gray-500">No active sessions right now.</p>
        ) : (
          <div className="grid gap-4">
            {activeSessions.map((session) => (
              <div
                key={session.id}
                className="p-6 bg-white rounded-xl shadow-md flex justify-between items-center hover:shadow-lg transition"
              >
                <div>
                  <h2 className="text-lg font-semibold">{session.title || session.topic}</h2>
                  <p className="text-sm text-gray-600">{formatDateTime(session.startTime)}</p>
                </div>
                <button
                  onClick={() => handleJoin(session)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Join
                </button>
              </div>
            ))}
          </div>
        )}

        {doneSessions.length > 0 && (
          <div className="mt-10">
            <h1 className="text-3xl font-semibold mb-4">Past Sessions</h1>
            <div className="grid gap-4">
              {doneSessions.map((session) => (
                <div key={session.id} className="p-6 bg-gray-200 rounded-xl shadow-md">
                  <h2 className="text-lg font-semibold">{session.title || session.topic}</h2>
                  <p className="text-sm text-gray-600">{formatDateTime(session.startTime)}</p>
                  <button
                    onClick={() => deleteSession(session.id)}
                    className="mt-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeMeeting && (
          <div className="mt-8 bg-white p-4 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-bold">Live Meeting: {activeMeeting.title}</h2>
              <button
                onClick={handleLeaveMeeting}
                className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Leave
              </button>
            </div>
            <div ref={jitsiContainerRef} className="w-full h-[600px]"></div>
          </div>
        )}
      </main>
    </div>
  );
}