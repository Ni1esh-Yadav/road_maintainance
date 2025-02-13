import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, Alert, Image, Text } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import {
  TouchableOpacity,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import * as FileSystem from "expo-file-system";
import * as Location from "expo-location";

const CameraScreen = () => {
  const cameraRef = useRef<CameraView | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  
  useEffect(() => {
    (async () => {
      if (!permission) return;
      if (!permission.granted) {
        const newPermission = await requestPermission();
        if (!newPermission.granted) {
          Alert.alert(
            "Camera Permission Required",
            "Please allow camera access."
          );
        }
      }
    })();
    if (photoUri){
      setTimeout(()=>{
        console.log("Rendering image with URI :" ,photoUri);
      },1000);
      }
  }, [permission,photoUri]);

  const takePicture = async () => {
    if (!cameraRef.current) return;

    const photo = await cameraRef.current.takePictureAsync(); // ✅ Correct method
    if (!photo?.uri) return;

   setPhotoUri(photo.uri);
   console.log("Photo taken with URI:", photo.uri);

    const imagePath = `${FileSystem.cacheDirectory}photo.jpg`;

    await FileSystem.moveAsync({
      from: photo.uri,
      to: imagePath,
    });

    getUserAddress(); // Fetch location and address
    await sendToBackend(imagePath);
  };

  const getUserAddress = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location access is required.");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (reverseGeocode.length > 0) {
        const addr = reverseGeocode[0];
        setAddress(
          `${addr.name}, ${addr.street}, ${addr.city}, ${addr.country}`
        );
      } else {
        setAddress("Unable to fetch address");
      }
    } catch (error) {
      console.error("Error getting location:", error);
    }
  };

  const sendToBackend = async (imageUri: string) => {
    try {
      const formData = new FormData();
      formData.append("image", {
        uri: imageUri,
        name: "photo.jpg",
        type: "image/jpeg",
      } as any);

      const response = await fetch("http://192.168.24.244:5000/predict", {
        method: "POST",
        headers: {
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to send image.");
      console.log("Image successfully sent!");
    } catch (error) {
      console.error("Error sending image:", error);
      Alert.alert("Upload Failed", "Could not send the image.");
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back" />

        <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
          <View style={styles.captureInner} />
        </TouchableOpacity>

        {photoUri && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: photoUri }} style={styles.image} />
            <Text style={styles.addressText}>
              {address || "Fetching address..."}
            </Text>
          </View>
        )}
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  captureButton: {
    position: "absolute",
    bottom: 50,
    alignSelf: "center",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  captureInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "red",
  },
  imageContainer: {
    position: "absolute",
    bottom: 150,
    alignSelf: "center",
    alignItems: "center",
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
  addressText: {
    marginTop: 10,
    color: "white",
    fontSize: 16,
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 5,
    borderRadius: 5,
  },
});

export default CameraScreen;
