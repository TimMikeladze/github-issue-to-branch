import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	branchExists,
	checkDependencies,
	commandExists,
	createBranch,
	createGitBranchFromIssues,
	createOrSwitchBranch,
	fetchIssueTitle,
	slugify,
} from "../src/index";

// Mock for the exec function
const mockExec = vi.fn();

describe("Command utilities", () => {
	beforeEach(() => {
		mockExec.mockClear();
		// Mock gh and git for every test case
		mockExec.mockImplementation((cmd) => {
			if (cmd.startsWith("command -v gh") || cmd.startsWith("command -v git")) {
				return "path/to/command";
			}
			return null;
		});
	});

	it("should check if a command exists", () => {
		expect(commandExists("gh", mockExec)).toBe(true);
		expect(commandExists("git", mockExec)).toBe(true);
		expect(commandExists("non-existent-command", mockExec)).toBe(false);
	});

	it("should check dependencies", () => {
		expect(() => checkDependencies(mockExec)).not.toThrow();

		mockExec.mockImplementation((cmd) => {
			if (cmd.startsWith("command -v gh")) {
				return "path/to/gh";
			}
			return null;
		});
		expect(() => checkDependencies(mockExec)).toThrow(
			"The following required commands are missing: git",
		);
	});
});

describe("String utilities", () => {
	it("should slugify strings correctly", () => {
		expect(slugify("Hello World!")).toBe("hello-world");
		expect(slugify("This is a test")).toBe("this-is-a-test");
		expect(slugify("Spécial Chàracters")).toBe("special-characters");
		expect(slugify("Multiple---Dashes")).toBe("multiple-dashes");
		expect(slugify("-Leading and Trailing-")).toBe("leading-and-trailing");
	});
});

describe("GitHub and Git operations", () => {
	beforeEach(() => {
		mockExec.mockClear();
		// Mock gh and git for every test case
		mockExec.mockImplementation((cmd) => {
			if (cmd.startsWith("command -v gh") || cmd.startsWith("command -v git")) {
				return "path/to/command";
			}
			return null;
		});
	});

	it("should check if a branch exists", () => {
		mockExec.mockImplementation((cmd) => {
			if (
				cmd.startsWith(
					"git show-ref --verify --quiet refs/heads/existing-branch",
				)
			) {
				return ""; // Branch exists
			}
			return null; // Branch doesn't exist
		});

		expect(branchExists("existing-branch", mockExec)).toBe(true);
		expect(branchExists("non-existing-branch", mockExec)).toBe(false);
	});

	it("should create a new branch if it doesn't exist", () => {
		mockExec.mockImplementation((cmd) => {
			if (cmd.startsWith("git show-ref --verify --quiet")) {
				return null; // Branch doesn't exist
			}
			return "";
		});

		const created = createOrSwitchBranch("new-branch", mockExec);
		expect(created).toBe(true);
		expect(mockExec).toHaveBeenCalledWith("git checkout -b new-branch");
	});

	it("should switch to an existing branch", () => {
		mockExec.mockImplementation((cmd) => {
			if (cmd.startsWith("git show-ref --verify --quiet")) {
				return ""; // Branch exists
			}
			return "";
		});

		const created = createOrSwitchBranch("existing-branch", mockExec);
		expect(created).toBe(false);
		expect(mockExec).toHaveBeenCalledWith("git checkout existing-branch");
	});

	it("should fetch issue title", () => {
		mockExec.mockImplementation((cmd) => {
			if (cmd.startsWith("gh issue view")) {
				return '{"title": "Test Issue"}';
			}
			return "path/to/command";
		});
		expect(fetchIssueTitle("123", mockExec)).toBe("Test Issue");

		mockExec.mockImplementation((cmd) => {
			if (cmd.startsWith("gh issue view")) {
				return '{"invalid": "json"}';
			}
			return "path/to/command";
		});
		expect(fetchIssueTitle("456", mockExec)).toBe(null);

		mockExec.mockImplementation((cmd) => {
			if (cmd.startsWith("gh issue view")) {
				return null;
			}
			return "path/to/command";
		});
		expect(fetchIssueTitle("789", mockExec)).toBe(null);
	});

	it("should create a new branch", () => {
		createBranch("test-branch", mockExec);
		expect(mockExec).toHaveBeenCalledWith("git checkout -b test-branch");
	});
});

