import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  Image,
  Text,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from "react-native";

interface Detection {
  _id: string; // MongoDB id field
  imageUrl: string;
  detections: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    confidence: number;
    classId: number;
    _id: string;
  }>;
  originalWidth: number;
  originalHeight: number;
  createdAt: string;
}

const DetectionsScreen = ({ userId }: { userId: string }) => {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log("Inside DetectionsScreen, userId:", userId);

  useEffect(() => {
    if (!userId) {
      setError("User ID is missing.");
      setLoading(false);
      return;
    }

    const fetchDetections = async () => {
      try {
        console.log("Fetching detections for user:", userId);
        const response = await fetch(
          `http://192.168.24.213:5000/detections/${userId}`
        );
        const data = await response.json();
        console.log("Fetched detections:", data);

        if (!data.success) {
          throw new Error("Failed to fetch detections.");
        }

        // Update image URLs to use the correct IP address
        const updatedDetections = data.detections.map(
          (detection: Detection) => ({
            ...detection,
            imageUrl: detection.imageUrl.replace("localhost", "192.168.1.12"),
            // imageUrl: detection.imageUrl.replace("localhost", "192.168.24.213"),
          })
        );

        setDetections(updatedDetections);
      } catch (err) {
        setError("Error fetching detections.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetections();
  }, [userId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="blue" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (detections.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No detections found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={detections}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        numColumns={1} // Set the number of columns for the grid layout
        renderItem={({ item }) => (
          <View style={styles.tableCell}>
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.image}
              onError={(e) =>
                console.error("Error loading image:", e.nativeEvent.error)
              }
              onLoad={() =>
                console.log("Image loaded successfully:", item.imageUrl)
              }
            />
            <View style={styles.details}>
              <Text style={styles.detailText}>
                📅 Date: {new Date(item.createdAt).toLocaleDateString()}
              </Text>
              <Text style={styles.detailText}>
                🔍 Detections: {item.detections.length}
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { color: "red", fontSize: 16 },
  listContainer: { paddingBottom: 20 },
  tableCell: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    padding: 10,
    borderRadius: 8,
    margin: 5,
    alignItems: "center",
    elevation: 2,
  },
  image: {
    width: width * 0.9, // Adjust the width to fit the grid layout
    height: width * 0.9, // Adjust the height to fit the grid layout
    borderRadius: 8,
  },
  details: {
    marginTop: 8,
    alignItems: "center",
  },
  detailText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    marginTop: 20,
  },
});

export default DetectionsScreen;
