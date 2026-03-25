// src/components/index.ts

// 🚨 Header, Footer 등 마이그레이션 완료된 컴포넌트들
export * from "./Footer";
export * from "./MyRatingIsHeader";
export * from "./MainBanner";
export * from "./StickyMenu";

// 🚨 ImageCard 및 Dialog (마이그레이션된 파일)
export * from "./ImageCard";
export * from "./ImageDialog";

// 🚨 Tooltip (AppTooltip.jsx -> Tooltip.tsx로 변경됨)
export * from "./Tooltip";

// 🚨🚨🚨 Skeleton 폴더 내의 index.ts 파일에 접근
export * from "./skeleton";
