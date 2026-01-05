
import { Card, Difficulty } from "../types.ts";

// 모든 환경(GitHub, Vercel 등)에서 가장 안전한 절대 경로를 사용합니다.
const MINION_IMAGES = [
  '/images/1.jpg', '/images/2.jpg', '/images/10.jpg', '/images/11.jpg', 
  '/images/12.jpg', '/images/14.jpg', '/images/15.jpg', '/images/16.jpg', 
  '/images/17.jpg', '/images/18.jpg', '/images/20.jpg', '/images/21.jpg', 
  '/images/22.jpg', '/images/23.jpg', '/images/24.jpg'
];

export const createBoard = (difficulty: Difficulty): Card[] => {
  let pairCount = 6;
  if (difficulty === Difficulty.MEDIUM) pairCount = 10;
  if (difficulty === Difficulty.HARD) pairCount = 12;

  const shuffledPool = shuffle([...MINION_IMAGES]);
  const selectedImages = shuffledPool.slice(0, pairCount);
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
