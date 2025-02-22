import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import axios from "axios";

// Define a type for a detection object
type Detection = {
  _id: string;
  imageUrl: string;
  status: string;
};

const DetectionListScreen = () => {
  const { status } = useLocalSearchParams();
  const [detections, setDetections] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null); // Track selected image

  useEffect(() => {
    fetchDetections();
  }, [status]);

  const fetchDetections = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://192.168.1.12:5000/all");
      setDetections(
        response.data.detections.filter((d: Detection) => d.status === status)
      );
    } catch (error) {
      Alert.alert("Error", "Failed to fetch detections");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text
        style={{
          fontSize: 20,
          fontWeight: "bold",
          textAlign: "center",
          marginBottom: 10,
        }}
      >
        {typeof status === "string" ? status.toUpperCase() : "UNKNOWN"}{" "}
        Detections
      </Text>

      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <FlatList
          data={detections}
          keyExtractor={(item) => item._id}
          numColumns={1}
          renderItem={({ item }) => {
            const imageUrl = item.imageUrl.replace("localhost", "192.168.1.12");
            return (
              <TouchableOpacity onPress={() => setSelectedImage(imageUrl)}>
                <View style={{ flex: 1, padding: 5, alignItems: "center" }}>
                  <Image
                    source={{ uri: imageUrl }}
                    style={{ width: "100%", height: 150, borderRadius: 5 }}
                  />
                  <Text style={{ marginTop: 5, fontWeight: "bold" }}>
                    {item.status.toUpperCase()}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Full-Screen Image Modal */}
      <Modal visible={!!selectedImage} transparent={true} animationType="fade">
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.9)",
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => setSelectedImage(null)} // Close modal when tapped
          activeOpacity={1}
        >
          {selectedImage && ( // Ensure the image is not null before rendering
            <Image
              source={{ uri: selectedImage }}
              style={{
                width: "90%",
                height: "90%",
                resizeMode: "contain",
              }}
            />
          )}
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default DetectionListScreen;
