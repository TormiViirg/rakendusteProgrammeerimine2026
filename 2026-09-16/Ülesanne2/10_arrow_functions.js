const remainingSpace = (capacity, used) => capacity - used;

function checkStorage(capacity, used, onResult) {
  const freeGB = remainingSpace(capacity, used);
  onResult(freeGB);
}

checkStorage(64, 47, (freeGB) => {
  console.log(`Available: ${freeGB} GB`); 
});
