function minutesToSeconds(minutes) {
  return minutes * 60;
}

function showTimer(seconds) {
  console.log(`Timer set for ${seconds} seconds.`);
}

const duration = minutesToSeconds(3);
const result = showTimer(duration);
console.log(duration); 
console.log(typeof result);
