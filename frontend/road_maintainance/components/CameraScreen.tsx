import React, { useRef, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Text,
  Image,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as FileSystem from "expo-file-system";
import { useRouter } from "expo-router";
import { useUser } from "../app/context/UserContext";
import * as ImageManipulator from "expo-image-manipulator";

const CameraScreen = () => {
  const cameraRef = useRef<CameraView | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useUser();

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

      // Capture the photo
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });

      if (!photo || !photo.uri) {
        throw new Error("Failed to capture photo");
      }

      // Resize the image to your desired "original" dimensions
      const manipulatedPhoto = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 612, height: 408 } }],
        { compress: 0.8, base64: true }
      );

      // Optionally, if you need to apply an additional scale (e.g., to get 640×427)
      const finalPhoto = await ImageManipulator.manipulateAsync(
        manipulatedPhoto.uri,
        [{ resize: { width: 640, height: 427 } }],
        { compress: 0.8, base64: true }
      );

      // Update the preview with the final image URI
      setPhotoUri(finalPhoto.uri);

      // Send the final image to the backend
      await sendToBackend(finalPhoto.uri);
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
      formData.append("userId", user.id);

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
