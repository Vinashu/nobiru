class Flashcard {
  constructor(id, term, meaning, image, versions) {
    this.id = id;
    this.term = term;
    this.meaning = meaning;
    this.image = image;
    this.versions = versions;
  }
}

module.exports = Flashcard;
