import EmojiPicker from 'emoji-picker-react';

export default function EmojiSelector({ onSelect }) {
  const handleEmojiClick = (emojiData) => {
    onSelect(emojiData.emoji);
  };

  return (
    <EmojiPicker
      onEmojiClick={handleEmojiClick}
      theme="dark"
      width={350}
      height={450}
      searchDisabled={false}
      skinTonesDisabled={false}
      previewConfig={{
        showPreview: false,
      }}
    />
  );
}