---
name: zsh-generator
description: A skill that generates Zsh code snippets based on user input.
---

## Example of Simple Syntax

Below are some examples of simple syntax that can be used in the Zsh Generator skill:

### Commands

```zsh
ls                          # List files and directories in the current location
pwd                         # Print the current working directory
echo "Hello, World!"         # Output a string to the console
echo -e "\e[32mSuccess!\e[0m"  # Prints in Green
cat file.txt                # Display the contents of file.txt
```

### Variables and Data Types

```zsh
name="John Doe"              # String
age=30                       # Integer
isDeveloper=true             # Boolean (true or false)
tools=("node" "npm")  # Array (separated by spaces, not commas)
```

> note: Zsh is 1-based indexing, so the first element of an array is accessed with index 1, not 0.

### Conditional

#### If-Else

```zsh
if [ $age -ge 18 ]; then
    echo "You are an adult."
else
    echo "You are a minor."
fi
```

#### If-Elif-Else

```zsh
if [ $age -lt 18 ]; then
    echo "You are a minor."
elif [ $age -eq 18 ]; then
    echo "You are exactly 18."
else
    echo "You are an adult."
fi
```

#### If-Else with Logical Operators

```zsh
if [ $age -ge 18 ] && [ $isDeveloper == true ]; then
    echo "You are an adult and a developer."
else
    echo "You are either not an adult or not a developer."
fi
```

#### If-Else with String Comparison

```zsh
if [ "$name" = "John Doe" ]; then
    echo "Hello, John Doe!"
else
    echo "You are not John Doe."
fi
```

#### Switch

```zsh
case $age in
    [0-17])
        echo "You are a minor."
        ;;
    18)
        echo "You are exactly 18."
        ;;
    *)
        echo "You are an adult."
        ;;
esac
```

### Looping

#### For

```zsh
for i in {1..5}; do
    echo "Iteration: $i"
done
```

#### Foreach

```zsh
for tool in "${tools[@]}"; do
    echo "Tool: $tool"
done
```

#### While

```zsh
count=1
while [ $count -le 5 ]; do
    echo "Iteration: $count"
    ((count++))
done
```

### Functions

```zsh
greet() {
    local name=$1
    echo "Hello, $name!"
}
greet "John Doe"  # Call the function with an argument
```

## Rules

- Use this skill when the machine is running MacOS.
- **Strictly follow** the simple syntax when generating the code.
