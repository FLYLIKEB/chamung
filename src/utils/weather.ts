const WMO_CODE_MAP: Record<number, { emoji: string; label: string; teaComment: string }> = {
  0: { emoji: '☀️', label: '맑음', teaComment: '맑은 날, 시원한 냉침차 한 잔 어떠세요?' },
  1: { emoji: '🌤️', label: '대체로 맑음', teaComment: '화창한 날씨에 어울리는 가벼운 녹차 한 잔' },
  2: { emoji: '⛅', label: '구름 조금', teaComment: '구름 사이로 비치는 햇살처럼 은은한 백차 한 잔' },
  3: { emoji: '☁️', label: '흐림', teaComment: '흐린 날엔 따뜻한 홍차로 기분을 밝혀보세요' },
  45: { emoji: '🌫️', label: '안개', teaComment: '안개 낀 아침, 몸을 데워줄 보이차 한 잔' },
  48: { emoji: '🌫️', label: '안개', teaComment: '안개 속 고요함을 닮은 우롱차 한 잔' },
  51: { emoji: '🌧️', label: '이슬비', teaComment: '이슬비 내리는 날, 창가에서 차 한 잔의 여유를' },
  53: { emoji: '🌧️', label: '이슬비', teaComment: '부슬부슬 비 오는 날엔 따뜻한 차가 제격이에요' },
  55: { emoji: '🌧️', label: '이슬비', teaComment: '비 오는 날의 차 한 잔은 특별한 위로가 됩니다' },
  56: { emoji: '🌧️', label: '진눈깨비', teaComment: '쌀쌀한 날씨, 진한 홍차로 몸을 녹여보세요' },
  57: { emoji: '🌧️', label: '진눈깨비', teaComment: '추운 날엔 생강차 한 잔이 딱이에요' },
  61: { emoji: '🌧️', label: '비', teaComment: '빗소리 들으며 마시는 차는 운치가 있어요' },
  63: { emoji: '🌧️', label: '비', teaComment: '비 오는 날 따뜻한 차 한 잔, 마음이 편안해져요' },
  65: { emoji: '🌧️', label: '폭우', teaComment: '폭우 속 실내에서 즐기는 진한 보이차' },
  66: { emoji: '🌧️', label: '빙우', teaComment: '차가운 비엔 뜨거운 차가 필수예요' },
  67: { emoji: '🌧️', label: '빙우', teaComment: '얼음비 내리는 날, 따뜻한 차로 온기를 채우세요' },
  71: { emoji: '❄️', label: '눈', teaComment: '눈 오는 날 창밖을 보며 마시는 말차 한 잔' },
  73: { emoji: '❄️', label: '눈', teaComment: '하얀 눈처럼 깨끗한 백차 한 잔 어떠세요?' },
  75: { emoji: '❄️', label: '폭설', teaComment: '폭설엔 집에서 따뜻한 차와 함께 쉬어가세요' },
  77: { emoji: '❄️', label: '눈', teaComment: '겨울 풍경과 함께하는 따뜻한 차 한 잔' },
  80: { emoji: '🌦️', label: '소나기', teaComment: '소나기가 지나간 후의 개운함, 녹차처럼 상쾌하게' },
  81: { emoji: '🌦️', label: '소나기', teaComment: '갑작스런 소나기, 잠시 쉬며 차 한 잔 해요' },
  82: { emoji: '🌦️', label: '폭우', teaComment: '굵은 빗줄기 속에서 즐기는 묵직한 보이차' },
  85: { emoji: '❄️', label: '눈', teaComment: '눈이 내리는 고요한 순간, 차와 함께' },
  86: { emoji: '❄️', label: '폭설', teaComment: '폭설 속 따뜻한 차 한 잔으로 온기를' },
  95: { emoji: '🌩️', label: '뇌우', teaComment: '천둥번개 속에서도 차 한 잔의 평화를' },
  96: { emoji: '🌩️', label: '뇌우', teaComment: '뇌우 치는 밤, 차 한 잔으로 마음을 가라앉혀요' },
  99: { emoji: '🌩️', label: '뇌우', teaComment: '폭풍우가 지나면 맑은 날이 올 거예요, 차 한 잔과 함께' },
};

export interface WeatherInfo {
  emoji: string;
  label: string;
  teaComment: string;
  temperatureMax?: number;
  temperatureMin?: number;
  humidity?: number;
}

export function weatherCodeToInfo(code: number): { emoji: string; label: string; teaComment: string } {
  return WMO_CODE_MAP[code] ?? { emoji: '❓', label: '알 수 없음', teaComment: '오늘도 좋은 차 한 잔의 여유를' };
}

const DEFAULT_LAT = 37.5665;
const DEFAULT_LNG = 126.978;

export async function fetchWeather(
  date: string,
  lat = DEFAULT_LAT,
  lng = DEFAULT_LNG,
): Promise<WeatherInfo | null> {
  try {
    const url = new URL('https://archive-api.open-meteo.com/v1/archive');
    url.searchParams.set('latitude', String(lat));
    url.searchParams.set('longitude', String(lng));
    url.searchParams.set('start_date', date);
    url.searchParams.set('end_date', date);
    url.searchParams.set('daily', 'weathercode,temperature_2m_max,temperature_2m_min');
    url.searchParams.set('hourly', 'relativehumidity_2m');
    url.searchParams.set('timezone', 'Asia/Seoul');

    const res = await fetch(url.toString());
    if (!res.ok) return null;
    const data = await res.json();
    const code = data.daily?.weathercode?.[0];
    if (code == null) return null;
    const info = weatherCodeToInfo(code);

    const humidityArr: number[] = data.hourly?.relativehumidity_2m ?? [];
    const avgHumidity = humidityArr.length > 0
      ? Math.round(humidityArr.reduce((a, b) => a + b, 0) / humidityArr.length)
      : undefined;

    return {
      ...info,
      temperatureMax: data.daily?.temperature_2m_max?.[0],
      temperatureMin: data.daily?.temperature_2m_min?.[0],
      humidity: avgHumidity,
    };
  } catch {
    return null;
  }
}
