from ultralytics import YOLO

# Load the trained model
model = YOLO("yolov8l_best_pothole.pt")

# Export to ONNX
model.export(format="onnx")

print("Model exported as road_damage_model.onnx")
