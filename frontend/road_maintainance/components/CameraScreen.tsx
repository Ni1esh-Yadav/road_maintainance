import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Text,
  Image,
  Dimensions,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import * as FileSystem from "expo-file-system";
import * as Location from "expo-location";
import DetectionOverlay from "./DetectionOverlay";

// Interface definitions
interface Detection {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  classId: number;
}

interface ServerResponse {
  imageUrl: string;
  detections: Detection[];
  originalWidth: number;
  originalHeight: number;
}

interface HistoryItem {
  id: string;
  imageUrl: string;
  detections: Detection[];
  originalWidth: number;
  originalHeight: number;
  timestamp: string;
  address: string;
}

// Type guards
const isAbortError = (error: unknown): error is { name: string } => {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "AbortError"
  );
};

const isErrorWithMessage = (error: unknown): error is { message: string } => {
  return typeof error === "object" && error !== null && "message" in error;
};

const CameraScreen = () => {
  const cameraRef = useRef<CameraView>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [address, setAddress] = useState<string>("");
  const [permission, requestPermission] = useCameraPermissions();
  const router = useRouter();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [serverResponse, setServerResponse] = useState<ServerResponse | null>(
    null
  );

  // Camera Permission Handling
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

  // Location Handling
  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: 10,
        timeInterval: 5000,
      });

      const [reverseGeocode] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      setAddress(
        `${reverseGeocode?.street || "Unknown"}, ${
          reverseGeocode?.city || "Location"
        }`
      );
    } catch (error) {
      console.warn("Location error:", error);
      setAddress("Location unavailable");
    }
  };

  // Photo Capture Flow
  const takePicture = async () => {
    if (!cameraRef.current || isProcessing) return;
    setIsProcessing(true);
    setNetworkError(null);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: true,
      });

      if (!photo?.uri) throw new Error("Failed to capture photo");
      setPhotoUri(photo.uri);

      await getLocation();
      const response = await sendToBackend(photo.uri);

      if (response.detections.length === 0) {
        Alert.alert("No Damage Found", "No damages detected in this image");
        return;
      }

      setServerResponse(response);
      setDetections(response.detections);
      await saveDetectionResult(response);
    } catch (error) {
      const errorMessage = isErrorWithMessage(error)
        ? error.message.includes("network")
          ? "Network error - check server connection"
          : error.message
        : "Failed to process image";

      Alert.alert("Processing Error", errorMessage);
      console.error("Processing pipeline failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Network operations
  const sendToBackend = async (uri: string): Promise<ServerResponse> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      let fileUri = uri;

      // Convert Android content:// URI to file:// URI
      if (uri.startsWith("content://")) {
        fileUri = await FileSystem.getContentUriAsync(uri);
      }

      if (!fileUri.startsWith("file://")) {
        fileUri = `file://${fileUri}`;
      }

      const formData = new FormData();
      formData.append("image", {
        uri: fileUri,
        name: "photo.jpg",
        type: "image/jpeg",
      } as any);

      const response = await fetch("http://192.168.1.12:5000/predict", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorBody}`);
      }

      const data: ServerResponse = await response.json();

      if (!data.imageUrl || !data.detections) {
        throw new Error("Invalid server response format");
      }

      await getImageSizeWithRetry(data.imageUrl);
      return data;
    } catch (error) {
      if (isAbortError(error)) {
        throw new Error("Request timed out (15s)");
      }
      if (isErrorWithMessage(error)) {
        throw new Error(`Network error: ${error.message}`);
      }
      throw new Error("Unknown network error occurred");
    }
  };

  // Image verification
  const getImageSizeWithRetry = async (
    uri: string,
    retries = 3,
    delay = 500
  ) => {
    try {
      // Transform server-relative paths
      if (uri.startsWith("/results")) {
        uri = `http://192.168.1.12:5000${uri}`;
      }

      // Handle Android content URIs
      if (uri.startsWith("content://")) {
        uri = await FileSystem.getContentUriAsync(uri);
      }

      // Validate final URI
      if (!uri.startsWith("http") && !uri.startsWith("file://")) {
        throw new Error(`Invalid URI scheme: ${uri}`);
      }

      // Add cache buster
      const finalUri =
        uri + (uri.includes("?") ? "&" : "?") + `t=${Date.now()}`;

      return await new Promise((resolve, reject) => {
        Image.getSize(
          finalUri,
          (width, height) => resolve({ width, height }),
          (error) => reject(new Error(`Image load failed: ${error}`))
        );
      });
    } catch (error) {
      if (retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        return getImageSizeWithRetry(uri, retries - 1, delay * 2);
      }
      throw error;
    }
  };

  // History saving
  const saveDetectionResult = async (serverResponse: ServerResponse) => {
    try {
      const newItem: HistoryItem = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        imageUrl: serverResponse.imageUrl,
        detections: serverResponse.detections,
        originalWidth: serverResponse.originalWidth,
        originalHeight: serverResponse.originalHeight,
        timestamp: new Date().toISOString(),
        address,
      };

      setHistory((prev) => {
        const newHistory = [newItem, ...prev.slice(0, 49)];
        FileSystem.writeAsStringAsync(
          FileSystem.documentDirectory + "history.json",
          JSON.stringify(newHistory)
        ).catch((error) => console.error("Storage error:", error));
        return newHistory;
      });

      router.push({
        pathname: "/history",
        params: { refresh: Date.now() },
      });
    } catch (error) {
      Alert.alert("Storage Error", "Failed to save detection history");
      console.error("History save failed:", error);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera}>
        {photoUri && (
          <View style={styles.previewContainer}>
            <Image
              source={{ uri: photoUri }}
              style={styles.previewImage}
              resizeMode="cover"
              onError={() => console.log("Preview image load error")}
            />
            {serverResponse && (
              <DetectionOverlay
                detections={detections}
                imageWidth={Dimensions.get("window").width}
                imageHeight={Dimensions.get("window").height}
                originalWidth={serverResponse.originalWidth}
                originalHeight={serverResponse.originalHeight}
              />
            )}
          </View>
        )}
      </CameraView>

      <TouchableOpacity
        style={[styles.captureButton, isProcessing && styles.disabledButton]}
        onPress={takePicture}
        disabled={isProcessing}
      >
        <Text style={styles.buttonText}>
          {isProcessing ? "Analyzing..." : "Capture Damage"}
        </Text>
      </TouchableOpacity>

      {networkError && <Text style={styles.errorText}>{networkError}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  previewContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "black",
  },
  previewImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  captureButton: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    backgroundColor: "rgba(255,0,0,0.8)",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: "rgba(100,100,100,0.6)",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  errorText: {
    position: "absolute",
    top: 50,
    alignSelf: "center",
    color: "red",
    backgroundColor: "rgba(255,255,255,0.9)",
    padding: 10,
    borderRadius: 5,
  },
});

export default CameraScreen;
