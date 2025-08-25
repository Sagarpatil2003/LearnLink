import { useState, useEffect } from "react";
import { db } from "../firebaseConfigration/firebaseConfigration";
import { collection, addDoc } from "firebase/firestore";
import { XCircle, Loader2, Plus } from "lucide-react";

export function CreateSession({ isOpen, onClose, userId }) {
  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [sessionTime, setSessionTime] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSessionTitle("");
      setErrorMessage("");
      const now = new Date();
      setSessionDate(now.toISOString().split("T")[0]); // yyyy-mm-dd
      setSessionTime(now.toTimeString().slice(0, 5)); // hh:mm
    }
  }, [isOpen]);

  const handleCreateSession = async () => {
    if (!sessionTitle.trim() || !sessionDate || !sessionTime) {
      setErrorMessage("Please fill in all fields.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const combinedDateTime = new Date(`${sessionDate}T${sessionTime}`);
      if (isNaN(combinedDateTime.getTime())) {
        setErrorMessage("Invalid date or time.");
        setIsLoading(false);
        return;
      }

      const roomName = `classroom-${userId}-${Date.now()}`;
      const meetingUrl = `https://meet.jit.si/${roomName}`;

      const sessionData = {
        title: sessionTitle.trim(),
        teacherId: userId,
        startTime: combinedDateTime.toISOString(),
        status: "active",
        meetingUrl,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, "sessions"), sessionData);
      onClose();
    } catch (error) {
      console.error("Error creating session:", error);
      setErrorMessage("Failed to create session. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 rounded-xl">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md relative border border-gray-200">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 transition"
        >
          <XCircle size={24} />
        </button>
        <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-3">
          Create New Session
        </h2>
        {errorMessage && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
            {errorMessage}
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Session Title
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
              placeholder="e.g., Algebra Basics"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time
            </label>
            <input
              type="time"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={sessionTime}
              onChange={(e) => setSessionTime(e.target.value)}
              required
            />
          </div>
          <button
            onClick={handleCreateSession}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition flex items-center justify-center disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="animate-spin mr-2" size={20} />
            ) : (
              <Plus size={20} className="mr-2" />
            )}
            Create Session
          </button>
        </div>
      </div>
    </div>
  );
}
