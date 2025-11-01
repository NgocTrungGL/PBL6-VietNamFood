# Imports
import torch
import time
import copy
import numpy as np

def check_accuracy(loader, model, criterion, device, dtype):
    """Assess the accuracy of the model using the provided data loader."""
    running_loss, num_samples, num_correct = 0.0, 0, 0
    model.eval()  # Set model to evaluation mode, disabling dropout and using population statistics for batch normalisation.
    with torch.no_grad(): # Disable gradient tracking.
        for x, y in loader:
            x = x.to(device=device, dtype=dtype)  # Move to device, e.g. GPU
            y = y.to(device=device, dtype=torch.long)
            
            scores = model(x) # Compute forward pass to get output scores from model
            loss = criterion(scores, y)
            _, preds = scores.max(1) # Compute max across dim=1 to get the predicted class for each data sample

            # Increment running counts
            num_samples += x.size(0) # Increment # of samples by batch size
            running_loss += loss.item() * x.size(0) # Increment running total loss by the total loss of the batch
            num_correct += (preds == y).sum() # Increment # of correct predictions by the number of correct predictions in this batch

        epoch_loss = running_loss / num_samples # Compute loss across entire dataset (i.e. one epoch).
        epoch_acc = float(num_correct) / num_samples # Compute accuracy across entire dataset (i.e. one epoch).
    return epoch_loss, epoch_acc

def train_network(model, train_loader, val_loader, num_epochs, criterion, optimiser, device, dtype, print_every=100, checkpoint_dir='checkpoint'):
    """Train the model for a specified number of epochs, saving a checkpoint after each epoch."""
    start_time = time.time() # Track total training time
    train_history, val_history = [], [] # Track loss and accuracy history for each epoch
    best_epoch_acc_val = -1
    for epoch in range(num_epochs):
        epoch_start_time = time.time() # Track epoch time
        running_loss, num_samples, num_correct = 0.0, 0, 0
        
        for batch_idx, (x, y) in enumerate(train_loader):
            model.train()  # Set model to training mode
            x = x.to(device=device, dtype=dtype)  # Move to device, e.g. GPU
            y = y.to(device=device, dtype=torch.long)

            scores = model(x)
            loss = criterion(scores, y)
            _, preds = scores.max(1) # Compute max across dim=1 to get the predicted class for each data sample

            # Zero out all of the gradients for the variables which the optimizer will update. 
            # Necessary as gradients accumulate by default in Pytorch.
            optimiser.zero_grad()

            # Backwards pass: compute gradient of the loss wrt each model parameter
            loss.backward()

            # Update the parameters of the model using the gradients computed by the backwards pass.
            optimiser.step()
            
            # Increment running counts
            num_samples += x.size(0) # Increment # of samples by batch size
            running_loss += loss.item() * x.size(0) # Increment running total loss by the total loss of the batch
            num_correct += (preds == y).sum() # Increment # of correct predictions by the number of correct predictions in this batch
        
            if (batch_idx % print_every == 0) and (batch_idx != 0):
                print('-' * 20)
                print(f'Epoch {epoch+1} | Iteration {batch_idx} | Batch Loss = {loss.item():.4f}')
        
        epoch_loss_val, epoch_acc_val = check_accuracy(val_loader, model, criterion, device, dtype) # Compute loss and accuracy across entire val dataset
        epoch_loss_train = running_loss / num_samples # Compute loss across entire train dataset
        epoch_acc_train = float(num_correct) / num_samples # Compute accuracy across entire train dataset
        
        # Track loss and accuracy history for each epoch
        train_history.append((epoch+1, epoch_loss_train, epoch_acc_train))
        val_history.append((epoch+1, epoch_loss_val, epoch_acc_val))
        
        # Save checkpoint after every epoch
        checkpoint = {
            'epoch': epoch + 1,
            'model_state_dict': model.state_dict(),
            'optimiser_state_dict': optimiser.state_dict(),
            'train_history': train_history,
            'val_history': val_history,
        }
        torch.save(checkpoint, f'{checkpoint_dir}/checkpoint_epoch_{epoch+1}.pth.tar')

        # If current model performs the best in validation accuracy, save by deepcopying weights
        if epoch_acc_val > best_epoch_acc_val:
            best_epoch_acc_val = epoch_acc_val
            checkpoint['model_state_dict'] = copy.deepcopy(model.state_dict())
            checkpoint['optimiser_state_dict'] = copy.deepcopy(optimiser.state_dict()) # Optional for if we want to train further
            torch.save(checkpoint, f'{checkpoint_dir}/best_model.pth.tar')
        
        epoch_end_time = time.time()
        print('=' * 20)
        print(f'Epoch {epoch+1} | Train Loss: {epoch_loss_train:.4f} | Train Acc: {epoch_acc_train:.4f} | Val Loss: {epoch_loss_val:.4f} | Val Acc: {epoch_acc_val:.4f} | Time taken: {epoch_end_time - epoch_start_time:.2f} seconds')
        print('=' * 20)
    
    end_time = time.time()
    print(f"Total training time ({epoch+1} epochs): {end_time - start_time:.2f} seconds")

    return train_history, val_history

def get_predictions(model, loader, device, dtype):
    """Retrieve predictions and true labels from the model using the provided data loader."""
    model.eval()  # Set the model to evaluation mode
    all_preds = []
    all_labels = []
    
    with torch.no_grad(): # Disable gradient tracking
        for x, y in loader:
            x = x.to(device, dtype=dtype)
            y = y.to(device, dtype=torch.long)

            # Forward pass to get predictions
            scores = model(x)
            _, preds = scores.max(1)

            # Convert model predictions and labels to numpy arrays, and accumulate them
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(y.cpu().numpy())

    return np.array(all_preds), np.array(all_labels)