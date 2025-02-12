from ultralytics import YOLO

# Load the trained model
model = YOLO("YOLOv8_Small_RDD.pt")

# Export to ONNX
model.export(format="onnx")

print("Model exported as road_damage_model.onnx")
