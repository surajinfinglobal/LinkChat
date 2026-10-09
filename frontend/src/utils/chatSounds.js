const sentSound = new Audio('/sounds/message-sent.mp3');
const receivedSound = new Audio('/sounds/message-received.mp3');

sentSound.volume = 0.5;
receivedSound.volume = 0.5;

const notificationsEnabled = () => {
  try {
    const settings = JSON.parse(localStorage.getItem('linkchat-notifications') || '{}');
    return settings.messages !== false && settings.sound !== false;
  } catch {
    return true;
  }
};

export const playSentSound = () => {
  if (!notificationsEnabled()) return;
  sentSound.currentTime = 0;
  sentSound.play().catch(() => {});
};

export const playReceivedSound = () => {
  if (!notificationsEnabled()) return;
  receivedSound.currentTime = 0;
  receivedSound.play().catch(() => {});
};