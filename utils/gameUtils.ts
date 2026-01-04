
import { Card, Difficulty } from "../types.ts";

// 상대 경로(images/...)를 사용하여 환경에 구애받지 않고 파일을 찾도록 합니다.
const MINION_IMAGES = [
  'images/1.jpg', 'images/2.jpg', 'images/10.jpg', 'images/11.jpg', 
  'images/12.jpg', 'images/14.jpg', 'images/15.jpg', 'images/16.jpg', 
  'images/17.jpg', 'images/18.jpg', 'images/20.jpg', 'images/21.jpg', 
  'images/22.jpg', 'images/23.jpg', 'images/24.jpg'
];

export const createBoard = (difficulty: Difficulty): Card[] => {
  let pairCount = 6;
  if (difficulty === Difficulty.MEDIUM) pairCount = 10;
  if (difficulty === Difficulty.HARD) pairCount = 12;

  // 게임마다 다른 미니언이 나오도록 전체 풀에서 무작위로 선택
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
    // 한 쌍(2장)씩 생성
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
