import React, { useState, useEffect } from "react";
import {
  View,
  FlatList,
  Image,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import * as FileSystem from "expo-file-system";
import DetectionOverlay from "./DetectionOverlay";

interface HistoryItem {
  id: string;
  imageUrl: string;
  detections: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    confidence: number;
    classId: number;
  }>;
  originalWidth: number;
  originalHeight: number;
  timestamp: string;
  address: string;
}

const HistoryScreen = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [imageDimensions, setImageDimensions] = useState<{
    [key: string]: { width: number; height: number };
  }>({});
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    try {
      const fileUri = FileSystem.documentDirectory + "history.json";
      const content = await FileSystem.readAsStringAsync(fileUri);

      const parsedData = JSON.parse(content);
      setHistory(parsedData);

      console.log("Full History Data:", parsedData);

      // parsedData.forEach((entry: any, index: number) => {
      //   console.log(`Entry ${index}:`);
      //   console.log(`ID: ${entry.id}`);
      //   console.log(`Image URL: ${entry.imageUrl}`);
      //   console.log(
      //     `Original Dimensions: ${entry.originalWidth}x${entry.originalHeight}`
      //   );
      //   console.log(
      //     `Detections (${entry.detections.length}):`,
      //     entry.detections
      //   );
      // });
    } catch (error) {
      console.error("History load failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageLoad = (item: HistoryItem) => async () => {
    if (imageDimensions[item.id]) return;
    // console.log("i am inside handleImageLoad", item.imageUrl);

    Image.getSize(
      item.imageUrl,
      (width, height) => {
        setImageDimensions((prev) => ({
          ...prev,
          [item.id]: { width, height },
        }));
      },
      (error) => console.error("Image size error:", error)
    );
  };

  useEffect(() => {
    loadHistory();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <FlatList
      data={history}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text>No detection history found</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.item}>
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.image}
              onLoad={handleImageLoad(item)}
              onError={(e) =>
                console.log("Image load error:", e.nativeEvent.error)
              }
              resizeMode="contain"
            />

            {imageDimensions[item.id] ? (
              <DetectionOverlay
                detections={item.detections}
                imageWidth={imageDimensions[item.id].width}
                imageHeight={imageDimensions[item.id].height}
                originalWidth={item.originalWidth}
                originalHeight={item.originalHeight}
                style={styles.overlay}
              />
            ) : null}
          </View>

          <View style={styles.details}>
            <Text style={styles.detailText}>
              Detections: {item.detections.length}
            </Text>
            <Text style={styles.detailText}>
              Date: {new Date(item.timestamp).toLocaleDateString()}
            </Text>
            {item.address && (
              <Text style={styles.detailText}>Location: {item.address}</Text>
            )}
          </View>
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
  item: {
    marginBottom: 20,
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: "hidden",
    elevation: 3,
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: undefined,
    aspectRatio: 1,
    backgroundColor: "#f0f0f0",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  details: {
    padding: 12,
  },
  detailText: {
    fontSize: 14,
    marginVertical: 2,
    color: "#333",
  },
});

export default HistoryScreen;
