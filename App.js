import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { StatusBar } from "expo-status-bar";

// Import contexts
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { AlertProvider } from "./contexts/AlertContext";

// Import screens and components
import LoginScreen from "./screens/LoginScreen";
import JournalScreen from "./screens/JournalScreen";
import LoadingScreen from "./components/LoadingScreen";

const Stack = createStackNavigator();

// Main navigator component
const MainNavigator = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#ff6b8b",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Stack.Screen
        name="Login" // This should match what you use in navigation.reset()
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Journal" // This should match what you use in navigation.reset()
        component={JournalScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <AlertProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <NavigationContainer>
          <MainNavigator />
        </NavigationContainer>
      </AuthProvider>
    </AlertProvider>
  );
}
