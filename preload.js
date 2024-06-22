const { contextBridge, ipcRenderer } = require('electron');
const { Flashcard, updateEasinessFactor, calculateNextReviewDate } = require('./flashcard'); // Ensure this path is correct relative to preload.js

contextBridge.exposeInMainWorld('api', {
  ipcRenderer: {
    send: (channel, data) => ipcRenderer.send(channel, data),
    invoke: (channel, data) => ipcRenderer.invoke(channel, data)
  },
  createFlashcard: (id, term, meaning, image, versions, interval, repetition, easinessFactor, nextReview) => {
    return new Flashcard(id, term, meaning, image, versions, interval, repetition, easinessFactor, nextReview);
  },
  updateEasinessFactor,
  calculateNextReviewDate
});
