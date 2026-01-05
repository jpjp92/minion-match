
import { Card, Difficulty } from "../types.ts";

/**
 * GitHub API를 사용하여 저장소의 이미지 파일 목록을 가져옵니다.
 */
export const fetchAvailableImages = async (): Promise<string[]> => {
  try {
    const response = await fetch('https://api.github.com/repos/jpjp92/memory-game-minion/contents/public/images');
    
    if (!response.ok) throw new Error('Failed to fetch image list');
    
    const data = await response.json();
    
    const imageFiles = data
      .filter((file: any) => 
        file.type === 'file' && 
        /\.(jpe?g|png|webp|gif)$/i.test(file.name)
      )
      .map((file: any) => file.name);

    return imageFiles;
  } catch (error) {
    console.error("Error fetching images from GitHub:", error);
    // 폴백 이미지
    return ['2.jpg', '3.jpg', '4.jpg', '5.jpg', '6.jpg', '7.jpg', '8.jpg', '9.jpg'];
  }
};

export const createBoard = (difficulty: Difficulty, imagePool: string[]): Card[] => {
  let pairCount = 6; // EASY: 12 cards (4x3)
  if (difficulty === Difficulty.MEDIUM) pairCount = 8; // MEDIUM: 16 cards (4x4)

  const imagePath = 'images/';

  const shuffledPool = shuffle([...imagePool]);
  const selectedImages = shuffledPool.slice(0, Math.min(pairCount, imagePool.length));
  
  const cards: Card[] = [];

  selectedImages.forEach((imgName, index) => {
    const cardData = {
      image: `${imagePath}${imgName}`,
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
