function printSettings(printer) {
  const copies = printer.copies ?? 1;
  const doubleSided = printer.options?.doubleSided ?? false;
  console.log(`Copies: ${copies}; double-sided: ${doubleSided}`);
}

const draftPrinter = {
  copies: 3,
  options: { doubleSided: true }
};
draftPrinter.copies = 2;
printSettings(draftPrinter);
printSettings({ copies: 0 }); 
printSettings({}); 
