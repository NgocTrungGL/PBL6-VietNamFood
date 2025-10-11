import io
import torch
from flask import Flask, jsonify, request, render_template
from PIL import Image
from main import DEVICE, DTYPE, FOOD101_CLASSES
from src.mobilenet import MyMobileNet
from src.data_utils import get_test_transform, load_classes
import base64
# Set constants
MODEL_PATH = 'model/best_model_noFrezzing.pth (2).tar' # Replace with appropraite checkpoint file path
CLASS_PATH = 'meta/classes.txt'

app = Flask(__name__)

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

def get_prediction(image_bytes):
    """Get predicted class index and class for the image bytes."""
    x = transform_image(image_bytes)
    x = x.to(device=DEVICE, dtype=DTYPE)

    with torch.no_grad(): # Disable gradient tracking
        score = model(x)
        _, pred = score.max(1)
    return pred.item(), classes[pred.item()]



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

def get_prediction(image_bytes):
    """Get predicted class index, class name, and confidence for the image bytes."""
    x = transform_image(image_bytes)
    x = x.to(device=DEVICE, dtype=DTYPE)

    with torch.no_grad():
        score = model(x)
        prob = torch.softmax(score, dim=1)
        conf = prob[0][score.argmax(1)].item()  # Xác suất của class dự đoán
        _, pred = score.max(1)
    print(f'Confident: {round(conf * 100, 2)}%')  # In ra console
    return pred.item(), classes[pred.item()]


@app.route('/', methods=['GET'])
def index():
    """Render the main page."""
    return render_template('index.html')

# @app.route('/predict', methods=['POST'])
# def predict():
#     """Handle prediction requests."""
#     if request.method == 'POST':
#         # Receive and read file from request
#         file = request.files['file']
#         img_bytes = file.read()
#         class_id, class_name = get_prediction(img_bytes)
#         return jsonify({'class_id': class_id, 'class_name': class_name})
@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    if not data or "image" not in data:
        return jsonify({"error": "No image provided"}), 400

    image_b64 = data["image"]
    img_bytes = base64.b64decode(image_b64)

    class_id, class_name = get_prediction(img_bytes)
    return jsonify({'class_id': class_id, 'class_name': class_name})

if __name__ == '__main__':
     app.run(host="0.0.0.0", port=5000, debug=True)