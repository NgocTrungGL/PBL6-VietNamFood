import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms, models
import numpy as np
from pathlib import Path
import copy

def load_and_expand_model(old_model_path, num_old_classes=100, num_new_classes=10):
    """
    Load model cũ và mở rộng classifier để chứa thêm món mới
    CHỈ TRAIN 10 MÓN MỚI - KHÔNG TRAIN LẠI 100 MÓN CŨ
    
    Args:
        old_model_path: đường dẫn đến model đã train (.pth)
        num_old_classes: số lượng món ăn cũ (100)
        num_new_classes: số lượng món ăn mới muốn thêm (10)
    
    Returns:
        model: model đã được mở rộng
        device: thiết bị (cuda/cpu)
    """
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Sử dụng thiết bị: {device}")
    
    print("Đang load model cũ...")
    # Load model cũ
    checkpoint = torch.load(old_model_path, map_location=device)
    
    # Tạo MobileNetV2 base
    model = models.mobilenet_v2(pretrained=False)
    
    # Thay classifier cũ bằng classifier có 100 classes
    model.classifier[1] = nn.Linear(model.classifier[1].in_features, num_old_classes)
    
    # Load weights cũ
    model.load_state_dict(checkpoint)
    
    # Mở rộng classifier từ 100 -> 110 classes
    total_classes = num_old_classes + num_new_classes
    in_features = model.classifier[1].in_features
    
    old_classifier = model.classifier[1]
    new_classifier = nn.Linear(in_features, total_classes)
    
    # Copy weights cho 100 class đầu tiên
    with torch.no_grad():
        new_classifier.weight[:num_old_classes] = old_classifier.weight
        new_classifier.bias[:num_old_classes] = old_classifier.bias
        
        # Khởi tạo weights cho 10 class mới
        nn.init.normal_(new_classifier.weight[num_old_classes:], mean=0.0, std=0.01)
        nn.init.zeros_(new_classifier.bias[num_old_classes:])
    
    model.classifier[1] = new_classifier
    
    # FREEZE TẤT CẢ PARAMETERS TRỪ CLASSIFIER MỚI
    for param in model.parameters():
        param.requires_grad = False
    
    # CHỈ CHO PHÉP TRAIN CLASSIFIER (OUTPUT LAYER)
    for param in model.classifier[1].parameters():
        param.requires_grad = True
    
    model = model.to(device)
    
    print(f"✓ Đã mở rộng từ {num_old_classes} món sang {total_classes} món")
    print("⚠️  CHỈ TRAIN CLASSIFIER - 100 MÓN CŨ KHÔNG BỊ THAY ĐỔI")
    
    return model, device


def create_model_from_scratch(num_classes=110):
    """
    Tạo model mới từ đầu nếu chưa có model cũ
    
    Args:
        num_classes: tổng số món ăn (100 + 10 = 110)
    
    Returns:
        model: model mới
        device: thiết bị (cuda/cpu)
    """
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Tạo model mới từ MobileNetV2 cho {num_classes} món ăn...")
    
    model = models.mobilenet_v2(pretrained=True)
    
    # Freeze base model
    for param in model.features.parameters():
        param.requires_grad = False
    
    # Thay classifier
    in_features = model.classifier[1].in_features
    model.classifier[1] = nn.Linear(in_features, num_classes)
    
    model = model.to(device)
    return model, device


