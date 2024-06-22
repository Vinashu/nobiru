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

const updateEasinessFactor = (score, obj) => {
  obj.easinessFactor += (0.1 - (5 - score) * (0.08 + (5 - score) * 0.02));
  if (obj.easinessFactor < 1.3) {
    obj.easinessFactor = 1.3;
  }
}

const calculateNextReviewDate = (obj) => {
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
}

module.exports = { Flashcard, updateEasinessFactor, calculateNextReviewDate };
