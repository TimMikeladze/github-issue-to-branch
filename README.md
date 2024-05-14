# github-issue-to-branch

A script that uses the Github CLI `gh` to automatically create and name new branches using an issue number.

## Usage

```bash
ghib <issue_number1> [<issue_number2> ...] [postfix]
```

## Example

```bash
# Assume the there in issue 123 with the title "implement feature x".
# A git branch named `123-implement-feature-x` will be created.
ghib 123

# You can also specify multiple issues
ghib 123 124 125

# And you can add a postfix to the branch name
ghib 123 testing
# The above command will create a branch named `123-implement-feature-x-testing`
```

## Installation

```bash
# make the script executable
chmod +x ghib.sh

# automatically add the script to an alias in your shell
./ghib.sh --setup
```
