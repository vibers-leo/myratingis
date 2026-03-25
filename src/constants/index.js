// src/constants/index.ts

// 🚨 Font Awesome 아이콘 임포트 (Footer에서 사용)
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import {
  faAppStore,
  faFacebook,
  faGooglePlay,
  faInstagram,
  faYoutube,
} from "@fortawesome/free-brands-svg-icons";
import {
  faEnvelopeOpen,
  faNewspaper,
} from "@fortawesome/free-regular-svg-icons";

// --- 1. Footer Contents 정의 ---

// 🚨 Footer Contents 아이템 타입 정의
interface FooterContentItem {
  label: string;
  icon: IconProp;
}

// 🚨 FOOTER_CONTETNS 상수 정의
export const FOOTER_CONTETNS: FooterContentItem[] = [
  { label: "노트폴리오 매거진", icon: faNewspaper },
  { label: "노폴레터", icon: faEnvelopeOpen },
  { label: "노트폴리오 인스타그램", icon: faInstagram },
  { label: "노트폴리오 페이스북", icon: faFacebook },
  { label: "노트폴리오 유튜브", icon: faYoutube },
  { label: "iOS App", icon: faAppStore },
  { label: "Android App", icon: faGooglePlay },
];

// --- 2. Mentors 정의 ---

// 🚨 MENTORS 아이템 타입 정의
interface Mentor {
  imgUrl: string;
  name: string;
  career: string;
  job: string;
  role: string;
}

// 🚨 MENTORS 상수 정의
export const MENTORS: Mentor[] = [
  {
    imgUrl: "",
    name: "개발자 9Diin",
    career: "시니어(7년차)",
    job: "디자이너",
    role: "현 마이리얼트립 프로덕트 디자이너",
  },
  {
    imgUrl: "",
    name: "개발자 9Diin",
    career: "시니어(7년차)",
    job: "디자이너",
    role: "현 마이리얼트립 프로덕트 디자이너",
  },
  {
    imgUrl: "",
    name: "개발자 9Diin",
    career: "시니어(7년차)",
    job: "마케터",
    role: "현 마이리얼트립 프로덕트 디자이너",
  },
  {
    imgUrl: "",
    name: "개발자 9Diin",
    career: "시니어(7년차)",
    job: "마케터",
    role: "현 마이리얼트립 프로덕트 디자이너",
  },
  {
    imgUrl: "",
    name: "개발자 9Diin",
    career: "시니어(7년차)",
    job: "디자이너",
    role: "현 마이리얼트립 프로덕트 디자이너",
  },
  {
    imgUrl: "",
    name: "개발자 9Diin",
    career: "시니어(7년차)",
    job: "마케터",
    role: "현 마이리얼트립 프로덕트 디자이너",
  },
];

// --- 3. Recruitments 정의 ---

// 🚨 RECRUITMENTS 아이템 타입 정의
interface Recruitment {
  imgUrl: string;
  logo: string;
  title: string;
  company: string;
}

// 🚨 RECRUITMENTS 상수 정의
export const RECRUITMENTS: Recruitment[] = [
  {
    imgUrl: "",
    logo: "",
    title: "그래픽 디자이너 (3D) 채용",
    company: "토스플레이스",
  },
  {
    imgUrl: "",
    logo: "",
    title: "광고 대행사 디자이너 채용 (3년 이상)",
    company: "브레이커스",
  },
  {
    imgUrl: "",
    logo: "",
    title: "[미리캔버스] 그래픽 디자이너(템플릿 디자이너)",
    company: "미리디",
  },
  {
    imgUrl: "",
    logo: "",
    title: "그래픽 디자이너 (3D) 채용",
    company: "토스플레이스",
  },
  {
    imgUrl: "",
    logo: "",
    title: "광고 대행사 디자이너 채용 (3년 이상)",
    company: "브레이커스",
  },
  {
    imgUrl: "",
    logo: "",
    title: "[미리캔버스] 그래픽 디자이너(템플릿 디자이너)",
    company: "미리디",
  },
];
