import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    // Initialize socket connection
    const socketUrl =
      process.env.REACT_APP_SOCKET_URL || "https://project1-wr4s.onrender.com";
    const newSocket = io(socketUrl, {
      transports: ["websocket", "polling"],
      timeout: 20000,
      forceNew: true,
    });

    // Connection event handlers
    newSocket.on("connect", () => {
      console.log("🔌 Connected to WebSocket server");
      setIsConnected(true);

      // Join appropriate room based on user role
      if (isAdmin) {
        newSocket.emit("join-admin");
        console.log("👑 SocketContext: Joined admin room");
      } else {
        newSocket.emit("join-user");
        console.log("👤 SocketContext: Joined user room");
      }
    });

    newSocket.on("disconnect", () => {
      console.log("🔌 Disconnected from WebSocket server");
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("❌ WebSocket connection error:", error);
      setIsConnected(false);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, [isAdmin]);

  // Rejoin rooms when user role changes
  useEffect(() => {
    if (socket && isConnected) {
      if (isAdmin) {
        socket.emit("join-admin");
        console.log("👑 Rejoined admin room");
      } else {
        socket.emit("join-user");
        console.log("👤 Rejoined user room");
      }
    }
  }, [socket, isConnected, isAdmin]);

  const value = {
    socket,
    isConnected,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
