# 🎋 GitHub Issue to Branch

CLI tool to quickly create well-named branches from GitHub issues. 

> 👋 Hello there! Follow me [@linesofcode](https://twitter.com/linesofcode) or visit [linesofcode.dev](https://linesofcode.dev) for more cool projects like this one.

## 🚀 Getting Started

```console
npm install -g github-issue-to-branch

pnpm add -g github-issue-to-branch

yarn global add github-issue-to-branch
```

> ⚠️ Prerequisites: You need to have `git` and `gh` ([Github CLI](https://github.com/cli/cli)) installed on your machine.


## 📖 Usage

Simply run the `ghib` command with the issue number(s) you want to create a branch from.

The command will create a new branch with the name in the following format: `<number>-<issue-title>`.

```console
ghib 1234
```


```console
Usage: github-issue-to-branch <issue-number> [<issue-number>...] [<postfix>]
   or: ghib <issue-number> [<issue-number>...] [<postfix>]

Create a Git branch from one or more GitHub issue numbers.

Arguments:
  <issue-number>  One or more GitHub issue numbers
  <postfix>       Optional postfix to add to the branch name

Examples:
  github-issue-to-branch 123 456
  ghib 789 quick-fix  # 'quick-fix' is an optional postfix

Note: The postfix is entirely optional. It can be used for any additional context
you want to add to your branch name, such as 'quick-fix', 'wip', or even your initials.
```

