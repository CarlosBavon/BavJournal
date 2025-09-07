import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import axios from "axios";
import EntryCard from "../components/EntryCard";
import MediaPicker from "../components/MediaPicker";
import { useAuth } from "../contexts/AuthContext";
import { useAlert } from "../contexts/AlertContext";

const JournalScreen = ({ navigation }) => {
  const [entries, setEntries] = useState([]);
  const [newText, setNewText] = useState("");
  const [recording, setRecording] = useState();
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef();

  const { user, token, logout } = useAuth();
  const alert = useAlert();
  const API_BASE_URL = "https://bavjournal.onrender.com";

  useEffect(() => {
    if (!user || !token) {
      // If user logs out, this component will automatically unmount
      // and the Login screen will be shown by App.js
      return;
    }

    fetchEntries();
  }, [user, token]);

  const fetchEntries = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(API_BASE_URL + "/api/entries");
      setEntries(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        // Token expired or invalid, force logout
        await logout();
        navigation.replace("Login");
      } else {
        Alert.alert("Error", "Failed to load entries");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Update the logout function
  const handleLogout = async () => {
    alert.show("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
        onPress: () => {},
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          navigation.reset({
            index: 0,
            routes: [{ name: "Login" }],
          });
        },
      },
    ]);
  };

  const addTextEntry = async () => {
    if (!newText.trim()) return;

    try {
      await axios.post(API_BASE_URL + "/api/entries", {
        type: "text",
        content: newText.trim(),
      });

      setNewText("");
      fetchEntries();
      scrollViewRef.current?.scrollToOffset({ offset: 0, animated: true });
    } catch (error) {
      if (error.response?.status === 401) {
        await logout();
        navigation.replace("Login");
      } else {
        Alert.alert("Error", "Failed to add text entry");
      }
    }
  };

  const addMediaEntry = async (type, uri) => {
    try {
      const formData = new FormData();
      formData.append("type", type);
      formData.append("file", {
        uri,
        type:
          type === "image"
            ? "image/jpeg"
            : type === "video"
            ? "video/mp4"
            : "audio/m4a",
        name: `${type}-${Date.now()}.${
          type === "image" ? "jpg" : type === "video" ? "mp4" : "m4a"
        }`,
      });

      await axios.post(API_BASE_URL + "/api/entries", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      fetchEntries();
      scrollViewRef.current?.scrollToOffset({ offset: 0, animated: true });
    } catch (error) {
      if (error.response?.status === 401) {
        await logout();
        navigation.replace("Login");
      } else {
        Alert.alert("Error", `Failed to upload ${type}`);
      }
    }
  };

  const deleteEntry = async (entryId) => {
    alert.show("Delete Entry", "Are you sure you want to delete this entry?", [
      {
        text: "Cancel",
        style: "cancel",
        onPress: () => {},
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await axios.delete(API_BASE_URL + `/api/entries/${entryId}`);
            fetchEntries();
            alert.success("Success", "Entry deleted successfully");
          } catch (error) {
            if (error.response?.status === 401) {
              await logout();
              navigation.reset({
                index: 0,
                routes: [{ name: "Login" }],
              });
            } else {
              alert.error("Error", "Failed to delete entry");
            }
          }
        },
      },
    ]);
  };

  const deleteComment = async (entryId, commentId) => {
    try {
      await axios.delete(
        API_BASE_URL + `/api/entries/${entryId}/comments/${commentId}`
      );
      fetchEntries();
      Alert.alert("Success", "Comment deleted successfully");
    } catch (error) {
      if (error.response?.status === 401) {
        await logout();
        navigation.replace("Login");
      } else {
        Alert.alert("Error", "Failed to delete comment");
      }
    }
  };

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
    } catch (err) {
      Alert.alert("Error", "Failed to start recording");
    }
  };

  const stopRecording = async () => {
    setRecording(undefined);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();

    if (uri) {
      await addMediaEntry("voice", uri);
    }
  };

  const handleLike = async (entryId) => {
    try {
      await axios.post(API_BASE_URL + `/api/entries/${entryId}/like`);
      fetchEntries();
    } catch (error) {
      if (error.response?.status === 401) {
        await logout();
        navigation.replace("Login");
      } else {
        Alert.alert("Error", "Failed to like entry");
      }
    }
  };

  const handleCommentPress = (entry) => {
    setSelectedEntry(entry);
    setCommentModalVisible(true);
  };

  const handleCommentDelete = (entryId, commentId) => {
    Alert.alert(
      "Delete Comment",
      "Are you sure you want to delete this comment?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteComment(entryId, commentId),
        },
      ]
    );
  };

  const submitComment = async () => {
    if (!newComment.trim() || !selectedEntry) return;

    try {
      await axios.post(
        API_BASE_URL + `/api/entries/${selectedEntry._id}/comment`,
        {
          text: newComment.trim(),
        }
      );

      setNewComment("");
      setCommentModalVisible(false);
      fetchEntries();
    } catch (error) {
      if (error.response?.status === 401) {
        await logout();
        navigation.replace("Login");
      } else {
        Alert.alert("Error", "Failed to add comment");
      }
    }
  };

  const renderItem = ({ item }) => (
    <EntryCard
      entry={item}
      onLike={handleLike}
      onComment={handleCommentPress}
      onDelete={deleteEntry}
      onCommentDelete={handleCommentDelete}
      currentUserId={user?.id}
      currentUser={user}
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Our Love Journal 💖</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={fetchEntries} style={styles.refreshButton}>
            <Ionicons name="refresh" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading && entries.length === 0 ? (
        <View style={styles.loadingContainer}>
          <Ionicons name="heart" size={50} color="#ff6b8b" />
          <Text style={styles.loadingText}>Loading your love story...</Text>
        </View>
      ) : (
        <FlatList
          ref={scrollViewRef}
          data={entries}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.entriesContainer}
          showsVerticalScrollIndicator={false}
          refreshing={isLoading}
          onRefresh={fetchEntries}
        />
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.inputContainer}
      >
        <View style={styles.textInputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a sweet message..."
            value={newText}
            onChangeText={setNewText}
            placeholderTextColor="#ff9eb0"
            multiline
          />
          <TouchableOpacity onPress={addTextEntry} style={styles.sendButton}>
            <Ionicons name="send" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <MediaPicker
          onMediaSelected={addMediaEntry}
          onVoiceRecord={recording ? stopRecording : startRecording}
          isRecording={!!recording}
        />
      </KeyboardAvoidingView>

      {/* Comment Modal */}
      <Modal
        visible={commentModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCommentModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add a Comment</Text>
              <TouchableOpacity onPress={() => setCommentModalVisible(false)}>
                <Ionicons name="close" size={24} color="#ff6b8b" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.commentInput}
              placeholder="Write your sweet comment..."
              value={newComment}
              onChangeText={setNewComment}
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity
              style={styles.submitCommentButton}
              onPress={submitComment}
            >
              <Text style={styles.submitCommentText}>Post Comment</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fffafafa",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ff6b8b",
    padding: 15,
    paddingTop: Platform.OS === "ios" ? 50 : 35,
  },
  headerTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  refreshButton: {
    padding: 5,
    marginRight: 15,
  },
  logoutButton: {
    padding: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#ff6b8b",
    fontSize: 16,
  },
  entriesContainer: {
    padding: 10,
    paddingBottom: 200,
  },
  inputContainer: {
    position: "absolute",
    bottom: 0, // Changed from 0 to 50 to move it up from the very
    paddingBottom: 50, // Changed from 0 to 20 to move it up from the very bottom
    left: 0, // Added left and right padding
    right: 0,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#ffd1dc",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 }, // Shadow above the container
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  textInputContainer: {
    flexDirection: "row",
    padding: 10,
    alignItems: "center",
  },
  textInput: {
    flex: 1,
    backgroundColor: "#fff0f5",
    padding: 12,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#ffd1dc",
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: "#ff6b8b",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ff6b8b",
  },
  commentInput: {
    borderWidth: 1,
    borderColor: "#ffd1dc",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    minHeight: 100,
    textAlignVertical: "top",
  },
  submitCommentButton: {
    backgroundColor: "#ff6b8b",
    padding: 15,
    borderRadius: 25,
    alignItems: "center",
  },
  submitCommentText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default JournalScreen;
