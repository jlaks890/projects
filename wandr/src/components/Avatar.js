export default function Avatar({ initials, color, size = 32, hasStory = false }) {
  const style = {
    width: size, height: size,
    background: color + '33',
    color,
    borderColor: hasStory ? color : 'transparent',
  };
  return (
    <div className={`story-avatar${hasStory ? ' has-story' : ''}`} style={style}>
      {initials}
    </div>
  );
}
