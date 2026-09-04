import json

from ai_service import ask_ai, explain_topic, summarize_text, generate_quiz
from student import Student


def load_history():
    try:
        with open("history.json", "r", encoding="utf-8") as file:
            return json.load(file)
    except FileNotFoundError:
        return []
    except json.JSONDecodeError:
        return []


def save_history(history):
    with open("history.json", "w", encoding="utf-8") as file:
        json.dump(history, file, indent=4, ensure_ascii=False)


def load_stats():
    try:
        with open("stats.json", "r", encoding="utf-8") as file:
            return json.load(file)
    except FileNotFoundError:
        return {
            "questions_asked": 0,
            "quizzes_completed": 0,
            "correct_answers": 0,
            "incorrect_answers": 0,
            "quiz_scores": []
        }
    except json.JSONDecodeError:
        return {
            "questions_asked": 0,
            "quizzes_completed": 0,
            "correct_answers": 0,
            "incorrect_answers": 0,
            "quiz_scores": []
        }


def save_stats(stats):
    with open("stats.json", "w", encoding="utf-8") as file:
        json.dump(stats, file, indent=4, ensure_ascii=False)


def ask_question(student):
    question = input("Ask AI a question: ")

    if question.strip() == "":
        print("Question cannot be empty.")
        return

    try:
        answer = ask_ai(question)

        print("\nCampusMate AI:")
        print(answer)

        history = load_history()

        history.append({
            "question": question,
            "answer": answer
        })

        save_history(history)

        stats = load_stats()
        stats["questions_asked"] += 1
        save_stats(stats)

        student.add_question()

        print("\nQuestion and answer saved successfully.")

    except Exception as error:
        print("\nSomething went wrong:")
        print(error)


def explain_a_topic():
    topic = input("Enter a topic: ")

    if topic.strip() == "":
        print("Topic cannot be empty.")
        return

    print("\nChoose difficulty level:")
    print("1. Beginner")
    print("2. Intermediate")
    print("3. Advanced")

    choice = input("Select a level: ")

    if choice == "1":
        level = "beginner"
    elif choice == "2":
        level = "intermediate"
    elif choice == "3":
        level = "advanced"
    else:
        print("Invalid level.")
        return

    try:
        answer = explain_topic(topic, level)

        print("\nCampusMate AI:")
        print(answer)

    except Exception as error:
        print("\nSomething went wrong:")
        print(error)


def summarize_a_text():
    text = input("Enter the text you want to summarize: ")

    if text.strip() == "":
        print("Text cannot be empty.")
        return

    print("\nChoose summary style:")
    print("1. Short")
    print("2. Detailed")
    print("3. Bullet Points")
    print("4. Beginner-Friendly")

    choice = input("Select a style: ")

    if choice == "1":
        style = "short"
    elif choice == "2":
        style = "detailed"
    elif choice == "3":
        style = "bullet points"
    elif choice == "4":
        style = "beginner-friendly"
    else:
        print("Invalid style.")
        return

    try:
        answer = summarize_text(text, style)

        print("\nCampusMate AI:")
        print(answer)

    except Exception as error:
        print("\nSomething went wrong:")
        print(error)


def generate_a_quiz():
    topic = input("Enter quiz topic: ")

    if topic.strip() == "":
        print("Topic cannot be empty.")
        return

    print("\nChoose difficulty level:")
    print("1. Beginner")
    print("2. Intermediate")
    print("3. Advanced")

    choice = input("Select a level: ")

    if choice == "1":
        level = "beginner"
    elif choice == "2":
        level = "intermediate"
    elif choice == "3":
        level = "advanced"
    else:
        print("Invalid level.")
        return

    number = input("Enter number of questions: ")

    if not number.isdigit():
        print("Please enter a valid number.")
        return

    number_of_questions = int(number)

    if number_of_questions <= 0:
        print("Number of questions must be greater than 0.")
        return

    try:
        quiz = generate_quiz(topic, level, number_of_questions)

        print("\nGenerated Quiz:\n")

        for index, question in enumerate(quiz["questions"], start=1):
            print(f"{index}. {question['question']}")

            for option_index, option in enumerate(
                question["options"],
                start=1
            ):
                print(f"   {option_index}. {option}")

            print()

    except Exception as error:
        print("\nSomething went wrong:")
        print(error)


