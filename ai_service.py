import os
import json

from dotenv import load_dotenv
from openai import OpenAI


load_dotenv()

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)


def ask_ai(question):

    prompt = f"""
You are CampusMate AI, a helpful study assistant for university students.

Your task is to answer the student's question clearly and accurately.

Rules:
- Use clear and simple language.
- Explain step by step when necessary.
- Give one short example when useful.
- Do not invent information.
- If you are unsure, clearly say that.
- Do not ask for passwords or sensitive personal information.

Student question:
{question}
"""

    response = client.responses.create(
        model="gpt-5.4-mini",
        input=prompt
    )

    print("\n--- API TOKEN USAGE ---")
    print("Input tokens:", response.usage.input_tokens)
    print("Output tokens:", response.usage.output_tokens)
    print("Total tokens:", response.usage.total_tokens)

    return response.output_text


def explain_topic(topic, level):

    prompt = f"""
You are CampusMate AI, a university study tutor.

Explain the following topic for a {level} student.

Rules:
- Match the explanation to the selected difficulty level.
- Use clear and accurate language.
- Explain step by step when needed.
- Give one short example.
- Finish with three key points.
- Finish with one practice question.
- Do not invent information.

Topic:
{topic}
"""

    response = client.responses.create(
        model="gpt-5.4-mini",
        input=prompt
    )

    print("\n--- API TOKEN USAGE ---")
    print("Input tokens:", response.usage.input_tokens)
    print("Output tokens:", response.usage.output_tokens)
    print("Total tokens:", response.usage.total_tokens)

    return response.output_text


def summarize_text(text, style):

    prompt = f"""
You are CampusMate AI, a study summarization assistant.

Summarize the following text using the selected style: {style}.

Rules:
- Keep the important ideas.
- Do not invent information.
- Do not add facts that are not in the original text.
- Make the summary clear and easy to understand.
- Follow the selected summary style exactly.

Text:
{text}
"""

    response = client.responses.create(
        model="gpt-5.4-mini",
        input=prompt
    )

    print("\n--- API TOKEN USAGE ---")
    print("Input tokens:", response.usage.input_tokens)
    print("Output tokens:", response.usage.output_tokens)
    print("Total tokens:", response.usage.total_tokens)

    return response.output_text


def generate_quiz(topic, level, number_of_questions):

    prompt = f"""
You are CampusMate AI, a quiz generator for university students.

Create exactly {number_of_questions} multiple-choice questions about the topic below.

Topic:
{topic}

Difficulty level:
{level}

Rules:
- Create exactly {number_of_questions} questions.
- Each question must have exactly 4 answer options.
- Only one option can be correct.
- Match the difficulty to the selected level.
- Use clear and accurate language.
- Return ONLY valid JSON.
- Do not include markdown.
- Do not include text before or after the JSON.

Use this exact format:

{{
  "questions": [
    {{
      "question": "Question text",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "correct_index": 0
    }}
  ]
}}
"""

    response = client.responses.create(
        model="gpt-5.4-mini",
        input=prompt
    )

    print("\n--- API TOKEN USAGE ---")
    print("Input tokens:", response.usage.input_tokens)
    print("Output tokens:", response.usage.output_tokens)
    print("Total tokens:", response.usage.total_tokens)

    quiz_data = json.loads(response.output_text)

    return quiz_data