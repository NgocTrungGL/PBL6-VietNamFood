import io
import torch
from flask import Flask, jsonify, request, render_template, Blueprint
from PIL import Image
# from main import DEVICE, DTYPE, FOOD101_CLASSES
from src.mobilenet import MyMobileNet
from src.data_utils import get_test_transform, load_classes
import base64
import sys
sys.stdout.reconfigure(encoding="utf-8")
import pathlib


DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
DTYPE = torch.float32
FOOD101_CLASSES = 100
# Set constants
BASE_DIR = pathlib.Path(__file__).resolve().parents[1]
MODEL_PATH = BASE_DIR / 'model' / 'best_model_noFrezzing.pth (2).tar'
CLASS_PATH = BASE_DIR / 'data' / 'meta' / 'classesTV.txt'

food_predict_bp = Blueprint('food_predict', __name__)

# Load classes and model
classes = load_classes(CLASS_PATH)

model = MyMobileNet(
    output_classes=FOOD101_CLASSES, 
    device=DEVICE, 
    checkpoint_path=MODEL_PATH
)
model.eval()

def transform_image(image_bytes):
    """Process raw image bytes and apply test image transformations for model input."""
    transform = get_test_transform()
    image = Image.open(io.BytesIO(image_bytes))
    return transform(image).unsqueeze(0)

# def get_prediction(image_bytes):
#     """Get predicted class index and class for the image bytes."""
#     x = transform_image(image_bytes)
#     x = x.to(device=DEVICE, dtype=DTYPE)

#     with torch.no_grad(): # Disable gradient tracking
#         score = model(x)
#         _, pred = score.max(1)
#     return pred.item(), classes[pred.item()]



# #lay 5 anh
# def get_prediction(image_bytes):
#     """Get top-5 predicted class indices and class names for the image bytes."""
#     x = transform_image(image_bytes)
#     x = x.to(device=DEVICE, dtype=DTYPE)

#     with torch.no_grad():
#         score = model(x)
#         top5_scores, top5_indices = score.topk(5, dim=1)
#     # Chuyển sang list để trả về
#     top5_indices = top5_indices[0].cpu().numpy()
#     top5_classes = [classes[i] for i in top5_indices]
#     return top5_indices.tolist(), top5_classes

# def get_prediction(image_bytes):
#     """Get predicted class index, class name, and confidence for the image bytes."""
#     x = transform_image(image_bytes)
#     x = x.to(device=DEVICE, dtype=DTYPE)

#     with torch.no_grad():
#         score = model(x)
#         prob = torch.softmax(score, dim=1)
#         conf = prob[0][score.argmax(1)].item()  # Xác suất của class dự đoán
#         _, pred = score.max(1)
#     print(f'Confident: {round(conf * 100, 2)}%')  # In ra console
#     return pred.item(), classes[pred.item()]

def get_prediction(image_bytes):
    x = transform_image(image_bytes)
    x = x.to(device=DEVICE, dtype=DTYPE)

    with torch.no_grad():
        score = model(x)
        prob = torch.softmax(score, dim=1)[0]

        # Top 5 (in console)
        top5_prob, top5_idx = torch.topk(prob, 5)
        print("Top 5 predictions:")
        for i in range(5):
            print(f"{classes[top5_idx[i]]}: {round(top5_prob[i].item()*100, 2)}%")

        # Top 1 (return)
        top1_idx = prob.argmax().item()
        top1_conf = prob[top1_idx].item()

    return top1_idx, classes[top1_idx], top1_conf





# @food_predict_bp.route('/predict', methods=['POST'])
# def predict():
#     """Handle prediction requests."""
#     if request.method == 'POST':
#         # Receive and read file from request
#         file = request.files['file']
#         img_bytes = file.read()
#         class_id, class_name = get_prediction(img_bytes)
#         return jsonify({'class_id': class_id, 'class_name': class_name})

@food_predict_bp.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    if not data or "image" not in data:
        return jsonify({"error": "No image provided"}), 400

    image_b64 = data["image"]
    img_bytes = base64.b64decode(image_b64)
    class_id, class_name, conf = get_prediction(img_bytes)
    if conf < 0.7:
        return jsonify({
            "message": "xin lỗi hệ thống tôi chưa nhận diện được món ăn này",
            "confidence": round(conf * 100, 2)
        }), 200
    return jsonify({'class_id': class_id, 'class_name': class_name})


