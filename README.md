![model-demo](https://github.com/user-attachments/assets/2bb56633-b869-4aca-82db-3d82f60b0c7a)

# MobileNet Fine-Tuning on Food-101

This project involves fine-tuning a MobileNet model on the Food-101 dataset to optimise performance while managing limited computational resources. Given these constraints, experiments and hyperparameter optimisation were conducted on a 10% subset of the training data. Two distinct fine-tuning strategies were explored: single-stage fine-tuning, where the entire model was trained simultaneously, and two-stage fine-tuning, which involved an initial phase of training only the final Fully-Connected layer followed by a phase of training the entire network. The two-stage approach aimed to leverage rapid adaptation of the classifier before fine-tuning the pre-trained layers with more nuanced adjustments. Our results demonstrated that, of the experimental models, single-stage fine-tuning achieved the highest accuracy at 67.3%, while two-stage fine-tuning achieved 66.1%. Ultimately, we applied single-stage fine-tuning (without freezing) for the final model which we trained on the entire dataset, resulting in a validation accuracy of 83.5% and a test accuracy of 82.9%.

This repository includes a [Notebook](https://github.com/gordon801/mobile-net-food-101/blob/main/mobile-net-food-101.ipynb) that summarises our methodologies and results, providing insights into the fine-tuning process. It also includes a [Flask web application](https://github.com/gordon801/mobile-net-food-101/blob/main/app.py) that deploys the trained final model, which predicts one of the 101 food classes in the Food-101 dataset. This allows users to upload their own images and receive predictions on its food class.

## Architecture
![Project Architecture](https://github.com/user-attachments/assets/fdd81f0c-94ce-44be-8890-cbbd9b79da10)
This project uses a pretrained MobileNetV3Large model with ImageNet weights, which we fine-tune on the Food-101 dataset by replacing the final fully-connected layer to output predictions for the 101 food classes. The model is trained using cross-entropy loss and its performance is evaluated using accuracy.

## Experimental Model Performance
![Validation performance](https://github.com/user-attachments/assets/22a4b296-0c7c-4792-b775-890cd9ab7976)
- Single-Stage Fine-tuning: 67.3% val acc
- Single-Stage Fine-tuning with freezing (i.e. training only the classifier): 53.0% val acc
- Two-Stage Fine-tuning v1 (with overfit classifier): 63.9% val acc
- Two-Stage Fine-tuning v2 (without overfitting issue): 66.1% val acc

## Final Model Outputs
![Prediction examples](https://github.com/user-attachments/assets/90b2eb85-e733-4441-ac50-0c1d7e4ed77b)

## Project Structure
```
mobile-net-food-101/
├── data/
│   └── food-101/
├── src/
│   ├── data_utils.py
│   ├── mobilenet.py
│   ├── train.py
│   └── vis_utils.py
├── templates/
│   └── index.html
├── app.py
├── main.py
└── ...
```
### Data
This model was trained and tested on the FOOD-101 dataset, which consists of 101 food categories with 101,000 images. More information about this dataset can be found on [this website](https://data.vision.ee.ethz.ch/cvl/datasets_extra/food-101/). The dataset can be downloaded from [here](http://data.vision.ee.ethz.ch/cvl/food-101.tar.gz) and should be saved in the `data` folder in the root-level directory. 

### Scripts
- `src/data_utils.py`: Contains functions to handle data loading, transformations, and preparation of the Food-101 dataset for training, validation, and testing.
- `src/mobilenet.py`: Implements a custom MobileNet v3 model for classification tasks, allowing the use of pre-trained weights, loading from checkpoints, and freezing layers during training.
- `src/train.py`: Contains functions for training the MobileNet model, evaluating its accuracy, and saving the model's checkpoints.
- `src/vis_utils.py`: Provides utility functions for organising directories, saving training histories, and generating plots.
- `main.py`: Serves as the entry point for the project, managing command-line arguments, initialising the model and data loaders, and orchestrating the training and testing processes.
- `app.py`: A Flask application for predicting food class labels from input images using the fine-tuned MobileNet model.

### Running `main.py` and `app.py`
To train the model on a 10% subset of the dataset (e.g. for hyperparameter optimisation or experimentation), run:
```
python main.py --mode train --dataset subset_10 --num_epochs 50 --learning_rate 1e-4 --model_name my_model
```
To train the model on the full dataset, run:
```
python main.py --mode train --dataset full --num_epochs 50 --learning_rate 1e-4 --model_name my_model
```
To evaluate your trained model on the test dataset, run:
```
python main.py --mode test --dataset full --checkpoint_path checkpoint/my_model/best_model.pth.tar --model_name my_model
```
To deploy your trained model to a web application, run:
```
python app.py
```

### Steps to Reproduce
1. Clone this repository:
```
git clone https://github.com/gordon801/mobile-net-food-101.git
```
2. Install the required dependencies:
```
pip install -r requirements.txt
```
3. Train and evaluate your model by following the process in the `mobile-net-food-101.ipynb` notebook or by running:
```
python main.py --mode train --dataset full --num_epochs 50 --learning_rate 1e-4 --model_name my_model
python main.py --mode test --dataset full --checkpoint_path checkpoint/my_model/best_model.pth.tar --model_name my_model
```
4. Deploy your trained model to a web application and make predictions by uploading new images:
```
python app.py
```

## References
- **Searching for MobileNetV3.** A. Howard, M. Sandler, G. Chu, L.-C. Chen, B. Chen, M. Tan, W. Wang, Y. Zhu, R. Pang, V. Vasudevan, Q.V. Le, H. Adam. In arXiv, 2019. [Paper](https://arxiv.org/abs/1905.02244)
- **A Data Subset Selection Framework for Efficient Hyper-Parameter Tuning and Automatic Machine Learning.** S. Visalpara, K. Killamsetty, R. Iyer. In SubSetML Workshop 2021, International Conference on Machine Learning, 2021. [Paper](https://krishnatejakillamsetty.me/files/Hyperparam_SubsetML.pdf)

## Acknowledgements
- [Food-101 Dataset](https://data.vision.ee.ethz.ch/cvl/datasets_extra/food-101/)
- [CS231N](https://cs231n.stanford.edu/)
- [Pytorch Flask Tutorial](https://pytorch.org/tutorials/intermediate/flask_rest_api_tutorial.html)
