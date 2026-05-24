export type DialogueStory = {
  startId: string;
  nodes: Record<string, DialogueNode>;
};

export type DialogueNode = {
  id: string;
  chapter?: string;
  characterId?: string;
  npcText: string;
  replies: DialogueReply[];
  defaultNextId?: string;
};

export type DialogueReply = {
  id: string;
  label: string;
  emitText?: string;
  nextId: string;
};

export type DialogueRole = "npc" | "player" | "system";

export type DialogueMessage = {
  id: string;
  role: DialogueRole;
  text: string;
  createdAt: number;
  nodeId?: string;
};

export function getNode(story: DialogueStory, nodeId: string): DialogueNode | null {
  return story.nodes[nodeId] ?? null;
}

export function getReply(node: DialogueNode, replyId: string): DialogueReply | null {
  return node.replies.find((r) => r.id === replyId) ?? null;
}

export function resolveNextId(story: DialogueStory, currentNode: DialogueNode, replyId: string | null): string | null {
  if (replyId) {
    const reply = getReply(currentNode, replyId);
    if (!reply) return null;
    return reply.nextId;
  }

  if (currentNode.defaultNextId) return currentNode.defaultNextId;
  return currentNode.replies[0]?.nextId ?? null;
}

export function validateStory(story: DialogueStory): { ok: true } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  if (!story.startId || !story.nodes?.[story.startId]) errors.push(`startId 缺失或不存在: ${story.startId}`);

  for (const [id, node] of Object.entries(story.nodes ?? {})) {
    if (!node || node.id !== id) errors.push(`节点 id 不一致: key=${id} node.id=${node?.id}`);
    if (!node.npcText) errors.push(`节点 npcText 为空: ${id}`);
    if (!Array.isArray(node.replies) || node.replies.length === 0) errors.push(`节点 replies 为空: ${id}`);

    for (const reply of node.replies ?? []) {
      if (!reply.id) errors.push(`reply.id 为空: node=${id}`);
      if (!reply.label) errors.push(`reply.label 为空: node=${id} reply=${reply.id}`);
      if (!reply.nextId) errors.push(`reply.nextId 为空: node=${id} reply=${reply.id}`);
      if (reply.nextId && !story.nodes?.[reply.nextId]) errors.push(`reply.nextId 不存在: node=${id} reply=${reply.id} next=${reply.nextId}`);
    }

    if (node.defaultNextId && !story.nodes?.[node.defaultNextId]) errors.push(`defaultNextId 不存在: node=${id} next=${node.defaultNextId}`);
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true };
}

