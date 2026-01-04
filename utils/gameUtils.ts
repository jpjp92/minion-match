
import { Card, Difficulty } from "../types";

// Standardized local image paths relative to the current host
const MINION_IMAGES = [
  './images/minion1.jpg', './images/minion2.jpg', './images/minion3.jpg', 
  './images/minion4.jpg', './images/minion5.jpg', './images/minion6.jpg',
  './images/minion7.jpg', './images/minion8.jpg', './images/minion9.jpg',
  './images/minion10.jpg', './images/minion11.jpg', './images/minion12.jpg',
  './images/minion13.jpg', './images/minion14.jpg', './images/minion15.jpg'
];

export const createBoard = (difficulty: Difficulty): Card[] => {
  let pairCount = 6;  // Easy: 4x3 (12 cards)
  if (difficulty === Difficulty.MEDIUM) pairCount = 10; // Medium: 5x4 (20 cards)
  if (difficulty === Difficulty.HARD) pairCount = 12;   // Hard: 6x4 (24 cards)

  const selectedImages = MINION_IMAGES.slice(0, pairCount);
  const cards: Card[] = [];

  selectedImages.forEach((img, index) => {
    const cardData = {
      image: img,
      isFlipped: false,
      isMatched: false,
      pairId: index,
    };
    cards.push({ ...cardData, id: index * 2 });
    cards.push({ ...cardData, id: index * 2 + 1 });
  });

  return shuffle(cards);
};

const shuffle = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};
