## AI-Powered Automated Essay Scoring System for IELTS Task 2

This project presents an AI-powered system designed to automatically score essays written for the IELTS Academic Writing Task 2. The goal is to provide students with instant and consistent feedback on their writing, helping them to identify areas for improvement and practice effectively for the exam.

The system leverages advanced natural language processing (NLP) and machine learning techniques to evaluate essays based on criteria relevant to IELTS Task 2, such as:

* Task Achievement/Response
* Coherence and Cohesion
* Lexical Resource
* Grammatical Range and Accuracy

### Features

* Automated scoring of IELTS Task 2 essays.
* Detailed feedback and breakdown based on IELTS criteria.
* Grammar error detection and suggestions.
* Provides an overall score estimation.
* Web-based interface for easy access.

### Technologies Used

**Frontend:**

* Next.js

**Backend:**

* FastAPI
* MongoDB

**AI Techniques**

The core of this system relies on a combination of powerful AI models and techniques, each contributing to different aspects of the essay scoring and feedback process:

* **BERT Finetuning:** Utilized for grading the **overall essay score** by analyzing the text's content and structure based on trained models.
* **Gemma 3 Finetuning:** Employed to generate comprehensive **feedback and a breakdown** of the essay's performance across different IELTS criteria.
* **CoEdit:** Integrated to **detect grammar errors** within the essay and potentially offer suggestions for correction.
* **Gemini API:** Leveraged for tasks such as **formatting the structure** of the feedback or ensuring the output is well-organized and easy to understand.

### Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

#### Prerequisites

* Node.js and npm (if not using Docker)
* Python 3.x and pip (if not using Docker)
* Docker and Docker Compose (recommended)
* Access to the Gemini API
* Google Cloud SDK (for deployment to Cloud Run)

#### Configuration

The application requires several environment variables to be set for proper functioning. It is recommended to use a `.env` file in the root of the project for local development (this file should not be committed to version control). For deployment, these variables should be configured in your deployment environment (e.g., Google Cloud Run).

Here is a list of the required environment variables:

* `IELTS_HUGGINGFACE_API_KEY`: API key for accessing Hugging Face models used in the IELTS scoring (e.g., for BERT or Gemma).
* `OLLAMA_URL`: URL for the Ollama service if used for any local language model inference.
* `MAX_RETRIES`: Maximum number of retries for API calls that might fail.
* `RETRY_DELAY`: Delay in seconds between retries for API calls.
* `GEMINI_API_KEY`: Your primary API key for accessing the Gemini API.
* `GEMINI_API_KEY_2`: Secondary API key for Gemini API (if using multiple keys for rate limiting or other purposes).
* `GEMINI_API_KEY_3`: Tertiary API key for Gemini API (if using multiple keys).
* `BAND_DISCRIPTIOR_FILE`: Path to a file containing the IELTS band descriptors or scoring guidelines used by the system.
* `MONGODB_URI`: Connection string for your MongoDB database.
* `MONGODB_DB_NAME`: The name of the database to use in MongoDB.
* `NEXT_PUBLIC_API_URL`: The public URL where the backend API is accessible from the frontend.

#### Installation

1.  Clone the repository:

    ```bash
    git clone [https://github.com/your-username/AI-Powered-Automated-Essay-Scoring-System.git](https://github.com/your-username/AI-Powered-Automated-Essay-Scoring-System.git)
    ```

2.  Navigate to the project directory:

    ```bash
    cd AI-Powered-Automated-Essay-Scoring-System
    ```

3.  Create a `.env` file in the root of the project and add the environment variables listed in the [Configuration](#configuration) section with their appropriate values.

4.  If you are **not** using Docker, set up the frontend and backend dependencies:

    ```bash
    cd frontend
    npm install
    cd ../backend
    pip install -r requirements.txt
    ```


#### Usage

You can run the application using Docker Compose (recommended) or by starting the frontend and backend separately. Ensure your environment variables are configured as described in the [Configuration](#configuration) section.

**Using Docker Compose (Recommended)**

This method will build and run both the frontend and backend services, using Docker.


    ```bash
    docker-compose up --build
    ```


**Running Frontend and Backend Separately**

If you prefer to run the services directly on your machine without Docker, follow these steps:

1.  Ensure your environment variables are loaded into your shell session (e.g., by sourcing your `.env` file if your OS supports it, or manually setting them).
2.  [Add instructions for starting MongoDB locally if not using Docker]
3.  Start the frontend:

    ```bash
    cd frontend
    npm run dev
    ```

    The frontend should now be running, typically at `http://localhost:3000` or similar (default for Next.js).

4.  Start the backend:

    ```bash
    cd backend
    uvicorn main:app --reload
    ```
    (Assuming your main FastAPI file is `main.py` and the FastAPI app instance is named `app`)

    The backend server should now be running, typically at `http://localhost:8080` or similar (default for FastAPI's uvicorn).

5.  Open your web browser and navigate to the frontend address (`http://localhost:3000` or the address shown in your terminal) to access the application.



### Contributing

Contributions are welcome! Please follow these steps to contribute:

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix.
3.  Make your changes and commit them with clear messages.
4.  Push your changes to your fork.
5.  Create a pull request detailing your changes.

