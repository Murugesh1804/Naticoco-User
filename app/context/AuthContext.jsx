import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "expo-router";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    // Check for stored auth state when app loads
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("logincre");
      const storedToken = await AsyncStorage.getItem("token");

      if (storedUser && storedToken) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        // Directly navigate to store screen if user is already logged in
        navigation.reset({
          index: 0,
          routes: [{ name: "StoreType" }],
        });
      }
    } catch (error) {
      console.error("Error loading auth state:", error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (userData, token) => {
    try {
      await AsyncStorage.setItem("logincre", JSON.stringify(userData));
      await AsyncStorage.setItem("token", token);
      setUser(userData);
      // Navigate to store screen after successful login
      navigation.reset({
        index: 0,
        routes: [{ name: "StoreType" }],
      });
    } catch (error) {
      console.error("Error storing auth state:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem("logincre");
      await AsyncStorage.removeItem("token");
      setUser(null);
    } catch (error) {
      console.error("Error clearing auth state:", error);
      throw error;
    }
  };

  const updateUserProfile = async (updatedData) => {
    try {
      const newUserData = { ...user, ...updatedData };
      await AsyncStorage.setItem("logincre", JSON.stringify(newUserData));
      setUser(newUserData);
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        updateUserProfile,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
