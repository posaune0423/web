import { $ } from "bun";
import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `You are a PR summary generator that creates accurate, well-structured PR summaries in markdown format.

IMPORTANT:
- Only use information that is explicitly present in the git diff
- Do not make assumptions or add information not in the diff
- Be precise about file changes and modifications

Formatting Requirements:
1. Use collapsible sections with <details> tags for long content
2. Create tables for structured data
3. Use checkboxes for changes that are evident in the diff
4. Use appropriate emojis for section headers
5. Show exact file paths and changes

Required Sections:

# 🔄 [PR Title based on main changes]

## 📝 Overview
Brief, accurate description based on the actual changes in the diff.

<details>
<summary>📁 Changed Files</summary>
List ONLY files that appear in the diff, with their exact paths.
Include the type of change (Modified/Added/Deleted) and a brief note about what changed.

Example:
| File | Change | Description |
|------|--------|-------------|
| src/components/Header.tsx | Modified | Updated wallet connection logic |
</details>

<details>
<summary>🔍 Detailed Changes</summary>
List specific changes found in the diff, using checkboxes.
</details>

## ✅ Testing Focus
List areas that should be tested based on the actual changes.

Remember:
- Only include information that can be derived from the diff
- Use exact file paths and changes
- Be specific about modifications
- Avoid assumptions or speculations`;

async function getDiff(): Promise<string> {
  try {
    // Get base branch
    const baseBranch =
      await $`git show-branch | grep '*' | grep -v "$(git rev-parse --abbrev-ref HEAD)" | head -1 | awk -F'[]~^[]' '{print $2}'`
        .text()
        .then((text) => text.trim());

    console.log(`📦 Base branch detected: ${baseBranch}`);

    // Generate diff and format as markdown
    const diff = await $`git diff origin/${baseBranch}...HEAD`.text().then((text) =>
      text
        .split("\n")
        .reduce((acc, line) => (line.startsWith("diff --git") ? acc + "\n```diff\n" + line : acc + "\n" + line), "")
        .concat("\n```"),
    );

    return diff;
  } catch (error) {
    console.error("Error getting git diff:", error);
    throw error;
  }
}

async function generatePRSummary(diffContent: string): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY environment variable is not set");
  }

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  try {
    const msg = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 2000,
      temperature: 0,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Generate a PR summary from this git diff:\n\n${diffContent}`,
            },
          ],
        },
      ],
    });

    return msg.content[0].type === "text" ? msg.content[0].text : "";
  } catch (error) {
    console.error("Error generating PR summary:", error);
    throw error;
  }
}

// クロスプラットフォーム対応が必要な場合
const copyToClipboard = async (text: string) => {
  switch (process.platform) {
    case "darwin":
      await $`echo ${text} | pbcopy`;
      break;
    case "win32":
      await $`echo ${text} | clip`;
      break;
    case "linux":
      await $`echo ${text} | xclip -selection clipboard`;
      break;
    default:
      throw new Error(`Unsupported platform: ${process.platform}`);
  }
};

async function main() {
  try {
    // Check if we're in a git repository
    await $`git rev-parse --is-inside-work-tree`.quiet();

    console.log("🔍 Getting git diff...");
    const diff = await getDiff();

    console.log("🤖 Generating PR summary...");
    const summary = await generatePRSummary(diff);

    // Copy to clipboard using pbcopy
    await copyToClipboard(summary);

    console.log(summary);
    console.log("\n📝 PR Summary has been copied to clipboard!");
    console.log("\nPreview of the summary:\n");
  } catch (error) {
    if (error instanceof Error) {
      console.error("❌ Error:", error.message);
    } else {
      console.error("❌ Unknown error occurred");
    }
    process.exit(1);
  }
}

main();
