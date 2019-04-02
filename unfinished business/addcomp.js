
const fs = require('fs');
const components = fs.readFileSync('./complist.json', 'utf8');
const resistors = fs.readFileSync('./resistors.json', 'utf8');

//console.log('COMPONENTS');

try {
  const list = JSON.parse(components)
  for (i = 0; i < list.Components.length; i++){
	console.log(list.Components[i]);
}
  //console.log(data);
} catch(err) {
  console.error(err);
}

console.log('RESISTORS');
console.log('Resistance');
  const res = JSON.parse(resistors)
try {
  for (i = 0; i < res.resistance.length; i++){
	console.log(res.resistance[i]);
}
  //console.log(data);
} catch(err) {
  console.error(err);
}

console.log('Wattage');
try {
  for (i = 0; i < res.wattage.length; i++){
	console.log(res.wattage[i]);
}
  //console.log(data);
} catch(err) {
  console.error(err);
}