const lapSeconds = [42, 39, 41];
lapSeconds.push(38);
let totalSeconds = 0;

for (const seconds of lapSeconds) {
  totalSeconds += seconds;
  console.log(`Lap: ${seconds} seconds`);
}

console.log(`Total: ${totalSeconds} seconds`);
