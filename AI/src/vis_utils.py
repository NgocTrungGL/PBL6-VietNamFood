# Imports
import os
import torch
import matplotlib.pyplot as plt
import numpy as np

def setup_directories(model_name=None, checkpoint_base='checkpoint', results_base='results'):
    """Setup checkpoint and results directories."""
    checkpoint_dir = f'{checkpoint_base}/{model_name}' if model_name else 'checkpoint'
    results_dir = f'{results_base}/{model_name}' if model_name else 'results'

    os.makedirs(checkpoint_dir, exist_ok=True)
    os.makedirs(results_dir, exist_ok=True)

    return checkpoint_dir, results_dir

def save_history(filepath, history):
    """Save performance history to a file."""
    with open(filepath, 'w') as f:
        for epoch, loss, acc in history:
            f.write(f'{epoch}\t{loss:.4f}\t{acc:.4f}\n')

def read_history(filepath):
    """Read performance history from a file."""
    epochs, losses, accuracies = [], [], []
    with open(filepath, 'r') as f:
        for line in f:
            epoch, loss, acc = line.strip().split('\t')
            epochs.append(int(epoch))
            losses.append(float(loss))
            accuracies.append(float(acc))
    return epochs, losses, accuracies

def save_plots(path_train, path_val):
    """Save loss and accuracy plots to the same directory as `path_train`."""
    # Read and parse the train and validation loss and accuracy histories 
    train_epoch, train_loss, train_acc = read_history(path_train)
    val_epoch, val_loss, val_acc = read_history(path_val)

    # Set save directory to the same as `path_train`
    save_dir = os.path.dirname(path_train)
    
    # Plot Loss vs Epoch chart
    plt.figure(figsize=(10, 5))
    plt.plot(train_epoch, train_loss, label='Train')
    plt.plot(val_epoch, val_loss, label='Validation')
    plt.xlabel('Epoch')
    plt.ylabel('Loss')
    plt.title('Loss vs Epoch')
    plt.legend()
    plt.savefig(f'{save_dir}/plot_loss_vs_epoch.png')
    plt.show()
    
    # Plot Accuracy vs Epoch chart
    plt.figure(figsize=(10, 5))
    plt.plot(train_epoch, train_acc, label='Train')
    plt.plot(val_epoch, val_acc, label='Validation')
    plt.xlabel('Epoch')
    plt.ylabel('Accuracy')
    plt.title('Accuracy vs Epoch')
    plt.legend()
    plt.savefig(f'{save_dir}/plot_acc_vs_epoch.png')
    plt.show()

def save_history_and_plots(train_history, val_history, save_dir):
    """Save both training and validation history to files and saves corresponding plots."""
    # Paths for saving histories
    path_train = os.path.join(save_dir, 'train_history.txt')
    path_val = os.path.join(save_dir, 'val_history.txt')
    
    # Save training and validation history
    save_history(path_train, train_history)
    save_history(path_val, val_history)

    # Generate and save plots
    save_plots(path_train, path_val)

def save_test_results(test_loss, test_acc, save_dir):
    """Save test results to a file."""
    test_results = [(test_loss, test_acc)]
    filepath = os.path.join(save_dir, 'test_results.txt')
    with open(filepath, 'w') as f:
        for loss, acc in test_results:
            f.write(f'{loss:.4f}\t{acc:.4f}\n')
            print(f'Test loss: {loss:.4f} | Test acc: {acc:.4f}')

def compare_plots(base_dir, sub_dirs, dataset='val', metric='accuracy'):
    """Plot specified metric ('accuracy' or 'loss') across multiple subdirectories for a given dataset ('train' or 'val')."""
    if dataset not in ['train', 'val']:
        raise ValueError("Invalid dataset value. Expected 'train' or 'val'.")

    if metric not in ['accuracy', 'loss']:
        raise ValueError("Invalid metric value. Expected 'accuracy' or 'loss'.")
    
    plt.figure(figsize=(10, 5))
    
    for sub_dir in sub_dirs:
        results_dir = os.path.join(base_dir, sub_dir)
        filepath = os.path.join(results_dir, f'{dataset}_history.txt')
    
        epoch, loss, acc = read_history(filepath)

        if metric == 'accuracy':
            plt.plot(epoch, acc, label=f'{sub_dir}')
            ylabel = 'Accuracy'
        elif metric == 'loss':
            plt.plot(epoch, loss, label=f'{sub_dir}')
            ylabel = 'Loss'
    
    plt.xlabel('Epoch')
    plt.ylabel(ylabel)
    plt.title(f'{dataset.capitalize()} {ylabel} vs Epoch')
    plt.legend()
    plt.show()

def visualise_prediction(idx, labels, preds, loader, dataset):
    """
    This function retrieves an image from the loader and dataset based on the provided index (`idx`), 
    denormalises the image using ImageNet statistics, and then visualises the image with its actual
    and predicted labels.
    """
    label = labels[idx]
    pred_label = preds[idx]
    image, _ = loader.dataset[idx]
    
    # Denormalise image using ImageNet statistics as used in `data_utils.py` 
    mean = torch.tensor([0.485, 0.456, 0.406]) # ImageNet mean
    std = torch.tensor([0.229, 0.224, 0.225]) # ImageNet std
    image = image.permute(1,2,0) * std + mean

    # Plot image with its actual and predicted labels
    plt.imshow(image)
    plt.title(f'GT: {dataset.dataset.classes[label]}\nPRED: {dataset.dataset.classes[pred_label]}')

def plot_classified_images(labels, preds, loader, dataset, correct=True):
    """Create a 3x3 grid plotting correctly or incorrectly classified predictions."""
    if correct:
        indices = np.where(labels == preds)[0]
    else:
        indices = np.where(labels != preds)[0]
    
    # Randomly select and plot 9 images 
    rand_indices = np.random.choice(indices, size=min(9, len(indices)), replace=False)
    
    plt.figure(figsize=(9, 10.5))
    for i, idx in enumerate(rand_indices):
        plt.subplot(3, 3, i + 1)
        visualise_prediction(idx, labels, preds, loader, dataset)
    plt.show()

def plot_class_predictions(labels, preds, loader, dataset, label):
    """Create a 3x3 grid plotting predictions of a specific class label."""
    indices = np.where(labels == label)[0]
    
    # Randomly select and plot 9 images 
    rand_indices = np.random.choice(indices, size=min(9, len(indices)), replace=False)
    
    plt.figure(figsize=(9, 10.5))
    for i, idx in enumerate(rand_indices):
        plt.subplot(3, 3, i + 1)
        visualise_prediction(idx, labels, preds, loader, dataset)
    plt.show()