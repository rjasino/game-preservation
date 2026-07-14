---
name: bash-generator
description: A skill that generates Bash code snippets based on user input.
---

## Example of Simple Syntax

Below are some examples of simple syntax that can be used in the Bash Generator skill:

### Commands

```bash
ls                          # List files and directories in the current location
pwd                         # Print the current working directory
echo "Hello, World!"         # Output a string to the console
echo -e "\e[32mSuccess!\e[0m"  # Prints in Green
cat file.txt                # Display the contents of file.txt
```

### Variables and Data Types

```bash
name="John Doe"              # String
age=30                       # Integer
isDeveloper=true             # Boolean (true or false)
tools=("node" "npm")  # Array (separated by spaces, not commas)
```

### Assignment

```bash
file_name="file name with spaces.txt"
# This will not work as expected, as it will be split into multiple arguments
echo $file_name
# To handle spaces in variable values, use quotes
echo "$file_name"
```

### Conditional

#### If-Else

```bash
if [ $age -ge 18 ]; then
    echo "You are an adult."
else
    echo "You are a minor."
fi
```

#### If-Elif-Else

```bash
if [ $age -lt 18 ]; then
    echo "You are a minor."
elif [ $age -eq 18 ]; then
    echo "You are exactly 18."
else
    echo "You are an adult."
fi
```

#### If-Else with Logical Operators

```bash
if [ $age -ge 18 ] && [ $isDeveloper == true ]; then
    echo "You are an adult and a developer."
else
    echo "You are either not an adult or not a developer."
fi
```

#### If-Else with String Comparison

```bash
if [ "$name" == "John Doe" ]; then
    echo "Hello, John!"
else
    echo "You are not John."
fi
```

#### Switch

```bash
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

```bash
for i in {0..4}; do
    echo "Iteration: $i"
done
```

#### Foreach

```bash
for tool in "${tools[@]}"; do
    echo "Tool: $tool"
done
```

#### While

```bash
count=0
while [ $count -lt 5 ]; do
    echo "Count: $count"
    ((count++))
done
```

### Functions

```bash
greet_user() {
    local name="$1"
    echo "Hello, $name!"
}
greet_user "Alice"
```

## Rules

- Use this skill when the machine is running Linux.
- **Strictly follow** the simple syntax when generating the code.
