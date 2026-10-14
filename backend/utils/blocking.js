const User = require("../models/User");

async function getBlockStatuses(userId, otherUserIds) {
  const otherIds = [...new Set(otherUserIds.map(String))];
  const ids = [...new Set([String(userId), ...otherIds])];
  const users = await User.find({ _id: { $in: ids } })
    .select("_id blockedUsers")
    .lean();
  const usersById = new Map(
    users.map((user) => [String(user._id), user])
  );
  const currentUser = usersById.get(String(userId));

  return new Map(
    otherIds.map((otherUserId) => {
      const otherUser = usersById.get(otherUserId);
      const blockedByMe = (currentUser?.blockedUsers || []).some(
        (blockedUserId) => String(blockedUserId) === otherUserId
      );
      const blockedMe = (otherUser?.blockedUsers || []).some(
        (blockedUserId) => String(blockedUserId) === String(userId)
      );

      return [otherUserId, {
        blockedByMe,
        blockedMe,
        isBlocked: blockedByMe || blockedMe,
      }];
    })
  );
}

function hideUserProfile(user) {
  if (!user) return user;

  const safeUser = user.toObject ? user.toObject() : { ...user };
  safeUser.fullName = "Unavailable user";
  safeUser.avatar = null;
  safeUser.status = "offline";
  safeUser.lastSeen = null;
  safeUser.profileHidden = true;
  delete safeUser.email;
  delete safeUser.phoneNumber;
  delete safeUser.bio;

  return safeUser;
}

module.exports = {
  getBlockStatuses,
  hideUserProfile,
};