#!/usr/bin/env node

import { createGitBranchFromIssues, execCommand } from "./index";

const usage = `
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
`;

const args = process.argv.slice(2);

if (args.length === 0 || args.includes("-h") || args.includes("--help")) {
	console.log(usage);
	process.exit(0);
}

try {
	const branchName = createGitBranchFromIssues(args, execCommand);
} catch (error) {
	if (error instanceof Error) {
		console.error(`Error: ${error.message}`);
	} else {
		console.error("An unknown error occurred");
	}
	process.exit(1);
}
