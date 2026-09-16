
const rawStatus = "  upload-paused  ";
const status = rawStatus.trim().replace("-", " ");
const alertText = status.toUpperCase();

console.log(alertText); 
console.log(status.includes("paused")); 
console.log(`Status: ${alertText} (${status.length} characters)`);
