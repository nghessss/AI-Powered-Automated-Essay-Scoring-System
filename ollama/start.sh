#!/bin/bash

# Start Ollama on all interfaces so it's reachable from outside the container
OLLAMA_HOST=0.0.0.0 ollama serve &

# Wait for the server to be ready
echo "Waiting for Ollama to be ready..."
until curl -s http://localhost:11434 > /dev/null; do
  sleep 1
done

echo "Creating model..."
ollama create gemma-3-essay -f models/MyUnslothModelfile.txt
echo "Model created."

# Keep container running
tail -f /dev/null