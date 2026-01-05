
import { Card, Difficulty } from "../types.ts";

/**
 * 프로젝트 내 public/images 폴더에 있는 이미지들을 정의합니다.
 * JS 버전에서 사용하던 방식처럼 안정적인 로컬 경로를 생성합니다.
 */
export const fetchAvailableImages = async (): Promise<string[]> => {
  // 기본적으로 1.jpg ~ 10.jpg가 있다고 가정 (미니언 게임의 표준 구성)
  const defaultImages = Array.from({ length: 10 }, (_, i) => `/images/${i + 1}.jpg`);
  
  try {
    // GitHub API는 실제 파일 목록을 동적으로 가져오고 싶을 때만 서브로 사용
    const response = await fetch(`https://api.github.com/repos/jpjp92/memory-game-minion/contents/public/images`);
    if (response.ok) {
      const data = await response.json();
      const apiImages = data
        .filter((file: any) => file.type === 'file' && /\.(jpe?g|png|webp)$/i.test(file.name))
        .map((file: any) => `/images/${file.name}`);
      return apiImages.length > 0 ? apiImages : defaultImages;
    }
  } catch (e) {
    console.warn("Using default image paths due to API failure");
  }
  
  return defaultImages;
};

/**
 * 이미지를 브라우저 메모리에 완벽히 로드하고 디코딩합니다.
 */
export const preloadImages = (images: string[]): Promise<void[]> => {
  return Promise.all(
    images.map((src) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
          if ('decode' in img) {
            img.decode().then(() => resolve()).catch(() => resolve());
          } else {
            resolve();
          }
        };
        img.onerror = () => {
          console.error(`Failed to preload: ${src}`);
          resolve(); // 실패해도 일단 진행
        };
      });
    })
  );
};

export const createBoard = (difficulty: Difficulty, imagePool: string[]): Card[] => {
  let pairCount = 6; 
  if (difficulty === Difficulty.MEDIUM) pairCount = 8;

  const shuffledPool = shuffle([...imagePool]);
  const selectedImages = [];
  // 이미지 풀이 부족하면 반복해서 사용
  for (let i = 0; i < pairCount; i++) {
    selectedImages.push(shuffledPool[i % shuffledPool.length]);
  }
  
  const cards: Card[] = [];
  selectedImages.forEach((imgUrl, index) => {
    const cardData = {
      image: imgUrl,
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
