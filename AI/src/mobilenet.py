# Imports
import torch
import os
import torchvision.models as models
import torch.nn as nn

class MyMobileNet(nn.Module):
    """
    MyMobileNet is a custom implementation of the MobileNet v3 architecture for classification tasks.
    It allows loading pre-trained weights, loading weights from a checkpoint, replacing the classifier
    to match the number of output classes, and freezing layers during training.
    """
    def __init__(self, output_classes, device, pretrained_weights_path=None, checkpoint_path=None, freeze_classifier=False):
        """Initialise the MyMobileNet model.
        
        Args:
            output_classes (int): Number of output classes for the classifier.
            device (torch.device): Device to run the model on (e.g., 'cuda' or 'cpu').
            pretrained_weights_path (str, optional): Path to the pretrained weights. Defaults to None.
            checkpoint_path (str, optional): Path to the checkpoint file to load weights. Defaults to None.
            freeze_classifier (bool, optional): Whether to freeze all layers except the classifier. Defaults to False.
        """
        super().__init__()
        
        # Initialise MobileNet v3 model without loading weights
        self.model = models.mobilenet_v3_large(pretrained=False)

        # Load weights from checkpoint if provided
        if checkpoint_path:
            self._replace_classifier(output_classes)
            self._load_weights_from_checkpoint(checkpoint_path)
        else:
            # Load pre-trained weights or download if not found
            if pretrained_weights_path and os.path.exists(pretrained_weights_path):
                self.model.load_state_dict(torch.load(pretrained_weights_path))
            else:
                self.model = models.mobilenet_v3_large(pretrained=True, weights='IMAGENET1K_V2')
                if pretrained_weights_path:
                    torch.save(self.model.state_dict(), pretrained_weights_path)
                    
            # Replace the final fully connected layer to match the number of output classes
            self._replace_classifier(output_classes)
        
        # Move model to the specified device
        self.model = self.model.to(device)

        # Freeze layers
        if freeze_classifier:
            self._freeze_layers_except_classifier()
        else:
            self._unfreeze_all_layers()
    
    def _replace_classifier(self, output_classes):
        """Replace the final fully connected layer to match the number of output classes."""
        in_features = self.model.classifier[-1].in_features
        self.model.classifier[-1] = nn.Linear(in_features, output_classes)
    
    def _load_weights_from_checkpoint(self, checkpoint_path):
        """Load the model weights from the specified checkpoint path."""
        if os.path.exists(checkpoint_path):
            # checkpoint = torch.load(checkpoint_path)
            checkpoint = torch.load(checkpoint_path, map_location=torch.device('cpu'))
            state_dict = checkpoint['model_state_dict']
            self.load_state_dict(state_dict)
        else:
            raise FileNotFoundError(f"No checkpoint file found at {checkpoint_path}.")

    def _freeze_layers_except_classifier(self):
        """Freeze all model layers except for the final FC layer."""
        for param in self.model.parameters():
            param.requires_grad = False
        
        for param in self.model.classifier[-1].parameters():
            param.requires_grad = True

    def _unfreeze_all_layers(self):
        """Unfreeze all model layers."""
        for param in self.model.parameters():
            param.requires_grad = True
    
    def forward(self, x):
        """Forward pass through the model."""
        return self.model(x)
