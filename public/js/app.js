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

  const loadVoices = () => {
    voices = speechSynthesis.getVoices();
    const japaneseVoices = voices.filter(voice => voice.lang === 'ja-JP');

    if (japaneseVoices.length > 0) {
      playButton.dataset.voice = japaneseVoices[0].name;
    }
  };

  loadVoices();
  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = loadVoices;
  }

  buttons.forEach(button => {
    button.addEventListener('click', () => {
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
    const answerText = document.getElementById('answer').innerText;
    const utterance = new SpeechSynthesisUtterance(answerText);
    utterance.lang = 'ja-JP';

    const selectedVoiceName = playButton.dataset.voice;
    const selectedVoice = voices.find(voice => voice.name === selectedVoiceName);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    speechSynthesis.speak(utterance);
  });

  nextButton.addEventListener('click', () => {
    // Logic for loading the next card goes here
    actionControls.style.display = 'none';
    scoreControls.style.display = 'flex';
    flashcard.classList.remove('is-flipping');
    flashcardFront.style.display = 'block';
    flashcardBack.style.display = 'none';
  });
});
