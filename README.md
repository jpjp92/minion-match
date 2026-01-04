# 🍌 Minion Match: AI Edition

이 프로젝트는 **Google Gemini 3 AI**를 활용하여 플레이어와 실시간으로 소통하는 차세대 메모리 게임입니다. 단순한 카드 뒤집기를 넘어, AI 미니언이 플레이어의 매 순간을 관찰하고 독특한 피드백을 제공합니다.

## 🚀 전체 게임 플로우 (Game Flow)

1.  **Mission Selection**: 사용자가 난이도(EASY, MEDIUM, HARD)를 선택합니다.
2.  **Board Initialization**: 선택한 난이도에 따라 `public/images` 폴더 내의 미니언 이미지 쌍으로 구성된 정사각형 카드 보드가 생성됩니다.
3.  **AI Greeting**: 게임 시작과 동시에 **Gemini AI**가 플레이어에게 미니언어로 환영 인사를 건넵니다.
4.  **Game Play**:
    *   사용자가 카드를 클릭하면 3D 뒤집기 애니메이션이 발생합니다.
    *   두 카드가 일치하거나 틀릴 때마다 게임 엔진은 현재 **이동 횟수(Moves)**와 **난이도** 데이터를 AI 서비스에 전달합니다.
5.  **Real-time AI Commentary**:
    *   AI는 전달받은 데이터를 기반으로 "칭찬", "놀림", "격려" 등의 반응을 생성합니다.
    *   **Thinking Config**를 사용하여 미니언이 현재 플레이 상황을 '생각'하는 듯한 애니메이션이 UI에 표시됩니다.
6.  **Mission Complete**: 모든 쌍을 찾으면 AI가 축하 메시지를 보내며, 최고 기록(Best Score)을 업데이트합니다.

## 🧠 Gemini AI의 역할 (Role of GenAI)

본 애플리케이션에서 **Google Gemini 3 (gemini-3-flash-preview)** 모델은 다음과 같은 핵심 역할을 수행합니다:

### 1. 상황 인지형 피드백 (Contextual Intelligence)
AI는 단순히 무작위 문구를 던지지 않습니다. `geminiService.ts`를 통해 다음 데이터를 실시간으로 주입받습니다:
*   **Event Type**: (MATCH, MISS, WIN, STUCK, GREETING)
*   **Current Moves**: 플레이어가 지금까지 시도한 횟수.
*   **Difficulty**: 게임의 난이도.
이 데이터를 바탕으로, 예를 들어 이동 횟수가 너무 많으면 미니언이 "걱정하는 말투"로, 빠르게 맞추면 "흥분한 말투"로 반응합니다.

### 2. 페르소나 엔지니어링 (Persona Implementation)
**System Instructions**를 통해 미니언즈 영화 속 캐릭터의 성격과 말투를 완벽하게 구현합니다.
*   **Minion-ese**: "Banana!", "Bello!", "Tulaliloo!" 등 고유 단어 사용.
*   **Broken English**: 서툰 영어를 섞어 실제 캐릭터와 대화하는 듯한 경험 제공.

### 3. 추론 기능 활용 (Thinking Process)
`thinkingConfig`를 적용하여 모델이 더 창의적인 미니언어 조합을 생성하도록 유도합니다. AI가 응답을 생성하는 동안 UI 상에서 미니언이 "생각 중"임을 시각적으로 표현하여 기술적 연결감을 높였습니다.

## 🛠 Tech Stack
*   **Frontend**: React (ES6 Modules), Tailwind CSS
*   **AI Engine**: @google/genai (Gemini 3 Flash Preview)
*   **Build Tool**: Vite
*   **Design**: Glassmorphism, 3D CSS Transforms, High-fidelity Animations

---
**"Bello! Banana party is waiting for you!"** 🍌
