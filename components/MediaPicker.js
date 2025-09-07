import React, { useState } from "react";
import { View, TouchableOpacity, Text, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";

const MediaPicker = ({ onMediaSelected, onVoiceRecord, isRecording }) => {
  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Please allow access to your media library"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        onMediaSelected("image", result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const pickVideo = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Please allow access to your media library"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        onMediaSelected("video", result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick video");
    }
  };

  const recordVideo = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Please allow camera access to record videos"
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
        videoMaxDuration: 60, // 60 seconds max
      });

      if (!result.canceled) {
        onMediaSelected("video", result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to record video");
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={pickImage} style={styles.button}>
        <Ionicons name="image" size={24} color="#ff6b8b" />
        <Text style={styles.buttonText}>Photo</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={pickVideo} style={styles.button}>
        <Ionicons name="videocam" size={24} color="#ff6b8b" />
        <Text style={styles.buttonText}>Video</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={recordVideo} style={styles.button}>
        <Ionicons name="camera" size={24} color="#ff6b8b" />
        <Text style={styles.buttonText}>Record</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onVoiceRecord}
        style={[styles.button, isRecording && styles.recordingButton]}
      >
        <Ionicons
          name={isRecording ? "stop-circle" : "mic"}
          size={24}
          color={isRecording ? "white" : "#ff6b8b"}
        />
        <Text style={[styles.buttonText, isRecording && styles.recordingText]}>
          {isRecording ? "Recording..." : "Voice"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#ffd1dc",
  },
  button: {
    alignItems: "center",
    padding: 10,
    borderRadius: 20,
    backgroundColor: "#fff0f5",
    minWidth: 80,
  },
  buttonText: {
    marginTop: 5,
    color: "#ff6b8b",
    fontSize: 12,
  },
  recordingButton: {
    backgroundColor: "#ff6b8b",
  },
  recordingText: {
    color: "white",
  },
});

export default MediaPicker;
