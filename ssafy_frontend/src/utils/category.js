const CATEGORY_META = {
  관광지: { label: '관광지', icon: '📍' },
  문화시설: { label: '문화시설', icon: '🏛️' },
  축제공연행사: { label: '축제·공연·행사', icon: '🎉' },
  여행코스: { label: '여행코스', icon: '🗺️' },
  레포츠: { label: '레포츠', icon: '🏃' },
  숙박: { label: '숙박', icon: '🛏️' },
  쇼핑: { label: '쇼핑', icon: '🛍️' },
  VE: { label: '자연·경관', icon: '🌿' },
  HS: { label: '역사·문화', icon: '🏛️' },
  EX: { label: '체험·레포츠', icon: '🏃' },
  NA: { label: '자연생태', icon: '🌳' }
}

export const CATEGORY_ORDER = [
  '관광지',
  '문화시설',
  '축제공연행사',
  '여행코스',
  '레포츠',
  '숙박',
  '쇼핑'
]

export function getCategoryName(code) {
  return CATEGORY_META[code]?.label || code || '기타'
}

export function getCategoryIcon(code) {
  return CATEGORY_META[code]?.icon || '📌'
}
