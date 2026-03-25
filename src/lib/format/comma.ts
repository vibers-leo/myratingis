// src/lib/format/comma.ts

/**
 * 숫자에 쉼표(,)를 추가하여 문자열로 반환합니다.
 * @param number 쉼표를 추가할 숫자 (예: 1234567)
 * @returns 쉼표가 추가된 문자열 (예: "1,234,567")
 */
export const addCommas = (number: number): string => {
  // 숫자가 null, undefined, 또는 숫자가 아닌 경우 빈 문자열 반환 (선택적 에러 핸들링)
  if (number === null || number === undefined || isNaN(number)) {
    return "0";
  }

  // toString()으로 문자열 변환 후, 정규 표현식으로 3자리마다 쉼표 추가
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};
