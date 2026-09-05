# CampusMate AI

CampusMate AI is an AI-powered study assistant developed in Python using the OpenAI API.

The application helps university students ask study-related questions, understand topics at different difficulty levels, summarize text, generate quizzes, take quizzes, review previous questions, and track learning statistics.

## Student

Asja Berisha

## Main Features

1. Ask AI a Question
2. Explain a Topic
3. Summarize Text
4. Generate Quiz
5. Take Quiz
6. View Previous Questions
7. View Statistics
8. Exit

## Technologies Used

- Python
- Flask
- OpenAI API
- JSON
- python-dotenv

## Installation

1. Download or clone the project.

2. Open the project folder in VS Code.

3. Create and activate a Python virtual environment.

4. Install the required dependencies:

pip install -r requirements.txt

## API Key Configuration

Create a `.env` file inside the main project folder.

Add the OpenAI API key:

OPENAI_API_KEY=your_api_key_here

The API key must not be written directly inside the Python source code.

The `.env` file is excluded from GitHub through `.gitignore`.

## How to Run

Open the terminal inside the project folder and run:

python main.py

The CampusMate AI menu will appear.

Choose an option from 1 to 8 and follow the instructions displayed in the terminal.

## Web Front Ends

This project now includes two browser front ends that share the same Python API:

1. Plain HTML/JavaScript version
2. React version

Install the web dependency:

pip install -r requirements.txt

Run the web app:

python web_app.py

Then open:

- `http://127.0.0.1:5000/` for the CampusMate AI landing page
- `http://127.0.0.1:5000/app/ask` for the plain HTML/JavaScript workspace
- `http://127.0.0.1:5000/react/ask` for the React workspace

The landing page links to dedicated Ask AI, Explain, Summarize, Quiz, History, and Stats pages.

## Data Storage

The application uses JSON files for persistent local storage.

- `history.json` stores previous questions and AI answers.
- `stats.json` stores learning and quiz statistics.

This allows data to remain available after the application is closed and reopened.

## OpenAI API Integration

The OpenAI API is used for multiple study features:

- Question answering
- Topic explanation
- Text summarization
- Quiz generation

Different prompt templates are used for different AI tasks.

Quiz scoring, input validation, statistics, and data storage are handled by Python rather than by the AI.

## Security and Responsible AI

The OpenAI API key is stored securely in a `.env` file and is not included in the source code.

For a different speed/cost tradeoff, set `CAMPUSMATE_MODEL` in `.env`. The default is `gpt-5.4-mini`.

Users should not enter passwords, private information, confidential information, or other sensitive data.

AI-generated information may contain mistakes. Important information should always be verified.

## Known Limitations

- An internet connection is required for features that use the OpenAI API.
- AI-generated responses may occasionally contain incorrect information.
- The current version uses a command-line interface.
- History and statistics are stored locally in JSON files.
- The quality of AI responses depends on the provided input and prompt.

## Project Structure

CampusMateAI/
- main.py
- web_app.py
- data_store.py
- ai_service.py
- student.py
- frontend/plain/
- frontend/react/
- history.json
- stats.json
- requirements.txt
- README.md
- .gitignore
- .env
