import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const API_BASE_URL = "https://bavjournal.onrender.com";

  useEffect(() => {
    // Check if user is logged in on app start
    checkLoggedIn();
  }, []);

  const checkLoggedIn = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("userToken");
      const storedUser = await AsyncStorage.getItem("userData");

      if (storedToken && storedUser) {
        // Set the token for API calls
        axios.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${storedToken}`;

        // Set user state
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Error checking login status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (userData, authToken) => {
    try {
      // Store user data and token
      await AsyncStorage.setItem("userToken", authToken);
      await AsyncStorage.setItem("userData", JSON.stringify(userData));

      // Set the token for API calls
      axios.defaults.headers.common["Authorization"] = `Bearer ${authToken}`;

      // Update state
      setToken(authToken);
      setUser(userData);

      return true;
    } catch (error) {
      console.error("Error saving login data:", error);
      return false;
    }
  };

  const logout = async () => {
    try {
      // Remove stored data
      await AsyncStorage.removeItem("userToken");
      await AsyncStorage.removeItem("userData");

      // Remove token from API headers
      delete axios.defaults.headers.common["Authorization"];

      // Update state
      setToken(null);
      setUser(null);

      return true;
    } catch (error) {
      console.error("Error during logout:", error);
      return false;
    }
  };

  const value = {
    user,
    token,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user && !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