def take_quiz(student):
    topic = input("Enter quiz topic: ")

    if topic.strip() == "":
        print("Topic cannot be empty.")
        return

    print("\nChoose difficulty level:")
    print("1. Beginner")
    print("2. Intermediate")
    print("3. Advanced")

    choice = input("Select a level: ")

    if choice == "1":
        level = "beginner"
    elif choice == "2":
        level = "intermediate"
    elif choice == "3":
        level = "advanced"
    else:
        print("Invalid level.")
        return

    number = input("Enter number of questions: ")

    if not number.isdigit():
        print("Please enter a valid number.")
        return

    number_of_questions = int(number)

    if number_of_questions <= 0:
        print("Number of questions must be greater than 0.")
        return

    try:
        quiz = generate_quiz(
            topic,
            level,
            number_of_questions
        )

        score = 0

        for index, question in enumerate(
            quiz["questions"],
            start=1
        ):
            print(f"\n{index}. {question['question']}")

            for option_index, option in enumerate(
                question["options"],
                start=1
            ):
                print(f"   {option_index}. {option}")

            answer = input("Your answer (1-4): ")

            if not answer.isdigit():
                print("Invalid answer.")
                continue

            user_answer_number = int(answer)

            if user_answer_number < 1 or user_answer_number > 4:
                print("Invalid answer. Choose 1, 2, 3, or 4.")
                continue

            user_answer = user_answer_number - 1
            correct_answer = question["correct_index"]

            if user_answer == correct_answer:
                print("Correct!")
                score += 1
            else:
                print("Incorrect.")
                print(
                    "Correct answer:",
                    question["options"][correct_answer]
                )

        total = len(quiz["questions"])

        if total == 0:
            print("No quiz questions were generated.")
            return

        percentage = (score / total) * 100

        print("\nQuiz completed.")
        print(f"Score: {score}/{total}")
        print(f"Percentage: {percentage:.1f}%")

        stats = load_stats()

        stats["quizzes_completed"] += 1
        stats["correct_answers"] += score
        stats["incorrect_answers"] += total - score
        stats["quiz_scores"].append(percentage)

        save_stats(stats)

        student.add_quiz()

    except Exception as error:
        print("\nSomething went wrong:")
        print(error)


def view_history():
    history = load_history()

    if len(history) == 0:
        print("No previous questions found.")
        return

    print("\nPrevious Questions:\n")

    for index, item in enumerate(history, start=1):
        print(f"{index}. Question:")
        print(item["question"])

        print("\nAnswer:")
        print(item["answer"])

        print("\n-----------------------------\n")


def view_statistics():
    stats = load_stats()

    scores = stats["quiz_scores"]

    if len(scores) > 0:
        average_score = sum(scores) / len(scores)
    else:
        average_score = 0

    print("\nLearning Statistics")
    print("-----------------------------")
    print("Questions asked:", stats["questions_asked"])
    print("Quizzes completed:", stats["quizzes_completed"])
    print("Correct answers:", stats["correct_answers"])
    print("Incorrect answers:", stats["incorrect_answers"])
    print(f"Average quiz score: {average_score:.1f}%")


def main_menu(student):
    print("\nAI-generated information may contain mistakes.")
    print("Verify important information and do not enter sensitive data.")

    while True:
        print("\n=================================")
        print("         CAMPUSMATE AI")
        print("=================================")
        print(f"Student: {student.name}")
        print("1. Ask AI a Question")
        print("2. Explain a Topic")
        print("3. Summarize Text")
        print("4. Generate Quiz")
        print("5. Take Quiz")
        print("6. View Previous Questions")
        print("7. View Statistics")
        print("8. Exit")

        choice = input("\nSelect an option: ")

        if choice == "1":
            ask_question(student)

        elif choice == "2":
            explain_a_topic()

        elif choice == "3":
            summarize_a_text()

        elif choice == "4":
            generate_a_quiz()

        elif choice == "5":
            take_quiz(student)

        elif choice == "6":
            view_history()

        elif choice == "7":
            view_statistics()

        elif choice == "8":
            print(f"\nGoodbye, {student.name}!")
            break

        else:
            print(
                "\nInvalid option. "
                "Please choose a number from 1 to 8."
            )


name = input("Enter your name: ")

while name.strip() == "":
    print("Name cannot be empty.")
    name = input("Enter your name: ")

student = Student(name)

print(f"\nWelcome, {student.name}!")

main_menu(student)