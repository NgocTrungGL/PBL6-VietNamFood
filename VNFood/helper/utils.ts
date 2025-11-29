const getYouTubeVideoId = (url: string | null) => {
  if (!url) return null;
  // Regex để bắt các dạng link: youtube.com/watch?v=ID, youtu.be/ID, v.v.
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};
export { getYouTubeVideoId };
