import colors from './colors.js';

const generateCssVariables = () => {
  let cssVariables = ':root {\n';

  cssVariables += `  --primary-color: ${colors.primary};\n`;
  cssVariables += `  --secondary-color: ${colors.secondary};\n`;
  cssVariables += `  --grey-color: ${colors.grey};\n`;
  cssVariables += `  --green-color: ${colors.green};\n`;

  Object.keys(colors.shades).forEach(color => {
    colors.shades[color].forEach((shade, index) => {
      cssVariables += `  --${color}-shade-${index + 1}: ${shade};\n`;
    });
  });

  cssVariables += '}';

  return cssVariables;
};

export default generateCssVariables;