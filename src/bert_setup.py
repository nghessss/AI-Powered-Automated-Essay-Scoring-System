import pandas as pd
from transformers import TFBertModel, BertTokenizer
import numpy as np
import tensorflow as tf
from typing import List
import pickle
from sklearn.preprocessing import StandardScaler

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
bert_model = TFBertModel.from_pretrained(config['bert_model_name'])
def tokenize_inputs(question, essay, tokenizer, max_length=768):
    """
    Tokenize question and essay as a single input with [SEP] separator.
    """
    encoding = tokenizer(
        question, essay,
        max_length=max_length,
        padding="max_length",  # Ensures padding to max_length
        truncation=True,  # We want truncation to happen for long inputs
        return_tensors="tf"
    )
    return {
        "input_ids": encoding["input_ids"],
        "attention_mask": encoding["attention_mask"]
    }
# def post_process(predicted_values: List[float]) -> List[float]:
#     """
#     Input is a list of predicted float values from 0 to 9
#     round the values to the nearest float [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9]
#     """
#     return [round(x*2)/2 for x in predicted_values]
def load_scaler(file_path):
    """
    Load the scaler from the given file path
    """
    with open(file_path, "rb") as f:
        scaler = pickle.load(f)
    return scaler
def setup_model():
    """
        Setup the BERT model with numerical features
        """
        # Define IELTS band score classes: 0.0 to 9.0 (0.5 increments)
    ielts_scores = tf.constant([i * 0.5 for i in range(19)])  # [0.0, 0.5, ..., 9.0]

    # Define input layers
    input_ids = tf.keras.layers.Input(shape=(config['max_seq_length'],), dtype=tf.int32, name="input_ids")
    numerical_features = tf.keras.layers.Input(shape=(1,), dtype=tf.float32, name="numerical_features")

    # BERT embedding layer
    bert_output = bert_model(input_ids)[0]  # Get full sequence output
    pooler_output = tf.keras.layers.Lambda(lambda x: x[:, 0, :], name="pooler_output")(bert_output)  # Extract [CLS] token

    # Normalize numerical features
    normalized_num_features = tf.keras.layers.BatchNormalization()(numerical_features)

    # Combine BERT output with numerical features
    concatenated_features = tf.keras.layers.Concatenate()([pooler_output, normalized_num_features])

    # Custom classification head (Softmax)
    dense_1 = tf.keras.layers.Dense(128, activation='relu')(concatenated_features)
    dropout_1 = tf.keras.layers.Dropout(0.3)(dense_1)
    dense_2 = tf.keras.layers.Dense(64, activation='relu')(dropout_1)
    dropout_2 = tf.keras.layers.Dropout(0.3)(dense_2)
    softmax_output = tf.keras.layers.Dense(19, activation='softmax', name="ielts_score_softmax")(dropout_2)
    bert_num_model = tf.keras.models.Model(inputs=[input_ids, numerical_features], outputs=softmax_output)

    bert_num_model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=config['learning_rate']),
        loss='sparse_categorical_crossentropy',  # Use sparse categorical cross-entropy
        metrics=['accuracy']
    )

    # Print model summary
    bert_num_model.summary()
    return bert_num_model

bert_num_model = setup_model()
bert_num_model.load_weights('models/training_bert_num/cp.ckpt')

scaler = load_scaler('models/scaler_config.pkl')
def predict_score(question, answer) -> float:
    """
    Predict the score of the given text
    """
    text = question + "\n" + answer
    len_essay = len(text.split())
    len_essay = scaler.transform([[len_essay]])
    input_ids = tokenize_inputs(question, answer, bert_tokenizer)
    predict = bert_num_model.predict([input_ids['input_ids'], len_essay])
    # final result in range [3]
    file_result = np.argmax(predict, axis=1) * 0.5
    return file_result 

question = str(input("Enter the question: "))
answer = str(input("Enter the answer: "))
print(predict_score(question, answer))

