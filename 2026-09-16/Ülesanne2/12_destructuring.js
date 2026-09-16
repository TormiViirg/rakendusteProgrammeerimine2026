const measurements = [14, 18, 22];
const [firstReading, ...laterReadings] = measurements;
const extendedReadings = [firstReading, ...laterReadings, 26];

console.log(firstReading);
console.log(laterReadings);
console.log(extendedReadings);
console.log(measurements); 

const oven = { temperature: 180, minutes: 25 };
const { temperature, minutes } = oven;
const longerBake = { ...oven, minutes: minutes + 5 };

console.log(`Bake at ${temperature} degrees for ${minutes} minutes.`);
console.log(longerBake); 
console.log(oven); 
