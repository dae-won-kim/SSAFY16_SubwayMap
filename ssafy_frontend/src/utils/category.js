const CATEGORY_NAMES = {
  VE: '자연·경관',
  HS: '역사·문화',
  EX: '체험·레포츠',
  NA: '자연생태'
}

export function getCategoryName(code) {
  return CATEGORY_NAMES[code] || code || '기타'
}
