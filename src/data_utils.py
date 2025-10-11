# Imports
import torch
import os
from torch.utils.data import Dataset, DataLoader, Subset
import torchvision.transforms as transforms
from PIL import Image
from sklearn.model_selection import train_test_split

# Constants
RANDOM_STATE = 801 # Set seed for train_test_split
RESIZE_SIZE = 232 # Resize resolution that matches MobileNet pre-processing
IMAGE_SIZE = 224 # Image size resolution that matches MobileNet pre-processing
NORMALISE_IMAGENET = transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]) # ImageNet normalisation statistics

# Preprocess train and test images by resizing, converting to Tensor, and Z-score normalising.
# Since MobileNet is pretrained on ImageNet, we normalise using ImageNet statistics and match MobileNet's image processing transformations.
# Dimensions for resizing and cropping sourced from: https://github.com/pytorch/vision/blob/main/torchvision/models/mobilenetv3.py#L317
def get_train_transform():
    """Get train transformation pipeline for training images."""
    train_transform = transforms.Compose([
            transforms.RandomResizedCrop(size=IMAGE_SIZE), # Randomly resize and crop
            transforms.RandomHorizontalFlip(p=0.5), # Horizontally flip the image with prob 0.5
            transforms.ToTensor(),
            NORMALISE_IMAGENET
        ])
    return train_transform

def get_test_transform():
    """Get test transformation pipeline for test images."""
    test_transform = transforms.Compose([
            transforms.Resize(size=RESIZE_SIZE), 
            transforms.CenterCrop(size=IMAGE_SIZE),
            transforms.ToTensor(),
            NORMALISE_IMAGENET
        ])
    return test_transform

class FoodDataset(Dataset):
    """
    Custom dataset for the Food-101 dataset.

    Attributes:
        classes (List[str]): List of class names.
        image_files (List[str]): List of image file paths.
        targets (List[int]): Corresponding labels for each image.
    """
    def __init__(self, data_dir, split, transform=None):
        """
        Initialise the FoodDataset dataset.
        
        Args:
            data_dir (str): The directory containing the dataset.
            split (str): The dataset split ('train', 'test').
            transform (transforms.Compose, optional): Optional transform to be applied to the images.
        """
        self.data_dir = data_dir
        self.split = split
        self.transform = transform

        # Load class names
        classes_path = os.path.join(self.data_dir, 'meta', 'classes.txt')
        with open(classes_path) as f:
            self.classes = f.read().splitlines()

        # Load file paths and labels
        split_path = os.path.join(self.data_dir, 'meta', f'{split}.txt')
        with open(split_path) as f:
            self.image_files = f.read().splitlines()

        # Map each image file to its label (indexed using order of classes)
        self.targets = [self.classes.index(image_file.split('/')[0]) for image_file in self.image_files]
        
    def __len__(self):
        """Returns the total number of samples in the dataset."""
        return len(self.image_files)
        
    def __getitem__(self, index):
        """Get the image and label for a specific index."""
        image_file = self.image_files[index]
        label = self.targets[index]
        
        # Load image
        img_path = os.path.join(self.data_dir, 'images', image_file + '.jpg')
        image = Image.open(img_path).convert('RGB')
        
        # Apply transformations
        if self.transform:
            image = self.transform(image)
        
        return image, label

def prepare_dataloaders(data_dir, batch_size, num_workers, dataset_type='full'):
    """Prepare DataLoaders for training, validation, and test datasets."""
    train_transform = get_train_transform()
    test_transform = get_test_transform()
    
    # Initialise train dataset
    train_dataset = FoodDataset(data_dir, 'train', transform=train_transform)
    
    # Initialise test dataset and split equally into val/test, with stratification
    val_test_dataset = FoodDataset(data_dir, 'test', transform=test_transform) 
    val_indices, test_indices = train_test_split(
        torch.arange(len(val_test_dataset)),
        test_size=0.5,
        stratify=val_test_dataset.targets,
        random_state=RANDOM_STATE
    )
    val_dataset = Subset(val_test_dataset, val_indices)
    test_dataset = Subset(val_test_dataset, test_indices)

    if dataset_type == 'mini':
        # Create a mini dataset of 4000 samples (3000/500/500)
        train_dataset = Subset(train_dataset, list(range(3000)))
        val_dataset = Subset(val_dataset, list(range(500)))
        test_dataset = Subset(test_dataset, list(range(500)))

    if dataset_type == 'subset_10':
        # Subset the training dataset if necessary, with stratification
        subset_perc = int(dataset_type.split('_')[1])/100
        subset_train_size = int(subset_perc * len(train_dataset))
        subset_train_indices, _ = train_test_split(
            torch.arange(len(train_dataset)),
            train_size=subset_train_size,
            stratify=train_dataset.targets,
            random_state=RANDOM_STATE
        )
        train_dataset = Subset(train_dataset, subset_train_indices)

        # Subset the validation dataset to keep it proportional to the training dataset and to speed up training
        val_targets = [val_dataset.dataset.targets[i] for i in val_dataset.indices]
        subset_val_indices, _ = train_test_split(
                torch.arange(len(val_dataset)),
                train_size=0.25,
                stratify=val_targets,
                random_state=RANDOM_STATE
        )
        val_dataset = Subset(val_dataset, subset_val_indices)

    # Load train, validation, and test datasets (75% / 12.5% / 12.5%)
    train_loader = DataLoader(train_dataset, batch_size, shuffle=True, num_workers=num_workers, pin_memory=True)
    val_loader = DataLoader(val_dataset, batch_size, shuffle=False, num_workers=num_workers, pin_memory=True)
    test_loader = DataLoader(test_dataset, batch_size, shuffle=False, num_workers=num_workers, pin_memory=True)
    
    return train_dataset, val_dataset, test_dataset, train_loader, val_loader, test_loader

def load_classes(class_path='data/food-101/meta/classes.txt'):
    """Load class names from specified path."""
    with open(class_path) as f:
        classes = f.read().splitlines()
    return classes