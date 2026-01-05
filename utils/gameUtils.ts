
import { Card, Difficulty } from "../types.ts";

/**
 * GitHub API를 사용하여 'minion-match' 저장소의 실제 이미지 파일 목록을 가져옵니다.
 */
export const fetchAvailableImages = async (): Promise<string[]> => {
  const REPO_OWNER = 'jpjp92';
  const REPO_NAME = 'minion-match';
  const PATH = 'public/images';
  
  try {
    const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${PATH}?t=${Date.now()}`);
    
    if (!response.ok) throw new Error('GitHub API response was not ok');
    
    const data = await response.json();
    
    // 파일 목록에서 이미지 파일만 필터링하고 실제 raw 다운로드 URL 추출
    const imageUrls = data
      .filter((file: any) => 
        file.type === 'file' && 
        /\.(jpe?g|png|webp|gif)$/i.test(file.name)
      )
      .map((file: any) => file.download_url);

    if (imageUrls.length === 0) throw new Error('No images found in the repository');

    return imageUrls;
  } catch (error) {
    console.error("Error fetching images from GitHub API:", error);
    // API 실패 시 폴백: 2.jpg부터 9.jpg까지 시도
    return [
      '/images/2.jpg', '/images/3.jpg', '/images/4.jpg', '/images/5.jpg', 
      '/images/6.jpg', '/images/7.jpg', '/images/8.jpg', '/images/9.jpg'
    ];
  }
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
          console.warn(`Failed to preload: ${src}`);
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
  const selectedImages = [];
  
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
