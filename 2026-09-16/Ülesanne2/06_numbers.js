const minimumSeconds = 20;
const possibleValues = 21;
const waitSeconds = minimumSeconds + Math.floor(Math.random() * possibleValues);

console.log(`Wait ${waitSeconds} seconds.`);
console.log(`That is ${(waitSeconds / 60).toFixed(2)} minutes.`);
