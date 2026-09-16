const waterLitres = 8;
const targetLitres = 12;
const pumpReady = true;

if (waterLitres >= targetLitres) {
  console.log("Tank is full enough.");
} else if (waterLitres < targetLitres && pumpReady === true) {
  console.log(`Add ${targetLitres - waterLitres} litres.`);
} else {
  console.log("Wait for the pump.");
}
