function waitForOven(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(180), milliseconds);
  });
}

async function bake() {
  console.log("Preheating...");
  const temperature = await waitForOven(500);
  console.log(`Oven ready at ${temperature} degrees.`);
}

bake();
console.log("Prepare the baking tray while waiting.");
