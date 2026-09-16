const totalMB = 29;
const chunkMB = 6;
console.log("Full chunks:", Math.floor(totalMB / chunkMB));
console.log("Leftover MB:", totalMB % chunkMB); 

const queuedMB = "12";
console.log(queuedMB + chunkMB); 
console.log(Number(queuedMB) + chunkMB); 
console.log(typeof (queuedMB + chunkMB)); 
console.log(typeof (Number(queuedMB) + chunkMB)); 
console.log(Number("empty") - chunkMB); 
