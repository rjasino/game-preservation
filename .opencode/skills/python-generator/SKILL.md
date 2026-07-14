---
name: python-generator
description: A skill that generates Python code snippets based on user input.
---

## Example of Simple Syntax

Below are some examples of simple syntax that can be used in the Python Generator skill:

### Variables and Data Types

```python
# 1. String (Text)
user_name = "Alex"

# 2. Integer (Whole numbers)
user_age = 25

# 3. Float (Decimal numbers)
user_height = 1.75

# 4. Boolean (True or False)
is_student = True

# Checking data types using type()
print(type(user_name))    # Output: <class 'str'>
print(type(user_age))     # Output: <class 'int'>

```

### Basic Output

```python
# Simple string print
print("Hello, World!")

# Printing multiple variables together
print("Name:", user_name, "| Age:", user_age)

# Using an f-string (formatted string) to inject variables directly
print(f"Hello {user_name}, you are {user_age} years old.")

```

### Basic Input

```python
# Taking string input
favorite_food = input("Enter your favorite food: ")
print(f"You love eating {favorite_food}!")

# Taking numerical input (requires casting/conversion)
user_birth_year = int(input("Enter your birth year: "))
current_year = 2026
calculated_age = current_year - user_birth_year
print(f"You will turn {calculated_age} this year.")

```

### Conditional Statements

Below are combination of examples of conditional statements in Python:

#### If-Else

```python
if user_age >= 18:
    print("You are an adult.")
else:
    print("You are a minor.")
```

#### If-Elif-Else

```python
# Getting a number from the user
score = float(input("Enter your exam score (0-100): "))

# Decision making using if, elif, and else
if score >= 90:
    print("Grade: A")
elif score >= 80:
    print("Grade: B")
elif score >= 70:
    print("Grade: C")
else:
    print("Grade: F")

```

#### Switch-Case (Using Dictionary Mapping)

> Use this method for Python version older than 3.10.

```python
# Python does not have a built-in switch-case statement, but we can use a dictionary to simulate it.
def get_lunar_zodiac(year):
    zodiac_dictionary = {
        0: "Monkey", 1: "Rooster", 2: "Dog", 3: "Pig",
        4: "Rat", 5: "Ox", 6: "Tiger", 7: "Rabbit",
        8: "Dragon", 9: "Snake", 10: "Horse", 11: "Goat"
    }
    # .get() returns a default value if the key is not found
    return zodiac_dictionary.get(year % 12, "Unknown")

```

#### Switch-Case (Using Match-Case)

> Use this method for Python version 3.10 and above.

```python
def get_day_type(day):
    match day.lower():
        case "monday" | "tuesday" | "wednesday" | "thursday" | "friday":
            return "Weekday"
        case "saturday" | "sunday":
            return "Weekend"
        case _:
            return "Invalid day entered"

# Testing the function
user_day = input("Enter a day of the week: ")
print(f"That is a {get_day_type(user_day)}.")

```

### Looping Statements

Below are combination of examples of looping statements in Python:

#### For Loop

> Using range() for numeric iteration and iterating over a list.

```python
print("Counting from 1 to 5:")
for i in range(1, 6):
    print(i)
```

> Using collections like lists for iteration.

```python
fruits = ["apple", "banana", "cherry"]

for fruit in fruits:
    print(fruit)
```

> Using dictionary items for iteration.

```python
user_roles = {"Admin": "Alice", "Editor": "Bob"}
for role, name in user_roles.items():
    print(f"{name} is an {role}")

```

#### While Loop

```python
# Runs continuously as long as a condition is True
countdown = 3
print("Starting countdown...")
while countdown > 0:
    print(countdown)
    countdown -= 1  # Decreases countdown by 1 each loop
print("Blast off!")
```

### Functions

```python
def greet_user(username):
    return f"Hello, {username}!"

# Calling the function
print(greet_user("Alex"))

```
