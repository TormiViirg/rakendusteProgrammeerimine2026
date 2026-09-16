const fullCharge = 100;
let batteryCharge = 65;

batteryCharge -= 12;
console.log(`Charge remaining: ${batteryCharge}%`); 
console.log(`Charge needed: ${fullCharge - batteryCharge}%`);
