import React from "react";
import { View } from "react-native";

interface Detection {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface BoundingBoxProps {
  detections: Detection[];
  imageWidth: number;
  imageHeight: number;
  originalWidth: number;
  originalHeight: number;
}

const BoundingBoxes: React.FC<BoundingBoxProps> = ({
  detections,
  imageWidth,
  imageHeight,
  originalWidth,
  originalHeight,
}) => {
  return (
    <>
      {detections.map((detection, index) => {
        // Normalize values if they are absolute pixel values
        let normX = detection.x > 1 ? detection.x / originalWidth : detection.x;
        let normY =
          detection.y > 1 ? detection.y / originalHeight : detection.y;
        let normWidth =
          detection.width > 1
            ? detection.width / originalWidth
            : detection.width;
        let normHeight =
          detection.height > 1
            ? detection.height / originalHeight
            : detection.height;

        // Apply scaling
        let boxWidth = normWidth * imageWidth;
        let boxHeight = normHeight * imageHeight;
        let left = normX * imageWidth - boxWidth / 2; // Adjust if YOLO format
        let top = normY * imageHeight - boxHeight / 2; // Adjust if YOLO format

        console.log(`Detection ${index}:`, {
          original: detection,
          normalized: { normX, normY, normWidth, normHeight },
          scaled: { left, top, boxWidth, boxHeight },
        });

        return (
          <View
            key={`detection-${index}`}
            style={{
              position: "absolute",
              borderColor: "red",
              borderWidth: 2,
              left,
              top,
              width: boxWidth,
              height: boxHeight,
            }}
          />
        );
      })}
    </>
  );
};

export default BoundingBoxes;
