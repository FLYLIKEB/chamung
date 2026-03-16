const WMO_CODE_MAP: Record<number, { emoji: string; label: string; teaComment: string }> = {
  0: { emoji: '☀️', label: '맑음', teaComment: '맑은 하늘 아래, 오늘의 차 한 잔이 더 특별하게 느껴지는 날이에요.' },
  1: { emoji: '🌤️', label: '대체로 맑음', teaComment: '따스한 햇살이 내리는 오후, 좋아하는 차와 함께 잠시 쉬어가세요.' },
  2: { emoji: '⛅', label: '구름 조금', teaComment: '구름 사이로 비치는 햇살처럼, 은은한 차 한 잔이 어울리는 날이에요.' },
  3: { emoji: '☁️', label: '흐림', teaComment: '흐린 날에도 따뜻한 차 한 잔이면 마음만은 포근해져요.' },
  45: { emoji: '🌫️', label: '안개', teaComment: '안개 낀 고요한 아침, 차 한 잔으로 하루를 천천히 시작해보세요.' },
  48: { emoji: '🌫️', label: '안개', teaComment: '안개처럼 은은하게 퍼지는 차향, 오늘 하루도 부드럽게.' },
  51: { emoji: '🌧️', label: '이슬비', teaComment: '이슬비가 내리는 날, 창가에 앉아 차 한 잔의 여유를 가져보세요.' },
  53: { emoji: '🌧️', label: '이슬비', teaComment: '부슬부슬 내리는 비와 따뜻한 차, 참 잘 어울리는 조합이에요.' },
  55: { emoji: '🌧️', label: '이슬비', teaComment: '비 내리는 소리를 들으며 마시는 차는 왠지 더 깊은 맛이 나요.' },
  56: { emoji: '🌧️', label: '진눈깨비', teaComment: '쌀쌀한 날씨에 따뜻한 차 한 잔, 몸도 마음도 녹여줄 거예요.' },
  57: { emoji: '🌧️', label: '진눈깨비', teaComment: '추위 속에서도 따뜻한 차 한 잔이면 충분히 행복해질 수 있어요.' },
  61: { emoji: '🌧️', label: '비', teaComment: '비 오는 날의 차 한 잔은 작지만 확실한 위로가 되어줘요.' },
  63: { emoji: '🌧️', label: '비', teaComment: '빗소리를 배경삼아 마시는 차, 오늘의 기록이 더 특별해질 거예요.' },
  65: { emoji: '🌧️', label: '폭우', teaComment: '거센 비가 내리는 날, 실내에서 즐기는 따뜻한 차 한 잔의 평화.' },
  66: { emoji: '🌧️', label: '빙우', teaComment: '차가운 비 속에서도 따뜻한 차 한 잔이 있어 다행이에요.' },
  67: { emoji: '🌧️', label: '빙우', teaComment: '추운 날일수록 차 한 잔의 온기가 더 소중하게 느껴져요.' },
  71: { emoji: '❄️', label: '눈', teaComment: '하얀 눈이 내리는 날, 창밖을 바라보며 마시는 차 한 잔의 낭만.' },
  73: { emoji: '❄️', label: '눈', teaComment: '눈 내리는 풍경과 따뜻한 차, 겨울만의 특별한 순간이에요.' },
  75: { emoji: '❄️', label: '폭설', teaComment: '폭설이 내리는 날, 집에서 따뜻한 차와 함께 쉬어가세요.' },
  77: { emoji: '❄️', label: '눈', teaComment: '눈 오는 날의 포근함, 차 한 잔으로 완성해보세요.' },
  80: { emoji: '🌦️', label: '소나기', teaComment: '소나기가 지나간 뒤의 개운함처럼, 상쾌한 차 한 잔 어때요?' },
  81: { emoji: '🌦️', label: '소나기', teaComment: '갑작스런 소나기에도 차 한 잔이 있다면 괜찮아요.' },
  82: { emoji: '🌦️', label: '폭우', teaComment: '거센 비 속에서 즐기는 묵직한 차 한 잔, 마음이 단단해져요.' },
  85: { emoji: '❄️', label: '눈', teaComment: '소복이 쌓이는 눈처럼, 차 한 잔의 여유도 소중히 쌓아가세요.' },
  86: { emoji: '❄️', label: '폭설', teaComment: '세상이 하얗게 변하는 날, 따뜻한 차 한 잔으로 온기를 나눠요.' },
  95: { emoji: '🌩️', label: '뇌우', teaComment: '천둥번개가 치는 날에도 차 한 잔이면 마음이 고요해져요.' },
  96: { emoji: '🌩️', label: '뇌우', teaComment: '폭풍우 속에서도 차 한 잔의 평화는 변하지 않아요.' },
  99: { emoji: '🌩️', label: '뇌우', teaComment: '거센 비바람이 지나면 맑은 날이 올 거예요. 차 한 잔과 함께 기다려요.' },
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
  return WMO_CODE_MAP[code] ?? { emoji: '❓', label: '알 수 없음', teaComment: '어떤 날씨든, 좋아하는 차 한 잔이면 충분해요.' };
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
