// one-time script to generate css file
// run `node generateCssFile.js` locally to generate if no file

import fs from 'fs';
import generateCssVariables from './generateCssVariables.js';

const cssVariables = generateCssVariables();

fs.writeFileSync('./generated-variables.css', cssVariables);
