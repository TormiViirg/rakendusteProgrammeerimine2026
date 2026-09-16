const temperature = 18.5;
const unit = "C";
const connected = true;
let nextReading;
const error = null;
const readings = [18.5, 19, 18];

console.log(typeof temperature); 
console.log(typeof unit); 
console.log(typeof connected); 
console.log(typeof nextReading); 
console.log(typeof error); 
console.log(Array.isArray(readings)); 

function readSlot(index) {
  return readings[index];
}
console.log(readSlot(9)); 
