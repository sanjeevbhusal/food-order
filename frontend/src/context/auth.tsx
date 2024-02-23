import { API_URL } from "@/lib/constants";
import { User } from "@/types";
import axios from "axios";
import { useState, createContext, useEffect } from "react";

export interface AuthContext {
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  user: User | null;
}

export const AuthContext = createContext<AuthContext | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userFetchingComplete, setUserFetchingComplete] = useState(false);
  const isAuthenticated = !!user;

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await axios.get<{ data: User }>(
          `${API_URL}/authentication/me`,
          { withCredentials: true }
        );
        const user = response.data.data;
        setUser(user);
      } catch (error) {
        console.log(error);
        setUser(null);
      } finally {
        setUserFetchingComplete(true);
      }
    }

    fetchUser();
  }, []);

  if (!userFetchingComplete) {
    return <div>Loading....</div>;
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, setUser, user }}>
      {children}
    </AuthContext.Provider>
  );
}
