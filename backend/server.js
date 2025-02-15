const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const ort = require("onnxruntime-node");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const app = express();
const upload = multer({ dest: "uploads/" });
const targetSize = 640; // YOLOv8 input size
const resultsDir = path.join(__dirname, "results");

// Create directories if they don't exist
if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

// Load ONNX model
let session;
(async () => {
  try {
    session = await ort.InferenceSession.create(
      path.join(__dirname, "YOLOv8_Small_RDD.onnx")
    );
    console.log("✅ Model loaded successfully");
  } catch (e) {
    console.error("❌ Failed to load model:", e);
    process.exit(1);
  }
})();

// Middleware
app.use(express.json());
app.use("/results", express.static(resultsDir));

async function preprocessImage(imagePath) {
  const metadata = await sharp(imagePath).metadata();
  const originalWidth = metadata.width;
  const originalHeight = metadata.height;

  const scale = Math.min(
    targetSize / originalWidth,
    targetSize / originalHeight
  );
  const scaledWidth = Math.round(originalWidth * scale);
  const scaledHeight = Math.round(originalHeight * scale);

  // Resize and convert to raw RGB format
  const rawBuffer = await sharp(imagePath)
    .resize(scaledWidth, scaledHeight)
    .extend({
      top: Math.round((targetSize - scaledHeight) / 2),
      bottom:
        targetSize - scaledHeight - Math.round((targetSize - scaledHeight) / 2),
      left: Math.round((targetSize - scaledWidth) / 2),
      right:
        targetSize - scaledWidth - Math.round((targetSize - scaledWidth) / 2),
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    })
    .removeAlpha()
    .raw()
    .toBuffer();

  // Convert raw RGB buffer to Float32Array (normalize to [0,1] for ONNX input)
  const float32Data = new Float32Array(rawBuffer.length);
  for (let i = 0; i < rawBuffer.length; i++) {
    float32Data[i] = rawBuffer[i] / 255.0;
  }

  return {
    buffer: float32Data,
    originalWidth,
    originalHeight,
    scale,
    offsetX: Math.round((targetSize - scaledWidth) / 2),
    offsetY: Math.round((targetSize - scaledHeight) / 2),
  };
}

// Detection processing
function processDetections(
  output,
  originalWidth,
  originalHeight,
  scale,
  offsetX,
  offsetY
) {
  const detections = [];
  const rawData = Array.from(output.data);

  for (let i = 0; i < rawData.length; i += 6) {
    const [x_center, y_center, width, height, confidence, classId] =
      rawData.slice(i, i + 6);

    if (confidence > 0.5) {
      // Adjust coordinates for letterboxing and scale
      const x = (((x_center - offsetX) / targetSize) * originalWidth) / scale;
      const y = (((y_center - offsetY) / targetSize) * originalHeight) / scale;
      const w = ((width / targetSize) * originalWidth) / scale;
      const h = ((height / targetSize) * originalHeight) / scale;

      detections.push({
        x: Math.max(0, x - w / 2),
        y: Math.max(0, y - h / 2),
        width: w,
        height: h,
        confidence,
        classId,
      });
    }
  }
  return detections;
}

// Main prediction endpoint
app.post("/predict", upload.single("image"), async (req, res) => {
  try {
    const { buffer, originalWidth, originalHeight, scale, offsetX, offsetY } =
      await preprocessImage(req.file.path);

    // Create tensor and run inference
    const tensor = new ort.Tensor("float32", new Float32Array(buffer), [
      1,
      3,
      targetSize,
      targetSize,
    ]);

    const outputs = await session.run({ images: tensor });
    console.log("ONNX Model Outputs:", outputs);

    const output = outputs[Object.keys(outputs)[0]]; // Extract first output tensor
    if (!output || !output.data) {
      throw new Error("Model did not return valid output");
    }

    // Process detections
    const detections = processDetections(
      output,
      originalWidth,
      originalHeight,
      scale,
      offsetX,
      offsetY
    );

    // Generate result image with bounding boxes
    const resultFilename = `result_${uuidv4()}.jpg`;
    const resultPath = path.join(resultsDir, resultFilename);

    // Create SVG overlay
    const svg = `<svg width="${originalWidth}" height="${originalHeight}">
      ${detections
        .map(
          (d) => `
        <rect x="${d.x}" y="${d.y}" 
              width="${d.width}" height="${d.height}"
              stroke="red" fill="none" stroke-width="${Math.max(
                2,
                originalWidth / 200
              )}"/>
      `
        )
        .join("")}
    </svg>`;

    // Composite image with overlay
    await sharp(req.file.path)
      .composite([{ input: Buffer.from(svg), blend: "over" }])
      .toFile(resultPath);

    res.json({
      success: true,
      imageUrl: `http://192.168.1.12:5000/results/${resultFilename}`,
      detections,
      originalWidth,
      originalHeight,
    });
  } catch (error) {
    console.error("Prediction error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process image",
      details: error.message,
    });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Predict endpoint: POST http://localhost:${PORT}/predict`);
});