describe("createGitBranchFromIssues", () => {
	beforeEach(() => {
		mockExec.mockClear();
		// Mock gh and git for every test case
		mockExec.mockImplementation((cmd) => {
			if (cmd.startsWith("command -v gh") || cmd.startsWith("command -v git")) {
				return "path/to/command";
			}
			return null;
		});
	});

	it("should create a branch from single issue", () => {
		mockExec.mockImplementation((cmd) => {
			if (cmd.startsWith("gh issue view")) {
				return '{"title": "Test Issue"}';
			}
			if (cmd.startsWith("git show-ref --verify --quiet")) {
				return null; // Branch doesn't exist
			}
			return "path/to/command";
		});

		const result = createGitBranchFromIssues(["123"], mockExec);

		expect(result.branchName).toBe("123-test-issue");
		expect(result.created).toBe(true);
		expect(mockExec).toHaveBeenCalledWith("git checkout -b 123-test-issue");
	});

	it("should switch to an existing branch", () => {
		mockExec.mockImplementation((cmd) => {
			if (cmd.startsWith("gh issue view")) {
				return '{"title": "Test Issue"}';
			}
			if (cmd.startsWith("git show-ref --verify --quiet")) {
				return ""; // Branch exists
			}
			return "path/to/command";
		});

		const result = createGitBranchFromIssues(["123"], mockExec);

		expect(result.branchName).toBe("123-test-issue");
		expect(result.created).toBe(false);
		expect(mockExec).toHaveBeenCalledWith("git checkout 123-test-issue");
	});

	it("should create a branch from multiple issues", () => {
		mockExec.mockImplementation((cmd) => {
			if (cmd.startsWith("gh issue view 123")) {
				return '{"title": "First Issue"}';
			}
			if (cmd.startsWith("gh issue view 456")) {
				return '{"title": "Second Issue"}';
			}
			if (cmd.startsWith("git show-ref --verify --quiet")) {
				return null; // Branch doesn't exist
			}
			return "path/to/command";
		});

		const result = createGitBranchFromIssues(["123", "456"], mockExec);

		expect(result.branchName).toBe("123-456-first-issue-and-second-issue");
		expect(result.created).toBe(true);
		expect(mockExec).toHaveBeenCalledWith(
			"git checkout -b 123-456-first-issue-and-second-issue",
		);
	});

	it("should handle postfix", () => {
		mockExec.mockImplementation((cmd) => {
			if (cmd.startsWith("gh issue view")) {
				return '{"title": "Test Issue"}';
			}
			if (cmd.startsWith("git show-ref --verify --quiet")) {
				return null; // Branch doesn't exist
			}
			return "path/to/command";
		});

		const result = createGitBranchFromIssues(
			["123", "custom-postfix"],
			mockExec,
		);

		expect(result.branchName).toBe("123-test-issue-custom-postfix");
		expect(result.created).toBe(true);
		expect(mockExec).toHaveBeenCalledWith(
			"git checkout -b 123-test-issue-custom-postfix",
		);
	});

	it("should throw error for missing dependencies", () => {
		mockExec.mockImplementation(() => null);

		expect(() => createGitBranchFromIssues(["123"], mockExec)).toThrow(
			"The following required commands are missing: gh, git",
		);
	});

	it("should throw error for no issue numbers", () => {
		expect(() => createGitBranchFromIssues([], mockExec)).toThrow(
			/No issue numbers provided.|You are not logged into Github CLI. Please run 'gh auth login'/,
		);
	});

	it("should throw error for invalid issue numbers", () => {
		expect(() => createGitBranchFromIssues(["abc"], mockExec)).toThrow(
			/No valid issue numbers provided.|You are not logged into Github CLI. Please run 'gh auth login'/,
		);
	});

	it("should throw error for non-existent issue", () => {
		mockExec.mockImplementation((cmd) => {
			if (cmd.startsWith("gh issue view")) {
				return null;
			}
			return "path/to/command";
		});

		expect(() => createGitBranchFromIssues(["123"], mockExec)).toThrow(
			"Issue 123 not found.",
		);
	});
});
