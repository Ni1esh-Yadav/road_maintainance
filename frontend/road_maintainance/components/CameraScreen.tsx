import React, { useRef, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Text,
  Image,
  Dimensions,
} from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import * as FileSystem from "expo-file-system";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useLocalSearchParams } from "expo-router";
import { useUser } from "../app/context/UserContext";

const CameraScreen = () => {
  const cameraRef = useRef<CameraView | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const router = useRouter();
  const { user, setUser } = useUser();
  console.log("i am inside CameraScreen", user);

  // Request Camera Permission
  useEffect(() => {
    (async () => {
      if (!permission?.granted) {
        const newPermission = await requestPermission();
        if (!newPermission.granted) {
          Alert.alert("Camera permission required");
        }
      }
    })();
  }, []);

  // Capture Image
  const takePicture = async () => {
    if (!cameraRef.current || isProcessing) return;

    try {
      setIsProcessing(true);
      setNetworkError(null);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });

      if (!photo || !photo.uri) {
        throw new Error("Failed to capture photo");
      }

      setPhotoUri(photo.uri);

      await sendToBackend(photo.uri);
    } catch (error) {
      Alert.alert("Error", "Failed to capture and process the image.");
      console.error("Camera capture error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Send Image to Backend
  const sendToBackend = async (uri: string) => {
    try {
      const formData = new FormData();
      formData.append("image", {
        uri,
        name: "photo.jpg",
        type: "image/jpeg",
      } as any);

      if (!user || !user.id) {
        throw new Error("User ID is missing");
      }
      formData.append("userId", user?.id);

      const response = await fetch("http://192.168.1.12:5000/predict", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      router.push({
        pathname: "./home",
        params: { imageUri: data.imageUrl },
      });
      console.log("Server Response:", data);
    } catch (error) {
      setNetworkError("Failed to send image to server.");
      console.error("Backend error:", error);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back" />

      {photoUri && (
        <Image source={{ uri: photoUri }} style={styles.previewImage} />
      )}

      <TouchableOpacity
        style={[styles.captureButton, isProcessing && styles.disabledButton]}
        onPress={takePicture}
        disabled={isProcessing}
      >
        <Text style={styles.buttonText}>
          {isProcessing ? "Processing..." : "Capture"}
        </Text>
      </TouchableOpacity>

      {networkError && <Text style={styles.errorText}>{networkError}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  previewImage: {
    width: "100%",
    height: 300,
    marginTop: 10,
  },
  captureButton: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    backgroundColor: "red",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  disabledButton: {
    backgroundColor: "gray",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 10,
  },
});

export default CameraScreen;