def prepare_data(data_dir, batch_size=32, img_size=224):
    """
    Chuẩn bị dữ liệu training
    
    Cấu trúc thư mục:
    data_dir/
        train/
            mon_001/
            mon_002/
            ...
            mon_110/
        val/
            mon_001/
            mon_002/
            ...
            mon_110/
    
    Args:
        data_dir: đường dẫn thư mục chứa dữ liệu
        batch_size: kích thước batch
        img_size: kích thước ảnh
    
    Returns:
        train_loader, val_loader, class_names
    """
    # Data augmentation cho training
    train_transforms = transforms.Compose([
        transforms.Resize((img_size, img_size)),
        transforms.RandomRotation(20),
        transforms.RandomHorizontalFlip(),
        transforms.RandomAffine(degrees=0, translate=(0.2, 0.2)),
        transforms.ColorJitter(brightness=0.2, contrast=0.2),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    
    # Chỉ normalize cho validation
    val_transforms = transforms.Compose([
        transforms.Resize((img_size, img_size)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    
    # Load datasets
    train_dataset = datasets.ImageFolder(
        root=f"{data_dir}/train",
        transform=train_transforms
    )
    
    val_dataset = datasets.ImageFolder(
        root=f"{data_dir}/val",
        transform=val_transforms
    )
    
    # Create data loaders
    train_loader = DataLoader(
        train_dataset,
        batch_size=batch_size,
        shuffle=True,
        num_workers=4,
        pin_memory=True
    )
    
    val_loader = DataLoader(
        val_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=4,
        pin_memory=True
    )
    
    # Class names
    class_names = train_dataset.classes
    
    print(f"\n📊 Đã load {len(class_names)} món ăn")
    print(f"   - Training samples: {len(train_dataset)}")
    print(f"   - Validation samples: {len(val_dataset)}")
    
    return train_loader, val_loader, class_names


def train_new_classes_only(model, device, train_loader, val_loader, 
                            epochs=30, learning_rate=0.001, save_path='food_110_model.pth'):
    """
    Train CHỈ CLASSIFIER - chỉ học 10 món mới, không thay đổi 100 món cũ
    
    Args:
        model: model đã được expand
        device: thiết bị (cuda/cpu)
        train_loader: dữ liệu training
        val_loader: dữ liệu validation
        epochs: số epochs
        learning_rate: learning rate
        save_path: đường dẫn lưu model
    
    Returns:
        history: lịch sử training
    """
    # Loss function và optimizer
    criterion = nn.CrossEntropyLoss()
    
    # CHỈ OPTIMIZE CÁC PARAMETERS CÓ requires_grad=True (classifier)
    optimizer = optim.Adam(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=learning_rate
    )
    
    # Learning rate scheduler
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(
        optimizer, mode='min', factor=0.5, patience=5, verbose=True
    )
    
    # Kiểm tra layer nào được train
    print("\n" + "="*60)
    print("PARAMETERS ĐƯỢC TRAIN:")
    print("="*60)
    trainable_params = 0
    total_params = 0
    for name, param in model.named_parameters():
        total_params += param.numel()
        if param.requires_grad:
            trainable_params += param.numel()
            print(f"✅ {name}: {param.numel()} parameters")
        else:
            print(f"❌ {name}: {param.numel()} parameters (FROZEN)")
    
    print(f"\n📊 Trainable: {trainable_params:,} / Total: {total_params:,} parameters")
    print(f"   ({trainable_params/total_params*100:.2f}% được train)")
    
    print("\n" + "="*60)
    print("BẮT ĐẦU TRAINING - CHỈ CLASSIFIER")
    print("="*60)
    
    # Training history
    history = {
        'train_loss': [],
        'train_acc': [],
        'val_loss': [],
        'val_acc': []
    }
    
    best_val_acc = 0.0
    best_model_wts = copy.deepcopy(model.state_dict())
    
    for epoch in range(epochs):
        print(f'\nEpoch {epoch+1}/{epochs}')
        print('-' * 60)
        
        # Training phase
        model.train()
        running_loss = 0.0
        running_corrects = 0
        
        for inputs, labels in train_loader:
            inputs = inputs.to(device)
            labels = labels.to(device)
            
            optimizer.zero_grad()
            
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            _, preds = torch.max(outputs, 1)
            
            loss.backward()
            optimizer.step()
            
            running_loss += loss.item() * inputs.size(0)
            running_corrects += torch.sum(preds == labels.data)
        
        epoch_train_loss = running_loss / len(train_loader.dataset)
        epoch_train_acc = running_corrects.double() / len(train_loader.dataset)
        
        # Validation phase
        model.eval()
        running_loss = 0.0
        running_corrects = 0
        
        with torch.no_grad():
            for inputs, labels in val_loader:
                inputs = inputs.to(device)
                labels = labels.to(device)
                
                outputs = model(inputs)
                loss = criterion(outputs, labels)
                _, preds = torch.max(outputs, 1)
                
                running_loss += loss.item() * inputs.size(0)
                running_corrects += torch.sum(preds == labels.data)
        
        epoch_val_loss = running_loss / len(val_loader.dataset)
        epoch_val_acc = running_corrects.double() / len(val_loader.dataset)
        
        # Update learning rate
        scheduler.step(epoch_val_loss)
        
        # Save history
        history['train_loss'].append(epoch_train_loss)
        history['train_acc'].append(epoch_train_acc.item())
        history['val_loss'].append(epoch_val_loss)
        history['val_acc'].append(epoch_val_acc.item())
        
        print(f'Train Loss: {epoch_train_loss:.4f} | Train Acc: {epoch_train_acc:.4f}')
        print(f'Val Loss: {epoch_val_loss:.4f} | Val Acc: {epoch_val_acc:.4f}')
        
        # Save best model
        if epoch_val_acc > best_val_acc:
            best_val_acc = epoch_val_acc
            best_model_wts = copy.deepcopy(model.state_dict())
            torch.save(model.state_dict(), save_path)
            print(f'✓ Đã lưu model tốt nhất (Val Acc: {best_val_acc:.4f})')
    
    # Load best model weights
    model.load_state_dict(best_model_wts)
    
    print(f"\n✓ Training hoàn tất!")
    print(f"✓ Best Val Acc: {best_val_acc:.4f}")
    print(f"✓ Model đã được lưu tại: {save_path}")
    
    return history


def predict_image(model, device, img_path, class_names, top_k=5):
    """
    Dự đoán món ăn từ ảnh
    
    Args:
        model: model đã train
        device: thiết bị (cuda/cpu)
        img_path: đường dẫn ảnh cần dự đoán
        class_names: list tên các món ăn
        top_k: số lượng kết quả top trả về
    
    Returns:
        result (dict): Kết quả dự đoán chi tiết
    """
    from PIL import Image
    
    # Load và preprocess ảnh
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    
    img = Image.open(img_path).convert('RGB')
    img_tensor = transform(img).unsqueeze(0).to(device)
    
    # Dự đoán
    model.eval()
    with torch.no_grad():
        outputs = model(img_tensor)
        probabilities = torch.nn.functional.softmax(outputs, dim=1)[0]
        probabilities = probabilities.cpu().numpy()
    
    # Món ăn có xác suất cao nhất
    predicted_class = np.argmax(probabilities)
    confidence = probabilities[predicted_class]
    
    # Top-K món ăn có xác suất cao nhất
    top_indices = np.argsort(probabilities)[-top_k:][::-1]
    top_predictions = [
        {
            'class_id': int(idx),
            'class_name': class_names[idx],
            'probability': float(probabilities[idx]),
            'percentage': f"{probabilities[idx]*100:.2f}%"
        }
        for idx in top_indices
    ]
    
    result = {
        'predicted_class_id': int(predicted_class),
        'predicted_class_name': class_names[predicted_class],
        'confidence': float(confidence),
        'confidence_percentage': f"{confidence*100:.2f}%",
        'top_predictions': top_predictions,
        'all_probabilities': probabilities.tolist()
    }
    
    return result


# ============================================================
# CÁCH SỬ DỤNG - CHỈ TRAIN 10 MÓN MỚI
# ============================================================

if __name__ == "__main__":
    print("="*60)
    print("PYTORCH - TRAIN THÊM 10 MÓN MỚI")
    print("KHÔNG TRAIN LẠI 100 MÓN CŨ")
    print("="*60)
    
    # BƯỚC 1: Load và mở rộng model từ 100 -> 110 món
    model, device = load_and_expand_model(
        old_model_path='food_100_model.pth',
        num_old_classes=100,
        num_new_classes=10
    )
    
    # Hoặc tạo mới nếu chưa có model cũ:
    # model, device = create_model_from_scratch(num_classes=110)
    
    # Xem kiến trúc model
    print("\n📋 Kiến trúc model:")
    print(model)
    
    # BƯỚC 2: Chuẩn bị dữ liệu (110 món: 100 cũ + 10 mới)
    train_loader, val_loader, class_names = prepare_data(
        data_dir='food_dataset',
        batch_size=32,
        img_size=224
    )
    
    # BƯỚC 3: Train model - CHỈ CLASSIFIER
    history = train_new_classes_only(
        model=model,
        device=device,
        train_loader=train_loader,
        val_loader=val_loader,
        epochs=30,
        learning_rate=0.001,
        save_path='food_110_model.pth'
    )
    
    # BƯỚC 4: Dự đoán
    result = predict_image(
        model=model,
        device=device,
        img_path='test_image.jpg',
        class_names=class_names,
        top_k=5
    )
    
    # In kết quả
    print("\n" + "="*60)
    print("KẾT QUẢ DỰ ĐOÁN")
    print("="*60)
    print(f"\n🍜 Món ăn dự đoán: {result['predicted_class_name']}")
    print(f"📊 Độ tin cậy: {result['confidence_percentage']}")
    print(f"🔢 Class ID: {result['predicted_class_id']}")
    
    print(f"\n📈 Top 5 món ăn có xác suất cao nhất:")
    print("-" * 60)
    for i, pred in enumerate(result['top_predictions'], 1):
        print(f"{i}. {pred['class_name']:20s} - {pred['percentage']:>7s} (ID: {pred['class_id']})")

