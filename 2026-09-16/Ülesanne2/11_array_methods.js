const recordings = [
  { seconds: 90, saved: true },
  { seconds: 240, saved: false },
  { seconds: 180, saved: true },
  { seconds: 300, saved: true }
];

const longSavedClips = recordings.filter((clip) => clip.saved && clip.seconds >= 120);
const minutes = longSavedClips.map((clip) => clip.seconds / 60);

console.log(longSavedClips); 
