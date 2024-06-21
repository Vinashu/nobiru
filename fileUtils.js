const fs = require('fs');
const path = require('path');

let app; // Declare a variable to hold the app reference

const initialize = (electronApp) => {
  app = electronApp;
};

const getDataFilePath = () => {
  return path.join(app.getPath('userData'), 'userProgress.json');
};

const readData = () => {
  const filePath = getDataFilePath();
  console.log(filePath);
  try {
    if (fs.existsSync(filePath)) {
      const rawData = fs.readFileSync(filePath);
      return JSON.parse(rawData);
    }
  } catch (error) {
    console.error('Error reading data file:', error);
  }
  return {};
};

const writeData = (data) => {
  const filePath = getDataFilePath();
  console.log(filePath);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing data file:', error);
  }
};

module.exports = { initialize, readData, writeData };
