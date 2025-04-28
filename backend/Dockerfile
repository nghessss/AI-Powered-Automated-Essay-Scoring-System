# 1. Base image with platform specification and Python 3.12
FROM --platform=linux/amd64 python:3.12-slim

# 2. Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 3. Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    unzip \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 4. Install Ollama CLI
RUN curl -fsSL https://ollama.com/install.sh | sh

# 5. Set working directory
WORKDIR /app

# 6. Copy your code into the container
COPY . /app

# 7. Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# 8. Copy and register your Ollama model
COPY models/MyUnslothModelfile /app/Modelfile
RUN ollama create gemma-3-essay -f /app/Modelfile

# 9. Expose the FastAPI port
EXPOSE 8000

# 10. Start Ollama and your FastAPI app
CMD ollama serve & python main.py