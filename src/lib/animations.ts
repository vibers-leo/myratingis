// Framer Motion 애니메이션 프리셋
import { Variants } from "framer-motion";

// 페이드 인
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.3 }
  },
};

// 위로 슬라이드
export const slideUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" }
  },
};

// 아래로 슬라이드
export const slideDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" }
  },
};

// 왼쪽에서 슬라이드
export const slideLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.4, ease: "easeOut" }
  },
};

// 오른쪽에서 슬라이드
export const slideRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.4, ease: "easeOut" }
  },
};

// 스케일 업
export const scaleUp: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.3, ease: "easeOut" }
  },
};

// 스태거 컨테이너 (자식 요소 순차 애니메이션)
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

// 스태거 아이템
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" }
  },
};

// 호버 스케일
export const hoverScale = {
  scale: 1.02,
  transition: { duration: 0.2 },
};

// 호버 리프트 (그림자 + 이동)
export const hoverLift = {
  y: -4,
  boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
  transition: { duration: 0.2 },
};

// 탭 효과
export const tapScale = {
  scale: 0.98,
  transition: { duration: 0.1 },
};

// 버튼 애니메이션
export const buttonVariants: Variants = {
  idle: { scale: 1 },
  hover: { scale: 1.02 },
  tap: { scale: 0.98 },
};

// 모달 애니메이션
export const modalVariants: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.95,
    y: 10,
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: { 
      duration: 0.2,
      ease: "easeOut",
    },
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    y: 10,
    transition: { 
      duration: 0.15,
    },
  },
};

// 오버레이 애니메이션
export const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.2 },
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

// 알림 카드 애니메이션
export const notificationVariants: Variants = {
  hidden: { 
    opacity: 0, 
    x: 100,
    scale: 0.9,
  },
  visible: { 
    opacity: 1, 
    x: 0,
    scale: 1,
    transition: { 
      type: "spring",
      stiffness: 400,
      damping: 25,
    },
  },
  exit: { 
    opacity: 0, 
    x: 100,
    transition: { duration: 0.2 },
  },
};

// 페이지 전환 애니메이션
export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
  exit: { 
    opacity: 0, 
    y: -8,
    transition: { duration: 0.2 },
  },
};
