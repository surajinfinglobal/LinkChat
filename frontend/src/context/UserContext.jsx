import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import socket from "../services/socket";

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUserState] = useState(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser);
    } catch (error) {
      console.error("Invalid user data:", error);
      return null;
    }
  });

  // --------------------------------
  // Set User
  // --------------------------------

  const setUser = (newUser) => {
    setUserState(newUser);

    if (newUser) {
      localStorage.setItem(
        "user",
        JSON.stringify(newUser)
      );
    } else {
      localStorage.removeItem("user");
    }
  };

  // --------------------------------
  // Update User
  // --------------------------------

  const updateUser = (updates) => {
    setUserState((currentUser) => {
      if (!currentUser) return currentUser;

      const updatedUser = {
        ...currentUser,
        ...updates,
      };

      localStorage.setItem(
        "user",
        JSON.stringify(updatedUser)
      );

      return updatedUser;
    });
  };

  // --------------------------------
  // Socket Connection
  // --------------------------------

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token || !user?.id) {
      return;
    }

    // JWT token Socket.IO ko do
    socket.auth = {
      token,
    };

    // -------------------------------
    // Socket connected
    // -------------------------------

    const handleConnect = () => {
      console.log("Frontend socket connected:", socket.id);

      updateUser({
        status: "online",
        lastSeen: null,
      });
    };

    // -------------------------------
    // Socket disconnected
    // -------------------------------

    const handleDisconnect = () => {
      console.log("Frontend socket disconnected");

      updateUser({
        status: "offline",
        lastSeen: new Date(),
      });
    };

    // -------------------------------
    // Other user's status
    // -------------------------------

    const handleUserStatus = (data) => {
      console.log("User status changed:", data);

      // Agar ye current logged-in user hai
      if (data.userId === user.id) {
        updateUser({
          status: data.status,
          lastSeen: data.lastSeen,
        });
      }
    };

    socket.on("connect", handleConnect);

    socket.on("disconnect", handleDisconnect);

    socket.on("user_status", handleUserStatus);

    socket.connect();

    // Cleanup
    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("user_status", handleUserStatus);

      socket.disconnect();
    };
  }, [user?.id]);

  // --------------------------------
  // Logout
  // --------------------------------

  const logout = () => {
    socket.disconnect();

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUserState(null);
  };

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        updateUser,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error(
      "useUser must be used inside UserProvider"
    );
  }

  return context;
};

export default UserContext;