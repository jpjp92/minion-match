
import { Card, Difficulty } from "../types.ts";

/**
 * GitHub API를 사용하여 저장소의 이미지 파일 목록을 가져옵니다.
 */
export const fetchAvailableImages = async (): Promise<string[]> => {
  try {
    // 사용자님의 레포지토리 경로를 기반으로 파일 목록 조회
    const response = await fetch('https://api.github.com/repos/jpjp92/memory-game-minion/contents/public/images');
    
    if (!response.ok) throw new Error('Failed to fetch image list');
    
    const data = await response.json();
    
    // 이미지 파일만 필터링 (jpg, png, webp 등)
    const imageFiles = data
      .filter((file: any) => 
        file.type === 'file' && 
        /\.(jpe?g|png|webp|gif)$/i.test(file.name)
      )
      .map((file: any) => file.name);

    return imageFiles;
  } catch (error) {
    console.error("Error fetching images from GitHub:", error);
    // API 실패 시 안전한 폴백 (최소한의 기본 리스트)
    return ['2.jpg', '3.jpg', '4.jpg', '5.jpg', '6.jpg', '7.jpg', '8.jpg', '9.jpg'];
  }
};

export const createBoard = (difficulty: Difficulty, imagePool: string[]): Card[] => {
  let pairCount = 6;
  if (difficulty === Difficulty.MEDIUM) pairCount = 10;
  if (difficulty === Difficulty.HARD) pairCount = 12;

  const imagePath = 'images/';

  // 제공된 이미지 풀에서 랜덤하게 선택
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
    // 한 쌍 생성
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
