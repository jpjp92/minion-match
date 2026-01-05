
import { Card, Difficulty } from "../types.ts";

/**
 * GitHub API를 사용하여 저장소의 이미지 파일 목록과 실제 다운로드 URL을 가져옵니다.
 */
export const fetchAvailableImages = async (): Promise<string[]> => {
  try {
    // 캐시 방지를 위해 timestamp 추가
    const response = await fetch(`https://api.github.com/repos/jpjp92/memory-game-minion/contents/public/images?t=${Date.now()}`);
    
    if (!response.ok) throw new Error('Failed to fetch image list');
    
    const data = await response.json();
    
    // 이미지 파일 필터링 및 실제 raw 주소(download_url) 추출
    const imageUrls = data
      .filter((file: any) => 
        file.type === 'file' && 
        /\.(jpe?g|png|webp|gif)$/i.test(file.name)
      )
      .map((file: any) => file.download_url); // 'images/2.jpg' 대신 'https://raw.github.../2.jpg' 사용

    if (imageUrls.length === 0) throw new Error('No images found');

    return imageUrls;
  } catch (error) {
    console.error("Error fetching images from GitHub:", error);
    // API 실패 시 폴백: 현재 도메인의 images 폴더에서 시도 (최소한의 안전장치)
    return [
      'images/2.jpg', 'images/3.jpg', 'images/4.jpg', 'images/5.jpg', 
      'images/6.jpg', 'images/7.jpg', 'images/8.jpg', 'images/9.jpg'
    ];
  }
};

/**
 * 선택된 이미지들을 브라우저 메모리에 프리로딩합니다.
 * 디코딩까지 미리 완료하도록 decode() API를 사용합니다.
 */
export const preloadImages = (images: string[]): Promise<void[]> => {
  return Promise.all(
    images.map((src) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
          // 브라우저가 이미지를 메모리에 올리고 디코딩까지 준비하도록 함
          if ('decode' in img) {
            img.decode().then(() => resolve()).catch(() => resolve());
          } else {
            resolve();
          }
        };
        img.onerror = () => {
          console.warn(`Preload failed: ${src}`);
          resolve(); 
        };
      });
    })
  );
};

export const createBoard = (difficulty: Difficulty, imagePool: string[]): Card[] => {
  let pairCount = 6; 
  if (difficulty === Difficulty.MEDIUM) pairCount = 8;

  const shuffledPool = shuffle([...imagePool]);
  // 충분한 이미지가 없는 경우를 대비해 반복 사용 로직 추가
  const selectedImages = [];
  for (let i = 0; i < pairCount; i++) {
    selectedImages.push(shuffledPool[i % shuffledPool.length]);
  }
  
  const cards: Card[] = [];

  selectedImages.forEach((imgUrl, index) => {
    const cardData = {
      image: imgUrl, // 이제 imgUrl은 절대 경로임
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
