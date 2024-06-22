const isElectron = () => {
  return navigator.userAgent.includes('Electron');
};

if (!isElectron()) {
  class Flashcard {
    constructor(id, term, meaning, image, versions, interval = 1, repetition = 1, easinessFactor = 2.5, nextReview = null) {
      this.id = id;
      this.term = term;
      this.meaning = meaning;
      this.image = image;
      this.versions = versions;
      this.interval = interval || 1;
      this.repetition = repetition || 1;
      this.easinessFactor = easinessFactor || 2.5;
      this.nextReview = nextReview || new Date().toISOString().split('T')[0];
    }
  }

  // Make the Flashcard class available globally in the browser
  window.Flashcard = Flashcard;
}

document.addEventListener('DOMContentLoaded', () => {
  // const createFlashcard = window.api.createFlashcard;
  // const updateEasinessFactor = window.api.updateEasinessFactor;
  // const calculateNextReviewDate = window.api.calculateNextReviewDate;

  const createFlashcard = window.api?.createFlashcard || ((id, term, meaning, image, versions, interval, repetition, easinessFactor, nextReview) => {
    return new Flashcard(id, term, meaning, image, versions, interval, repetition, easinessFactor, nextReview);
  });
  
  const updateEasinessFactor = window.api?.updateEasinessFactor || ((score, obj) => {
    obj.easinessFactor += (0.1 - (5 - score) * (0.08 + (5 - score) * 0.02));
    if (obj.easinessFactor < 1.3) {
      obj.easinessFactor = 1.3;
    }
  });
  
  const calculateNextReviewDate = window.api?.calculateNextReviewDate || ((obj) => {
    const today = new Date();
    const lastReviewed = new Date(obj.nextReview);
    const daysSinceLastReview = Math.round((today - lastReviewed) / (1000 * 60 * 60 * 24));

    obj.repetition += 1;
    if (obj.repetition === 1) {
      obj.interval = 1;
    } else if (obj.repetition === 2) {
      obj.interval = 6;
    } else {
      obj.interval = Math.round(obj.interval * obj.easinessFactor);
    }
    obj.nextReview = new Date(today.setDate(today.getDate() + obj.interval)).toISOString().split('T')[0];
  });


  const flashcardElement = document.getElementById('flashcard');
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
        flashcards = data.map(card => {
          const newCard = createFlashcard(card.id, card.term, card.meaning, card.image, card.versions, card.interval, card.repetition, card.easinessFactor, card.nextReview);
          newCard.updateEasinessFactor = updateEasinessFactor.bind(newCard);
          newCard.calculateNextReviewDate = calculateNextReviewDate.bind(newCard);
          return newCard;
        });
        loadUserProgress();
        displayFlashcard();
      })
      .catch(error => console.error('Error loading flashcards:', error));
  };

  const loadUserProgress = () => {
    if (isElectron()) {
      window.api.ipcRenderer.invoke('read-progress')
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
      window.api.ipcRenderer.invoke('write-progress', userProgress)
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

      // Update flashcard data using SM-2 algorithm
      flashcardData.updateEasinessFactor(score, flashcardData);
      flashcardData.calculateNextReviewDate(flashcardData);

      // Start flipping the front side
      flashcardElement.classList.add('is-flipping');

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
      try {
        window.api.ipcRenderer.send('speak', answerText);
      } catch (error) {
        console.error('Error sending speak request:', error);
      }
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
    flashcardElement.classList.remove('is-flipping');
    flashcardFront.style.display = 'block';
    flashcardBack.style.display = 'none';
  });
});
