import { execSync } from "node:child_process";

// Define a function type for executing shell commands (for easier mocking)
type ExecCommand = (command: string) => string | null;

// Helper function to execute shell commands
export const execCommand: ExecCommand = (command: string): string | null => {
	try {
		return execSync(command, { stdio: "pipe" }).toString().trim();
	} catch (error) {
		return null;
	}
};

// Check if a command exists
export const commandExists = (cmd: string, exec: ExecCommand): boolean => {
	return !!exec(`command -v ${cmd}`);
};

// Check if required commands exist
export const checkDependencies = (exec: ExecCommand): void => {
	const deps = ["gh", "git"];
	const missingDeps = deps.filter((dep) => !commandExists(dep, exec));

	if (missingDeps.length > 0) {
		throw new Error(
			`The following required commands are missing: ${missingDeps.join(", ")}`,
		);
	}
};

// Function to slugify a string
export const slugify = (input: string): string => {
	return (
		input
			.normalize("NFD") // Normalize accented characters
			// biome-ignore lint/suspicious/noMisleadingCharacterClass: <explanation>
			.replace(/[\u0300-\u036f]/g, "") // Remove diacritics
			.replace(/[^a-zA-Z0-9]+/g, "-") // Replace non-alphanumeric characters with a dash
			.replace(/^-+|-+$/g, "") // Remove leading or trailing dashes
			.toLowerCase()
	);
};

// Function to fetch the title of a GitHub issue
export const fetchIssueTitle = (
	issueNumber: string,
	exec: ExecCommand,
): string | null => {
	const result = exec(`gh issue view ${issueNumber} --json title`);
	if (result) {
		try {
			const issueData = JSON.parse(result);
			return issueData.title || null;
		} catch {
			return null;
		}
	}
	return null;
};

// Function to create a new git branch
export const createBranch = (branchName: string, exec: ExecCommand): void => {
	exec(`git checkout -b ${branchName}`);
};

// Function to check if a branch exists
export const branchExists = (
	branchName: string,
	exec: ExecCommand,
): boolean => {
	return (
		exec(`git show-ref --verify --quiet refs/heads/${branchName}`) !== null
	);
};

// Function to create or switch to a branch
export const createOrSwitchBranch = (
	branchName: string,
	exec: ExecCommand,
): boolean => {
	if (branchExists(branchName, exec)) {
		exec(`git checkout ${branchName}`);
		return false; // Branch already existed
	}
	exec(`git checkout -b ${branchName}`);
	return true; // New branch created
};

// Main logic (exported for easier testing)
export const createGitBranchFromIssues = (
	args: string[],
	exec: ExecCommand,
): { branchName: string; created: boolean } => {
	checkDependencies(exec);

	if (args.length === 0) {
		throw new Error("No issue numbers provided.");
	}

	// biome-ignore lint/performance/useTopLevelRegex: <explanation>
	const postfix = args.every((arg) => /^\d+$/.test(arg))
		? ""
		: args.pop() || "";

	const sortedIssueNumbers = args
		// biome-ignore lint/performance/useTopLevelRegex: <explanation>
		.filter((arg) => /^\d+$/.test(arg))
		.sort((a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10));

	if (sortedIssueNumbers.length === 0) {
		throw new Error("No valid issue numbers provided.");
	}

	const issueNames = sortedIssueNumbers
		.map((issueNumber) => {
			const issueName = fetchIssueTitle(issueNumber, exec);
			if (!issueName) {
				throw new Error(`Issue ${issueNumber} not found.`);
			}
			return issueName;
		})
		.join(" and ");

	let slugifiedBranch = slugify(
		`${sortedIssueNumbers.join("-")} ${issueNames}`,
	);
	if (postfix) {
		slugifiedBranch += `-${slugify(postfix)}`;
	}
	// biome-ignore lint/performance/useTopLevelRegex: <explanation>
	slugifiedBranch = slugifiedBranch.replace(/-$/, "");

	const created = createOrSwitchBranch(slugifiedBranch, exec);

	console.log(
		`${created ? "Created new" : "Switched to"} branch: ${slugifiedBranch}`,
	);

	return { branchName: slugifiedBranch, created };
};
