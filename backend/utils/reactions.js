function formatReactions(reactions, userId) {
  return (reactions || [])
    .filter((reaction) => reaction.users?.length)
    .map((reaction) => ({
      emoji: reaction.emoji,
      count: reaction.users.length,
      reacted: reaction.users.some(
        (reactionUserId) => String(reactionUserId) === String(userId)
      ),
    }));
}

module.exports = { formatReactions };