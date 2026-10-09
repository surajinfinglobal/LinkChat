const DEFAULT_PRIVACY = {
  lastSeen: "everyone",
  onlineStatus: true,
  photoVisibility: "everyone",
  readReceipts: true,
};

const getPrivacy = (user) => ({
  ...DEFAULT_PRIVACY,
  ...(user?.privacy || {}),
});

const canView = (visibility, isContact) =>
  visibility === "everyone" || (visibility === "contacts" && isContact);

const sanitizeUserForViewer = (user, viewerId, isContact = false) => {
  if (!user) return user;

  const safeUser = typeof user.toObject === "function"
    ? user.toObject()
    : { ...user };
  const isSelf = String(safeUser._id || safeUser.id) === String(viewerId);
  const privacy = getPrivacy(safeUser);

  delete safeUser.privacy;

  if (isSelf) return safeUser;

  if (!canView(privacy.photoVisibility, isContact)) {
    safeUser.avatar = null;
  }

  if (!canView(privacy.lastSeen, isContact)) {
    safeUser.lastSeen = null;
  }

  if (!privacy.onlineStatus) {
    safeUser.status = "offline";
  }

  return safeUser;
};

module.exports = {
  DEFAULT_PRIVACY,
  getPrivacy,
  canView,
  sanitizeUserForViewer,
};