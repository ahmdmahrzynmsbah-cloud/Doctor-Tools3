const val = undefined;
try {
  console.log(val.toLocaleString());
} catch(e) {
  console.log("Error:", e.message);
}

try {
  console.log(Number(val).toLocaleString());
} catch(e) {
  console.log("Number Error:", e.message);
}
