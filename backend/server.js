const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const ort = require("onnxruntime-node");
const fs = require("fs");
const path = require("path");

const app = express();
const upload = multer({ dest: "uploads/" });

let session;

// Load ONNX Model
async function loadModel() {
  try {
    session = await ort.InferenceSession.create(
      path.join(__dirname, "YOLOv8_Small_RDD.onnx")
    );
    console.log("✅ ONNX Model Loaded Successfully!");
  } catch (error) {
    console.error("❌ Error Loading ONNX Model:", error);
  }
}
loadModel();

// Preprocess Image for ONNX Model
async function preprocessImage(imagePath) {
  const image = sharp(imagePath);
  const metadata = await image.metadata();

  // Calculate scaling and padding
  const targetSize = 640;
  const scale = Math.min(
    targetSize / metadata.width,
    targetSize / metadata.height
  );
  
  const scaledWidth = Math.round(metadata.width * scale);
  const scaledHeight = Math.round(metadata.height * scale);
  
  const offsetX = (targetSize - scaledWidth) / 2;
  const offsetY = (targetSize - scaledHeight) / 2;

  // Process image with padding
  const { data } = await image
    .resize(scaledWidth, scaledHeight)
    .extend({
      top: Math.floor(offsetY),
      bottom: Math.ceil(offsetY),
      left: Math.floor(offsetX),
      right: Math.ceil(offsetX),
      background: { r: 0, g: 0, b: 0, alpha: 1 }
    })

  // Convert image buffer to Float32Array and normalize pixel values (0-1)
  const float32Array = new Float32Array(data.length);
  for (let i = 0; i < data.length; i++) {
    float32Array[i] = data[i] / 255.0;
  }

  return {
    tensor: new ort.Tensor("float32", float32Array, [1, 3, 640, 640]),
    scale,
    offsetX,
    offsetY,
    originalWidth: metadata.width,
    originalHeight: metadata.height
  };
}

// Prediction Route
app.post("/predict", upload.single("image"), async (req, res) => {
  try {
    const { tensor, scale, offsetX, offsetY, originalWidth, originalHeight } = 
      await preprocessImage(req.file.path);

    // const imageTensor = await preprocessImage(req.file.path);
    const results = await session.run({ images: imageTensor });

    // Extract relevant detection info
    const rawData = results.output0.cpuData;
    const detections = [];

    // Loop through the data in chunks of 8 (assuming each detection has 8 values)
    for (let i = 0; i < rawData.length; i += 8) {
      const [x, y, width, height, confidence, classId] = rawData.slice(
        i,
        i + 8
      );

      // Only keep detections with high confidence (e.g., > 0.5)
      if (confidence > 0.9) {
        detections.push({ x, y, width, height, confidence, classId });
      }
    }

    const adjustedDetections = rawDetections.map(detection => ({
      x: (detection.x - offsetX) / scale,
      y: (detection.y - offsetY) / scale,
      width: detection.width / scale,
      height: detection.height / scale,
      confidence: detection.confidence,
      classId: detection.classId
    }));

    // Send filtered detections
    res.json({
      detections: adjustedDetections,
      originalWidth,
      originalHeight
    });
    console.log(detections);
  } catch (error) {
    console.error("❌ Prediction Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(5000, () => console.log("🚀 Server running on port 5000"));
