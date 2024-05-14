#!/bin/bash

# Check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if required commands exist
check_dependencies() {
    local deps=("gh" "jq" "iconv" "git")
    local missing_deps=()

    for dep in "${deps[@]}"; do
        command_exists "$dep" || missing_deps+=("$dep")
    done

    if [ ${#missing_deps[@]} -gt 0 ]; then
        echo "Error: The following required commands are missing:"
        for dep in "${missing_deps[@]}"; do
            echo "  $dep"
        done
        echo "Please install them and try again."
        exit 1
    fi
}

# Function to slugify a string
slugify() {
    echo "$1" | iconv -t ascii//TRANSLIT | sed -E 's/[^a-zA-Z0-9]+/-/g' | sed -E 's/^-*//;s/-*$//;s/-+/-/g' | tr A-Z a-z
}

# Function to create a new git branch
create_branch() {
    branch_name="$1"
    git checkout -b "$branch_name"
}

# Function to add alias to .bashrc or .zshrc
add_alias_to_rc() {
    local rc_file alias_name script_path
    script_path="$(realpath "$0")"  # Get the full path of the script

    if [ -f "$HOME/.zshrc" ]; then
        rc_file="$HOME/.zshrc"
    elif [ -f "$HOME/.bashrc" ]; then
        rc_file="$HOME/.bashrc"
    else
        echo "Error: Neither .bashrc nor .zshrc found in your home directory."
        exit 1
    fi

    # Prompt the user for a custom alias
    read -rp "Enter your preferred alias (default is 'ghib'): " alias_name
    alias_name="${alias_name:-ghib}"

    # Prompt the user
    read -p "Do you want to add the alias '$alias_name' to your shell configuration file? (y/n): " confirm
    if [ "$confirm" == "y" ] || [ "$confirm" == "Y" ] || [ -z "$confirm" ]; then
        echo "alias $alias_name='$script_path'" >> "$rc_file"
        echo "Alias added. You can now use '$alias_name' command to run this script."
        echo "Please run 'source $rc_file' to activate the changes or open a new terminal session."
    elif [ "$confirm" == "n" ] || [ "$confirm" == "N" ]; then
        echo "Alias not added. You can manually add the alias '$alias_name' to your shell configuration file if needed."
    else
        echo "Invalid input. Alias not added. You can manually add the alias '$alias_name' to your shell configuration file if needed."
    fi
}

# Error message function
error() {
    echo "Error: $1"
    exit 1
}

# Check if required commands exist
check_dependencies

# Check if --setup flag is provided
if [ "$1" == "--setup" ]; then
    add_alias_to_rc "$2"
    exit 0
fi

# Check if at least one argument is provided
[ $# -lt 1 ] && error "Usage: ghib [--setup [alias]] <issue_number1> [<issue_number2> ...] [postfix]"

# Extract postfix (if provided)
postfix=""
if [[ ! $@ =~ ^[0-9]+$ ]]; then
    postfix="${@: -1}"
    if [[ "$postfix" =~ ^[0-9]+$ ]]; then
        unset 'ARGV[$#]'
        postfix=""
    fi
fi

# Extract issue numbers from arguments and sort them in ascending order
sorted_issue_numbers=($(for arg; do [[ "$arg" =~ ^[0-9]+$ ]] && echo "$arg"; done | sort -n))

# Check if there are any issue numbers provided
[ ${#sorted_issue_numbers[@]} -eq 0 ] && error "No valid issue numbers provided."

# Retrieve the names of the GitHub issues
issue_names=""
for issue_number in "${sorted_issue_numbers[@]}"; do
    issue_name=$(gh issue view "$issue_number" --json title 2>/dev/null | jq -r '.title')
    [ -z "$issue_name" ] && echo "Error: Issue $issue_number not found." && continue
    if [ -z "$issue_names" ]; then
        issue_names="$issue_name"
    else
        issue_names+=" and $issue_name"
    fi
done

# Slugify and lowercase the branch name
slugified_branch=$(slugify "${sorted_issue_numbers[*]}")-$(slugify "${issue_names[*]}")

# Add postfix if provided
if [ -n "$postfix" ]; then
    slugified_branch+=" $postfix"
fi

slugified_branch=$(slugify "$slugified_branch")

# Remove trailing hyphen if there's no postfix
slugified_branch=${slugified_branch%-}

# Show the proposed branch name to the user
echo "Proposed branch name: $slugified_branch"

# Prompt the user for confirmation
read -rp "Do you want to create this branch? (y/n): " confirm
[[ "$confirm" != [Yy] ]] && exit 0

# Create a new git branch
create_branch "$slugified_branch"

echo "Created branch '$slugified_branch'"
