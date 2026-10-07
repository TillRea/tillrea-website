const fs = require('fs');
let txt = fs.readFileSync('index.html', 'utf8');
txt = txt.split('\\`').join('`');
txt = txt.split('\\$').join('$');
fs.writeFileSync('index.html', txt);
console.log('Fixed syntax errors');
