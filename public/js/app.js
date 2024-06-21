const isElectron = () => {
  return navigator.userAgent.includes('Electron');
};

document.addEventListener('DOMContentLoaded', () => {
  const flashcard = document.getElementById('flashcard');
  const flashcardFront = document.querySelector('.flashcard-front');
  const flashcardBack = document.querySelector('.flashcard-back');
  const buttons = document.querySelectorAll('.score-btn');
  const playButton = document.getElementById('play-btn');
  const nextButton = document.getElementById('next-btn');
  const scoreControls = document.getElementById('score-controls');
  const actionControls = document.getElementById('action-controls');

  let voices = [];
  let currentFlashcardIndex = 0;
  let flashcards = [];
  let userProgress = {};

  const loadVoices = () => {
    voices = speechSynthesis.getVoices();
    const japaneseVoices = voices.filter(voice => voice.lang === 'ja-JP');

    if (japaneseVoices.length > 0) {
      playButton.dataset.voice = japaneseVoices[0].name;
    }
  };

  const loadFlashcards = () => {
    fetch('data/flashcards.json')
      .then(response => response.json())
      .then(data => {
        flashcards = data;
        loadUserProgress();
        displayFlashcard();
      })
      .catch(error => console.error('Error loading flashcards:', error));
  };

  const loadUserProgress = () => {
    if (isElectron()) {
      window.ipcRenderer.invoke('read-progress')
        .then(data => {
          userProgress = data || {};
          initializeUserProgress();
        })
        .catch(error => console.error('Error loading user progress:', error));
    } else {
      const progressData = localStorage.getItem('userProgress');
      if (progressData) {
        userProgress = JSON.parse(progressData);
      }
      initializeUserProgress();
    }
  };

  const initializeUserProgress = () => {
    flashcards.forEach(card => {
      if (!userProgress[card.id]) {
        userProgress[card.id] = {
          lastReviewed: null,
          performance: []
        };
      }
    });
  };

  const saveUserProgress = () => {
    if (isElectron()) {
      window.ipcRenderer.invoke('write-progress', userProgress)
        .catch(error => console.error('Error saving user progress:', error));
    } else {
      localStorage.setItem('userProgress', JSON.stringify(userProgress));
    }
  };

  const displayFlashcard = () => {
    const flashcardData = flashcards[currentFlashcardIndex];
    if (flashcardData) {
      flashcardFront.querySelector('img').src = flashcardData.image;
      flashcardFront.querySelector('#question').innerText = `What is the Japanese word for "${flashcardData.meaning}"?`;
      flashcardBack.querySelector('#answer-katakana').innerText = flashcardData.versions.katakana;
      flashcardBack.querySelector('#answer-romaji').innerText = `(${flashcardData.versions.romaji})`;
    }
  };

  loadVoices();
  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = loadVoices;
  }

  loadFlashcards();

  buttons.forEach(button => {
    button.addEventListener('click', (event) => {
      const score = parseInt(event.target.dataset.score);
      const flashcardData = flashcards[currentFlashcardIndex];

      // Update user progress
      const progress = userProgress[flashcardData.id];
      progress.lastReviewed = new Date().toISOString().split('T')[0];
      progress.performance.push(score);
      saveUserProgress();

      // Start flipping the front side
      flashcard.classList.add('is-flipping');

      // Switch between front and back at the halfway point of the animation
      setTimeout(() => {
        flashcardFront.style.display = 'none';
        flashcardBack.style.display = 'flex';
      }, 500); // Halfway point of the 1.0s animation

      // Reset the flip after the animation completes and show action buttons
      setTimeout(() => {
        scoreControls.style.display = 'none';
        actionControls.style.display = 'flex';
      }, 500); // Total duration of the animation
    });
  });

  playButton.addEventListener('click', () => {
    if (isElectron()) {
      // Use Electron IPC to send text-to-speech request to the main process
      const answerText = document.getElementById('answer-romaji').innerText;
      window.ipcRenderer.send('speak', answerText);
    } else {
      const answerText = document.getElementById('answer-katakana').innerText;
      const utterance = new SpeechSynthesisUtterance(answerText);
      utterance.lang = 'ja-JP';

      const selectedVoiceName = playButton.dataset.voice;
      const selectedVoice = voices.find(voice => voice.name === selectedVoiceName);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      speechSynthesis.speak(utterance);
    }
  });

  nextButton.addEventListener('click', () => {
    currentFlashcardIndex = (currentFlashcardIndex + 1) % flashcards.length;
    displayFlashcard();
    actionControls.style.display = 'none';
    scoreControls.style.display = 'flex';
    flashcard.classList.remove('is-flipping');
    flashcardFront.style.display = 'block';
    flashcardBack.style.display = 'none';
  });
});
