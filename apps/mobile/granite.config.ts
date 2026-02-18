/**
 * 앱인토스 (Apps-in-Toss) 설정 파일
 *
 * 이 파일은 앱인토스 미니앱으로 배포할 때 사용됩니다.
 * Expo(iOS/Android 독립앱)로 빌드할 때는 사용되지 않습니다.
 *
 * 사용법:
 *   1. npm install @apps-in-toss/framework @granite-js/react-native
 *   2. npx ait init (이미 이 파일이 있으므로 스킵 가능)
 *   3. npm run dev:toss (개발 서버)
 *   4. npm run build:toss (번들 생성 → .ait 파일)
 *
 * 참고: https://developers-apps-in-toss.toss.im/tutorials/react-native.html
 */

// 앱인토스 SDK 설치 후 아래 주석을 해제하세요:
//
// import { appsInToss } from '@apps-in-toss/framework/plugins';
// import { defineConfig } from '@granite-js/react-native/config';
//
// export default defineConfig({
//   appName: 'myratingis',
//   scheme: 'intoss',
//   plugins: [
//     appsInToss({
//       brand: {
//         displayName: '제 평가는요?',
//         primaryColor: '#F97316',
//         icon: 'https://myratingis.kr/favicon.png',
//       },
//       permissions: [],
//     }),
//   ],
// });

export {};
