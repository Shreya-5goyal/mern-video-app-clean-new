import { useState } from "react";
import HomePage from "./components/HomePage";
import MeetingRoom from "./components/MeetingRoom";
import AuthPage from "./components/Auth/AuthPage";
import { useAuth } from "./context/AuthContext";
import "./App.css";

export default function App() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState("home");
  const [roomId, setRoomId] = useState("");

  const handleJoinRoom = (id) => {
    setRoomId(id);
    setCurrentView("meeting");
  };

  const handleLeaveRoom = () => {
    setCurrentView("home");
    setRoomId("");
  };

  if (loading) return null;

  if (!user) {
    return <AuthPage />;
  }

  return (
    <>
      {currentView === "home" ? (
        <HomePage onJoinRoom={handleJoinRoom} />
      ) : (
        <MeetingRoom
          roomId={roomId}
          userName={user.name}
          onLeave={handleLeaveRoom}
        />
      )}
    </>
  );
}
