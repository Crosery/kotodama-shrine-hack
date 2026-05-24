import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const filePath = path.join(root, "src", "scripts", "dialogue.story.json");
const raw = await fs.readFile(filePath, "utf8");
const story = JSON.parse(raw);

const errors = [];
if (!story?.startId) errors.push("startId 缺失");
if (!story?.nodes || typeof story.nodes !== "object") errors.push("nodes 缺失或非法");
if (story?.startId && !story.nodes?.[story.startId]) errors.push(`startId 不存在: ${story.startId}`);

for (const [id, node] of Object.entries(story.nodes ?? {})) {
  if (!node || node.id !== id) errors.push(`节点 id 不一致: key=${id} node.id=${node?.id}`);
  if (!node.npcText) errors.push(`节点 npcText 为空: ${id}`);
  if (!Array.isArray(node.replies) || node.replies.length === 0) errors.push(`节点 replies 为空: ${id}`);
  for (const reply of node.replies ?? []) {
    if (!reply?.id) errors.push(`reply.id 为空: node=${id}`);
    if (!reply?.label) errors.push(`reply.label 为空: node=${id} reply=${reply?.id}`);
    if (!reply?.nextId) errors.push(`reply.nextId 为空: node=${id} reply=${reply?.id}`);
    if (reply?.nextId && !story.nodes?.[reply.nextId]) errors.push(`reply.nextId 不存在: node=${id} reply=${reply?.id} next=${reply.nextId}`);
  }
  if (node.defaultNextId && !story.nodes?.[node.defaultNextId]) errors.push(`defaultNextId 不存在: node=${id} next=${node.defaultNextId}`);
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("dialogue.story.json 校验通过");

