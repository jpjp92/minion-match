
import { Card, Difficulty } from "../types.ts";

/**
 * [중요] public/images 폴더에 실제로 존재하는 파일명만 아래 배열에 넣어주세요.
 * 번호가 비어있다면 해당 번호를 제거하시면 됩니다.
 */
const MINION_IMAGE_POOL = [
  '1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg', '6.jpg', 
  '7.jpg', '8.jpg', '9.jpg', '10.jpg', '12.jpg', '13.jpg', 
  '15.jpg', '16.jpg', '17.jpg', '18.jpg', '19.jpg', '20.jpg', 
  '21.jpg', '22.jpg', '23.jpg', '25.jpg'
];

export const createBoard = (difficulty: Difficulty): Card[] => {
  let pairCount = 6;
  if (difficulty === Difficulty.MEDIUM) pairCount = 10;
  if (difficulty === Difficulty.HARD) pairCount = 12;

  // 1. 이미지 폴더 경로 (상대 경로 사용)
  const imagePath = 'images/';

  // 2. 전체 풀에서 랜덤하게 필요한 만큼만 선택
  const shuffledPool = shuffle([...MINION_IMAGE_POOL]);
  const selectedImages = shuffledPool.slice(0, pairCount);
  
  const cards: Card[] = [];

  selectedImages.forEach((imgName, index) => {
    const cardData = {
      image: `${imagePath}${imgName}`,
      isFlipped: false,
      isMatched: false,
      pairId: index,
    };
    // 한 쌍씩 생성
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
