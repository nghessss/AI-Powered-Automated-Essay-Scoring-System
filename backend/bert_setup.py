import pandas as pd
from transformers import BertModel, BertTokenizer
import numpy as np
import tensorflow as tf
from typing import List
import pickle
from sklearn.preprocessing import StandardScaler
import torch
import torch.nn as nn
import os
config ={
    "max_seq_length": 768,
    "bert_model_name": "bert-base-uncased",
    "learning_rate": 0.001,
    "batch_size": 32,
    "epochs": 50,
    "loss": 'mean_squared_error',
    'metrics': ['mean_absolute_error']
}

bert_tokenizer = BertTokenizer.from_pretrained(config['bert_model_name'])
bert_model = BertModel.from_pretrained(config['bert_model_name'])


def load_scaler(file_path):
    """
    Load the scaler from the given file path
    """
    with open(file_path, "rb") as f:
        scaler = pickle.load(f)
    return scaler

class BERTWithExtraFeature(nn.Module):
    def __init__(self, pretrained_model_name='bert-base-uncased', dropout_prob=0.2, num_trainable_layers=1):
        super(BERTWithExtraFeature, self).__init__()
        self.bert = BertModel.from_pretrained(pretrained_model_name)

        # Freeze all layers in the BERT model
        for param in self.bert.parameters():
            param.requires_grad = False

        # Unfreeze the last `num_trainable_layers` layers
        for layer in self.bert.encoder.layer[-num_trainable_layers:]:
            for param in layer.parameters():
                param.requires_grad = True

        # BatchNorm for numerical input
        self.num_feature_norm = nn.BatchNorm1d(1)

        # Combined input size: 768 (BERT) + 1 (extra num)
        self.concat_input_dim = 768 + 1

        # New feed-forward layer stack
        self.fc0 = nn.Linear(self.concat_input_dim, 512)
        self.relu0 = nn.ReLU()
        self.fc1 = nn.Linear(512, 256)
        self.relu1 = nn.ReLU()
        self.fc2 = nn.Linear(256, 128)
        self.relu2 = nn.ReLU()
        self.fc3 = nn.Linear(128, 64)
        self.relu3 = nn.ReLU()
        self.output_layer = nn.Linear(64, 1)

    def forward(self, input_ids, attention_mask, extra_number):
        outputs = self.bert(input_ids=input_ids, attention_mask=attention_mask)
        pooled_output = outputs.pooler_output

        if extra_number.dim() == 1:
            extra_number = extra_number.unsqueeze(1)
        normalized_num = self.num_feature_norm(extra_number)

        concat = torch.cat((pooled_output, normalized_num), dim=1)

        x = self.fc0(concat)
        x = self.relu0(x)
        x = self.fc1(x)
        x = self.relu1(x)
        x = self.fc2(x)
        x = self.relu2(x)
        x = self.fc3(x)
        x = self.relu3(x)
        
        output = self.output_layer(x)

        return output

model = BERTWithExtraFeature()
checkpoint = torch.load('models/bert_model.pth',map_location='cpu')
model.load_state_dict(checkpoint['model_state_dict'])
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
scaler = load_scaler('models/scaler_config.pkl')

def tokenize_inputs_pt(question, essays, tokenizer, print_stats=False, max_length=512):
    input_ids_list = []
    attention_masks_list = []
    lengths_token = []
    lengths_sequences = []
    

    encoding = tokenizer(
        question, essays,
        padding="max_length",  # Padding to ensure uniform length
        truncation=True,  # Ensuring truncation for longer inputs
        max_length=max_length,  # Optional: set max_length explicitly
        return_tensors="pt"  # Resturn in tensor format
    )
    input_ids = encoding["input_ids"].squeeze(0)
    attention_mask = encoding["attention_mask"].squeeze(0)
        
    
    return {
        "input_ids": input_ids,
        "attention_mask": attention_mask,
        "lengths_token": lengths_token,
        "lengths_sequences": lengths_sequences,
    }
def round_to_nearest_half_np(x, method='nearest'):
    """
    Vectorized rounding to nearest 0.5 for NumPy arrays.

    Parameters:
        x (array-like): Input number or array of numbers.
        method (str): 'nearest', 'up', or 'down'

    Returns:
        np.ndarray: Rounded numbers
    """
    x = np.asarray(x)  # Ensure input is a NumPy array

    if method == 'nearest':
        return np.round(x * 2) / 2
    elif method == 'up':
        return np.ceil(x * 2) / 2
    elif method == 'down':
        return np.floor(x * 2) / 2
    else:
        raise ValueError("Method must be 'nearest', 'up', or 'down'")
def get_overall_score(question, answer):
    extra_number = len(question.split()) + len(answer.split())
    tokenize_output = tokenize_inputs_pt(question, answer, bert_tokenizer)
    input_ids = tokenize_output["input_ids"].unsqueeze(0)
    attention_mask = tokenize_output["attention_mask"].unsqueeze(0)
    
    with torch.no_grad():  # No gradient computation during testing
        input_ids = input_ids.to(device)
        attention_mask = attention_mask.to(device)
        extra_number = extra_number.to(device)
        output = model(input_ids, attention_mask, extra_number)
        output = output.cpu().numpy()
        score = round_to_nearest_half_np(output, method='nearest')
    return score
question = 'Interview form the basic selection criteria for most large companies. However, some people think that interview is not a reliable method of choosing whom to employ and there are better methods. To what extent to you agree or disagree?'
answer = """On the one hand, many people agree with this statement for many noteworthy reasons. The most remarkable is that the recruiters can get an idea about the personalitty and skills of the potential employees .For instance,when the person is asked about any topic and he answers it in a concise and crisp manner,then the recruiter gets to know he is suitable for the job. Another key reason is that if a candidate is asked about case studies then the recruiters can judge the personality traits of that employee and also the ability to think outside the box.

On the other hand, other people disagree with this statement for many reasons. They believe that other modes of recruiting like written tests and group discussions will help understand the mindset in a better manner.Written tests help in evaluating the technical or theoretical knowlege of a person.

Group discussions help in getting a grasp of the conversational skills that he/she possesses.For example,in sales and marketing jobs conversational skills play a major role.  

 All in all, when all the specific reasons and relevant examples are considered and evaluated,  I strongly  agree with the idea supporting this statement because its benefits outweigh its drawbacks"""
score = get_overall_score(question, answer)
print(f"Predicted Score: {score}")



