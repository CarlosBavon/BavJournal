import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const LoadingScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Ionicons name="heart" size={60} color="#ff6b8b" />
      </View>
      <Text style={styles.title}>CoupleJournal</Text>
      <Text style={styles.subtitle}>Loading your love story...</Text>
      <ActivityIndicator size="large" color="#ff6b8b" style={styles.spinner} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff0f5",
    padding: 20,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
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
    fontSize: 28,
    fontWeight: "bold",
    color: "#ff6b8b",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#ff9eb0",
    marginBottom: 30,
  },
  spinner: {
    marginTop: 20,
  },
});

export default LoadingScreen;
