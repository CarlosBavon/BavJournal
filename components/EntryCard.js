import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Video, ResizeMode, Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";

const EntryCard = ({
  entry,
  onLike,
  onComment,
  onDelete,
  onCommentDelete,
  currentUserId,
  currentUser,
}) => {
  const [isLiking, setIsLiking] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioPosition, setAudioPosition] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const videoRef = useRef(null);
  const soundRef = useRef(null);

  const isLiked = entry.likes.includes(currentUserId);
  const isOwner = entry.userId._id === currentUserId;

  useEffect(() => {
    // Clean up audio when component unmounts
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const handleLike = async () => {
    if (isLiking) return;

    setIsLiking(true);
    try {
      await onLike(entry._id);
    } catch (error) {
      Alert.alert("Error", "Failed to like entry");
    }
    setIsLiking(false);
  };

  const handleDelete = () => {
    Alert.alert("Delete Entry", "Are you sure you want to delete this entry?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => onDelete(entry._id),
      },
    ]);
  };

  const handleCommentDelete = (commentId) => {
    Alert.alert(
      "Delete Comment",
      "Are you sure you want to delete this comment?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onCommentDelete(entry._id, commentId),
        },
      ]
    );
  };

  const handleSaveMedia = async () => {
    if (entry.type === "text") return;

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Please allow media library access to save files"
        );
        return;
      }

      const fileUri =
        FileSystem.documentDirectory + entry.content.split("/").pop();

      // Download file
      const { uri } = await FileSystem.downloadAsync(
        `http://192.168.100.27:5000${entry.content}`,
        fileUri
      );

      // Save to media library
      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync("CoupleJournal", asset, false);

      Alert.alert("Success", "Media saved to your gallery!");
    } catch (error) {
      Alert.alert("Error", "Failed to save media");
    }
  };

  const toggleVideoPlayback = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleAudioPlayback = async () => {
    try {
      if (soundRef.current) {
        const status = await soundRef.current.getStatusAsync();

        if (status.isLoaded) {
          if (status.isPlaying) {
            await soundRef.current.pauseAsync();
            setIsAudioPlaying(false);
          } else {
            await soundRef.current.playAsync();
            setIsAudioPlaying(true);
          }
        }
      } else {
        // Load and play the audio for the first time
        const { sound } = await Audio.Sound.createAsync(
          { uri: `http://192.168.100.27:5000${entry.content}` },
          { shouldPlay: true }
        );

        soundRef.current = sound;

        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded) {
            setAudioPosition(status.positionMillis);
            setAudioDuration(status.durationMillis);

            if (status.didJustFinish) {
              setIsAudioPlaying(false);
              setAudioPosition(0);
            }
          }
        });

        await sound.playAsync();
        setIsAudioPlaying(true);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to play audio");
    }
  };

  const handleVideoEnd = async () => {
    setIsPlaying(false);
    // Reset video to beginning
    if (videoRef.current) {
      await videoRef.current.setPositionAsync(0);
    }
  };

  const formatTime = (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  const renderContent = () => {
    switch (entry.type) {
      case "text":
        return <Text style={styles.entryText}>{entry.content}</Text>;

      case "image":
        return (
          <View>
            <Image
              source={{ uri: `http://192.168.100.27:5000${entry.content}` }}
              style={styles.entryImage}
              resizeMode="cover"
            />
            <TouchableOpacity
              style={styles.downloadButton}
              onPress={handleSaveMedia}
            >
              <Ionicons name="download" size={20} color="white" />
            </TouchableOpacity>
          </View>
        );

      case "video":
        return (
          <View style={styles.videoContainer}>
            <Video
              ref={videoRef}
              source={{ uri: `http://192.168.100.27:5000${entry.content}` }}
              style={styles.video}
              resizeMode={ResizeMode.CONTAIN}
              isLooping={false}
              onPlaybackStatusUpdate={(status) => {
                if (status.isLoaded) {
                  setIsPlaying(status.isPlaying);
                  if (status.didJustFinish) {
                    handleVideoEnd();
                  }
                }
              }}
            />
            <TouchableOpacity
              style={styles.playButton}
              onPress={toggleVideoPlayback}
            >
              <Ionicons
                name={isPlaying ? "pause" : "play"}
                size={30}
                color="white"
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.downloadButton}
              onPress={handleSaveMedia}
            >
              <Ionicons name="download" size={20} color="white" />
            </TouchableOpacity>

            {/* Replay button that appears when video ends */}
            {!isPlaying && audioPosition > 0 && (
              <TouchableOpacity
                style={styles.replayButton}
                onPress={toggleVideoPlayback}
              >
                <Ionicons name="refresh" size={24} color="white" />
              </TouchableOpacity>
            )}
          </View>
        );

      case "voice":
        return (
          <View style={styles.audioContainer}>
            <TouchableOpacity
              onPress={toggleAudioPlayback}
              style={styles.audioPlayButton}
            >
              <Ionicons
                name={isAudioPlaying ? "pause-circle" : "play-circle"}
                size={36}
                color="#ff6b8b"
              />
            </TouchableOpacity>

            <View style={styles.audioProgressContainer}>
              <View style={styles.audioProgressBar}>
                <View
                  style={[
                    styles.audioProgress,
                    { width: `${(audioPosition / audioDuration) * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.audioTime}>
                {formatTime(audioPosition)} / {formatTime(audioDuration)}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.downloadButton}
              onPress={handleSaveMedia}
            >
              <Ionicons name="download" size={20} color="white" />
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.userName}>{entry.userId.displayName}</Text>
          <Text style={styles.timestamp}>
            {new Date(entry.timestamp).toLocaleString()}
          </Text>
        </View>

        {isOwner && (
          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
            <Ionicons name="trash" size={20} color="#ff6b8b" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>{renderContent()}</View>

      <View style={styles.actions}>
        <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
          <Ionicons
            name={isLiked ? "heart" : "heart-outline"}
            size={24}
            color={isLiked ? "#ff6b8b" : "#666"}
          />
          <Text style={styles.actionText}>{entry.likes.length}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onComment(entry)}
          style={styles.actionButton}
        >
          <Ionicons name="chatbubble-outline" size={24} color="#666" />
          <Text style={styles.actionText}>{entry.comments.length}</Text>
        </TouchableOpacity>
      </View>

      {entry.comments.length > 0 && (
        <View style={styles.comments}>
          {entry.comments.map((comment, index) => (
            <View key={index} style={styles.comment}>
              <View style={styles.commentHeader}>
                <Text style={styles.commentUser}>
                  {comment.userId.displayName}:
                </Text>
                {(comment.userId._id === currentUserId || isOwner) && (
                  <TouchableOpacity
                    onPress={() => handleCommentDelete(comment._id)}
                    style={styles.deleteCommentButton}
                  >
                    <Ionicons name="close-circle" size={16} color="#ff6b8b" />
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.commentText}>{comment.text}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  userName: {
    fontWeight: "bold",
    color: "#ff6b8b",
  },
  timestamp: {
    fontSize: 12,
    color: "#999",
  },
  deleteButton: {
    padding: 5,
  },
  content: {
    marginBottom: 15,
  },
  entryText: {
    fontSize: 16,
    lineHeight: 22,
    color: "#333",
  },
  entryImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
  },
  videoContainer: {
    position: "relative",
    width: "100%",
    height: 200,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  playButton: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -30 }, { translateY: -30 }],
    backgroundColor: "rgba(255, 107, 139, 0.3)",
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  replayButton: {
    position: "absolute",
    top: 10,
    right: 50,
    backgroundColor: "rgba(255, 107, 139, 0.7)",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  audioContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#fff0f5",
    borderRadius: 10,
  },
  audioPlayButton: {
    marginRight: 15,
  },
  audioProgressContainer: {
    flex: 1,
    marginRight: 15,
  },
  audioProgressBar: {
    height: 4,
    backgroundColor: "#ffd1dc",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 5,
  },
  audioProgress: {
    height: "100%",
    backgroundColor: "#ff6b8b",
  },
  audioTime: {
    fontSize: 12,
    color: "#ff6b8b",
  },
  downloadButton: {
    backgroundColor: "rgba(255, 107, 139, 0.8)",
    padding: 8,
    width: 35,
    height: 35,
    borderRadius: 17.5,
    marginTop: 5,
  },
  actions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 10,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  actionText: {
    marginLeft: 5,
    color: "#666",
  },
  comments: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 10,
  },
  comment: {
    marginBottom: 8,
    padding: 10,
    backgroundColor: "#fffafafa",
    borderRadius: 8,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  commentUser: {
    fontWeight: "bold",
    color: "#ff6b8b",
  },
  deleteCommentButton: {
    padding: 2,
  },
  commentText: {
    color: "#333",
  },
});

export default EntryCard;
