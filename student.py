class Student:
    def __init__(self, name):
        self.name = name
        self.questions_asked = 0
        self.quizzes_completed = 0

    def add_question(self):
        self.questions_asked += 1

    def add_quiz(self):
        self.quizzes_completed += 1