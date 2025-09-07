import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { useAlert } from "../contexts/AlertContext";

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // New state for password visibility

  const { login } = useAuth();
  const alert = useAlert();
  const API_BASE_URL = "https://bavjournal.onrender.com";

  const handleAuth = async () => {
    if (!username || !password || (!isLogin && !displayName)) {
      alert.error("Oops!", "Please fill in all required fields");
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = isLogin ? "/api/login" : "/api/register";
      const data = isLogin
        ? { username, password }
        : { username, password, displayName, email: email || undefined };

      const response = await axios.post(API_BASE_URL + endpoint, data);

      const success = await login(response.data.user, response.data.token);

      if (success) {
        navigation.reset({
          index: 0,
          routes: [{ name: "Journal" }],
        });
      } else {
        alert.error("Error", "Failed to save login information");
      }
    } catch (error) {
      const message = error.response?.data?.error || "Authentication failed";
      alert.error("Oops!", message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="heart" size={50} color="#ff6b8b" />
          </View>
          <Text style={styles.title}>💖 CoupleJournal</Text>
          <Text style={styles.subtitle}>Your private love diary</Text>
        </View>

        <View style={styles.formContainer}>
          {!isLogin && (
            <>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="person"
                  size={20}
                  color="#ff6b8b"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Your Beautiful Name *"
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholderTextColor="#ff9eb0"
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons
                  name="mail"
                  size={20}
                  color="#ff6b8b"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Email (optional)"
                  value={email}
                  onChangeText={setEmail}
                  placeholderTextColor="#ff9eb0"
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </>
          )}

          <View style={styles.inputContainer}>
            <Ionicons
              name="person"
              size={20}
              color="#ff6b8b"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Username or Email *"
              value={username}
              onChangeText={setUsername}
              placeholderTextColor="#ff9eb0"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons
              name="lock-closed"
              size={20}
              color="#ff6b8b"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.passwordInput}
              placeholder="Password *"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholderTextColor="#ff9eb0"
            />
            <TouchableOpacity
              onPress={toggleShowPassword}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={20}
                color="#ff6b8b"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.authButton, isLoading && styles.authButtonDisabled]}
            onPress={handleAuth}
            disabled={isLoading}
          >
            {isLoading ? (
              <Text style={styles.authButtonText}>Loading...</Text>
            ) : (
              <Text style={styles.authButtonText}>
                {isLogin ? "Login" : "Create Our Journal"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsLogin(!isLogin)}
            style={styles.switchButton}
          >
            <Text style={styles.switchText}>
              {isLogin
                ? "New here? Create account"
                : "Already have an account? Login"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            For you and your special someone 💑
          </Text>
          <Text style={styles.footerSubtext}>
            Share your love story privately
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff0f5",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ff6b8b",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "#ff9eb0",
    textAlign: "center",
  },
  formContainer: {
    marginBottom: 40,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 25,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#ffd1dc",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: "#333",
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: "#333",
    paddingRight: 40, // Extra padding for the eye icon
  },
  eyeIcon: {
    position: "absolute",
    right: 15,
    padding: 10,
  },
  authButton: {
    backgroundColor: "#ff6b8b",
    padding: 15,
    borderRadius: 25,
    alignItems: "center",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  authButtonDisabled: {
    backgroundColor: "#ffb8c9",
  },
  authButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  switchButton: {
    alignItems: "center",
    padding: 10,
  },
  switchText: {
    color: "#ff6b8b",
    textAlign: "center",
    fontWeight: "500",
  },
  footer: {
    alignItems: "center",
    padding: 20,
  },
  footerText: {
    color: "#ff6b8b",
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 5,
  },
  footerSubtext: {
    color: "#ff9eb0",
    fontSize: 14,
    textAlign: "center",
  },
});

export default LoginScreen;
