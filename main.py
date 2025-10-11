import argparse
import torch
import torch.optim as optim
import torch.nn as nn
from src.mobilenet import MyMobileNet
from src.data_utils import prepare_dataloaders
from src.vis_utils import save_history_and_plots, save_test_results, setup_directories
from src.train import train_network, check_accuracy

# Set constants
if torch.cuda.is_available():
    DEVICE = torch.device('cuda')
else:
    DEVICE = torch.device('cpu')
DTYPE = torch.float32
FOOD101_CLASSES = 100
PRETRAINED_WEIGHTS_PATH = 'model/mobilenet_v3_large-8738ca79.pth' # Path to save/load pretrained weights
DATA_DIR = 'data/images'

# Default values for command-line arguments
DEFAULT_BATCH_SIZE = 64
DEFAULT_NUM_WORKERS = 2
DEFAULT_NUM_EPOCHS = 5
DEFAULT_LEARNING_RATE = 1e-4
DEFAULT_PRINT_EVERY = 100

# Parse command-line arguments
def get_parser():
    parser = argparse.ArgumentParser(description='Training MobileNet on Food101 dataset in Pytorch.')
    
    parser.add_argument('--mode', choices=['train', 'test'], required=True,
                        help='Choose the mode: training the model (train), or evaluate performance on the test dataset (test).')
    parser.add_argument('--checkpoint_path', type=str, default=None, 
                        help='Path to the checkpoint file to load the model state. If not provided, the pretrained weights will be loaded.')
    parser.add_argument('--dataset', choices=['full', 'mini', 'subset_10'], required=True, help='Dataset option: full, mini, or subset of training data by 10%. The validation and test datasets are also subset proportionately.')
    parser.add_argument('--batch_size', type=int, default=DEFAULT_BATCH_SIZE, help='Batch size for training.')
    parser.add_argument('--num_workers', type=int, default=DEFAULT_NUM_WORKERS, help='Number of data loading workers.')
    parser.add_argument('--num_epochs', type=int, default=DEFAULT_NUM_EPOCHS, help='Number of epochs for training.')
    parser.add_argument('--learning_rate', type=float, default=DEFAULT_LEARNING_RATE, help='Learning rate for the optimizer.')
    parser.add_argument('--print_every', type=int, default=DEFAULT_PRINT_EVERY, help='Frequency of printing training progress.')
    parser.add_argument('--model_name', type=str, default=None, help='Optional name for the model. If provided, checkpoints and results will be saved under checkpoint/model_name/ and results/model_name/.')
    parser.add_argument('--freeze_except_classifier', action='store_true', help='If set, freeze all layers except the classifier. Otherwise, no freezing.')
    
    return parser

def main():
    # Retrieve variables from arguments
    parser = get_parser()
    args = parser.parse_args()

    # Prepare dataset       
    train_dataset, val_dataset, test_dataset, train_loader, val_loader, test_loader = prepare_dataloaders(
        data_dir=DATA_DIR, 
        batch_size=args.batch_size, 
        num_workers=args.num_workers, 
        dataset_type=args.dataset
    )
    
    # Prepare model
    model = MyMobileNet(
        output_classes=FOOD101_CLASSES, 
        device=DEVICE, 
        pretrained_weights_path=PRETRAINED_WEIGHTS_PATH, 
        checkpoint_path=args.checkpoint_path, 
        freeze_classifier=args.freeze_except_classifier
    )
    
    # Set parameters
    criterion = nn.CrossEntropyLoss()
    optimiser = optim.Adam(model.parameters(), lr=args.learning_rate)

    # Setup directory
    checkpoint_dir, results_dir = setup_directories(
        model_name=args.model_name, 
        checkpoint_base='checkpoint', 
        results_base='results'
    )

    if args.mode == 'train':
        # Train model and save checkpoints
        train_history, val_history = train_network(
            model=model, 
            train_loader=train_loader, 
            val_loader=val_loader, 
            num_epochs=args.num_epochs, 
            criterion=criterion, 
            optimiser=optimiser, 
            device=DEVICE, 
            dtype=DTYPE, 
            print_every=args.print_every, 
            checkpoint_dir=checkpoint_dir
        )
    
        # Save results
        save_history_and_plots(
            train_history=train_history, 
            val_history=val_history, 
            save_dir=results_dir
        )
    
    else:
        # Evaluate model on test dataset
        test_loss, test_acc = check_accuracy(
            loader=test_loader, 
            model=model, 
            criterion=criterion, 
            device=DEVICE, 
            dtype=DTYPE
        )

        # Save results
        save_test_results(
            test_loss=test_loss, 
            test_acc=test_acc, 
            save_dir=results_dir
        )

if __name__ == "__main__":
    main()