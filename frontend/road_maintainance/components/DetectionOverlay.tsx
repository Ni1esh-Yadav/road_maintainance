import React from "react";
import { View, StyleSheet } from "react-native";

interface Detection {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Props {
  detections: Detection[];
  imageWidth: number;
  imageHeight: number;
  originalWidth: number;
  originalHeight: number;
  style?: any;
}

const DetectionOverlay: React.FC<Props> = ({
  detections,
  imageWidth,
  imageHeight,
  originalWidth,
  originalHeight,
  style,
}) => {
  if (!originalWidth || !originalHeight) return null;

  const scaleX = imageWidth / originalWidth;
  const scaleY = imageHeight / originalHeight;

  return (
    <View style={[styles.container, style]}>
      {detections.map((detection, index) => (
        <View
          key={`detection-${index}`}
          style={[
            styles.box,
            {
              left: detection.x * scaleX,
              top: detection.y * scaleY,
              width: detection.width * scaleX,
              height: detection.height * scaleY,
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
  },
  box: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "#FF0000",
    backgroundColor: "rgba(255,0,0,0.2)",
    zIndex: 1,
  },
});

export default DetectionOverlay;
