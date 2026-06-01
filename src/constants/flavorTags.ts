export type FlavorTagGroup = 'aroma' | 'taste' | 'mouthfeel' | 'finish';

export interface FlavorTagDefinition {
  group: FlavorTagGroup;
  category: string;
  tagId: string;
  tagKo: string;
  tagEn: string;
  descriptionKo: string;
  descriptionEn: string;
}

const FLAVOR_TAG_ROWS = [
  {
    "group": "aroma",
    "category": "vegetal",
    "tag_id": "grassy",
    "tag_ko": "풀향",
    "tag_en": "grassy",
    "description_ko": "갓 깎은 잔디·어린 풀잎 같은 신선한 녹색 향. 주로 녹차나 가볍게 산화된 차에서 느껴진다.",
    "description_en": "Fresh-cut grass or young green leaf aroma, typical in green or lightly oxidized teas."
  },
  {
    "group": "aroma",
    "category": "vegetal",
    "tag_id": "fresh_leaf",
    "tag_ko": "생잎/찻잎 향",
    "tag_en": "fresh leaf/tea leaf",
    "description_ko": "방금 따온 찻잎을 손으로 비벼 맡은 듯한 생잎 향.",
    "description_en": "Aroma of freshly picked tea leaves, green and raw."
  },
  {
    "group": "aroma",
    "category": "vegetal",
    "tag_id": "green_vegetable",
    "tag_ko": "풋채소",
    "tag_en": "green vegetables",
    "description_ko": "익히지 않은 오이·샐러리·시금치 같은 풋채소 느낌의 향.",
    "description_en": "Uncooked green vegetables such as cucumber or celery."
  },
  {
    "group": "aroma",
    "category": "vegetal",
    "tag_id": "green_bean",
    "tag_ko": "콩/완두 풋향",
    "tag_en": "green bean/pea",
    "description_ko": "삶기 전 콩·완두에서 나는 풋풋한 콩 비린 향.",
    "description_en": "Raw bean or pea-like green aroma."
  },
  {
    "group": "aroma",
    "category": "vegetal",
    "tag_id": "seaweed",
    "tag_ko": "해조/김류",
    "tag_en": "seaweed",
    "description_ko": "마른 김·김밥용 김·해조류 특유의 짭조름하고 바다스러운 향.",
    "description_en": "Dried seaweed or nori-like marine aroma."
  },
  {
    "group": "aroma",
    "category": "vegetal",
    "tag_id": "herbal",
    "tag_ko": "허브향",
    "tag_en": "herbal",
    "description_ko": "민트·로즈마리·레몬그라스 같은 초록빛 허브 향.",
    "description_en": "Fresh herbal aroma such as mint or rosemary."
  },
  {
    "group": "aroma",
    "category": "floral",
    "tag_id": "general_floral",
    "tag_ko": "꽃향",
    "tag_en": "floral",
    "description_ko": "특정 꽃을 콕 집기 어렵지만 전체적으로 꽃다발·꽃시장 같은 향.",
    "description_en": "General floral impression like mixed bouquet or flower market."
  },
  {
    "group": "aroma",
    "category": "floral",
    "tag_id": "jasmine",
    "tag_ko": "자스민",
    "tag_en": "jasmine",
    "description_ko": "자스민차에서 나는 달콤하고 관능적인 꽃향.",
    "description_en": "Sweet, sensual jasmine flower aroma."
  },
  {
    "group": "aroma",
    "category": "floral",
    "tag_id": "rose",
    "tag_ko": "장미",
    "tag_en": "rose",
    "description_ko": "장미꽃·로즈 워터를 떠올리게 하는 향.",
    "description_en": "Aroma reminiscent of rose petals or rose water."
  },
  {
    "group": "aroma",
    "category": "floral",
    "tag_id": "lavender",
    "tag_ko": "라벤더",
    "tag_en": "lavender",
    "description_ko": "허브성 꽃향으로, 부드럽고 릴렉싱한 라벤더 향.",
    "description_en": "Soft, relaxing lavender-like floral-herbal aroma."
  },
  {
    "group": "aroma",
    "category": "floral",
    "tag_id": "chrysanthemum",
    "tag_ko": "국화",
    "tag_en": "chrysanthemum",
    "description_ko": "감국·국화차에서 나는 은은하고 약간 한방 느낌의 꽃향.",
    "description_en": "Gentle, slightly herbal chrysanthemum flower aroma."
  },
  {
    "group": "aroma",
    "category": "floral",
    "tag_id": "orchid_white",
    "tag_ko": "난향/백화",
    "tag_en": "orchid/white flower",
    "description_ko": "난초·백합·매화 같은 청아한 흰 꽃 향.",
    "description_en": "Delicate orchid or white flower aroma."
  },
  {
    "group": "aroma",
    "category": "floral",
    "tag_id": "osmanthus",
    "tag_ko": "금목서",
    "tag_en": "osmanthus",
    "description_ko": "살구잼과 꽃향이 섞인 듯한 달콤한 금목서 향.",
    "description_en": "Sweet osmanthus blossom aroma with apricot-like notes."
  },
  {
    "group": "aroma",
    "category": "fruity",
    "tag_id": "general_fruity",
    "tag_ko": "과일향",
    "tag_en": "fruity",
    "description_ko": "특정 과일은 꼽기 어렵지만 전반적으로 과일즙·과일차 같은 인상이 날 때.",
    "description_en": "General fruity impression similar to mixed fruit juice or fruit tea."
  },
  {
    "group": "aroma",
    "category": "fruity",
    "tag_id": "citrus",
    "tag_ko": "감귤/시트러스",
    "tag_en": "citrus",
    "description_ko": "귤껍질·오렌지·자몽·라임 같은 상큼한 껍질 향.",
    "description_en": "Citrus peel notes like orange, tangerine or grapefruit."
  },
  {
    "group": "aroma",
    "category": "fruity",
    "tag_id": "lemon_yuzu",
    "tag_ko": "레몬/유자",
    "tag_en": "lemon/yuzu",
    "description_ko": "레몬껍질·유자차를 떠올리게 하는 진한 상큼함.",
    "description_en": "Bright lemon or yuzu-like citrus aroma."
  },
  {
    "group": "aroma",
    "category": "fruity",
    "tag_id": "apple_pear",
    "tag_ko": "사과/배",
    "tag_en": "apple/pear",
    "description_ko": "생사과·배를 베어 물었을 때 나는 맑고 부드러운 과일향.",
    "description_en": "Fresh apple or pear notes, mild and clean."
  },
  {
    "group": "aroma",
    "category": "fruity",
    "tag_id": "peach_apricot",
    "tag_ko": "복숭아/살구",
    "tag_en": "peach/apricot",
    "description_ko": "잘 익은 복숭아·살구처럼 부드럽고 과즙 많은 향.",
    "description_en": "Ripe peach or apricot-like juicy aroma."
  },
  {
    "group": "aroma",
    "category": "fruity",
    "tag_id": "berries",
    "tag_ko": "베리류",
    "tag_en": "berries",
    "description_ko": "딸기·라즈베리·블루베리 등 작은 베리의 새콤달콤한 향.",
    "description_en": "Red or dark berry notes such as strawberry or raspberry."
  },
  {
    "group": "aroma",
    "category": "fruity",
    "tag_id": "dried_fruit",
    "tag_ko": "건과일/건포도",
    "tag_en": "dried fruit/raisin",
    "description_ko": "건포도·말린 자두·말린 살구 같은 농축된 달콤한 향.",
    "description_en": "Concentrated dried fruit aroma like raisins or prunes."
  },
  {
    "group": "aroma",
    "category": "fruity",
    "tag_id": "plum_prune",
    "tag_ko": "자두/말린 자두",
    "tag_en": "plum/prune",
    "description_ko": "와인 같은 깊은 과일향으로, 자두·프룬 느낌.",
    "description_en": "Deep stone-fruit aroma reminiscent of plums or prunes."
  },
  {
    "group": "aroma",
    "category": "fruity",
    "tag_id": "muscat_grape",
    "tag_ko": "머스캣/포도",
    "tag_en": "honeyed muscat/grape",
    "description_ko": "머스캣 포도·화이트 와인 같은 포도향과 달콤함.",
    "description_en": "Grape-like muscat aroma with honeyed character."
  },
  {
    "group": "aroma",
    "category": "sweet",
    "tag_id": "general_sweet",
    "tag_ko": "단향",
    "tag_en": "sweet aroma",
    "description_ko": "구체적인 설탕·꿀은 아니지만 전반적으로 달게 느껴지는 향.",
    "description_en": "General sweet smell without a specific sugar note."
  },
  {
    "group": "aroma",
    "category": "sweet",
    "tag_id": "honey",
    "tag_ko": "꿀",
    "tag_en": "honey",
    "description_ko": "벌꿀·꿀차 같은 점성이 느껴지는 달콤한 향.",
    "description_en": "Thick, honey-like sweet aroma."
  },
  {
    "group": "aroma",
    "category": "sweet",
    "tag_id": "brown_sugar",
    "tag_ko": "흑설탕/갈색당",
    "tag_en": "brown sugar",
    "description_ko": "정제 설탕보다 깊고 구운 느낌이 있는 갈색당 향.",
    "description_en": "Brown sugar note with deeper caramelized sweetness."
  },
  {
    "group": "aroma",
    "category": "sweet",
    "tag_id": "caramel",
    "tag_ko": "캐러멜",
    "tag_en": "caramel",
    "description_ko": "설탕을 졸였을 때 나는 구수한 달콤한 캐러멜 향.",
    "description_en": "Caramelized sugar aroma, warm and sweet."
  },
  {
    "group": "aroma",
    "category": "sweet",
    "tag_id": "molasses",
    "tag_ko": "당밀/몰라시스",
    "tag_en": "molasses",
    "description_ko": "조청·당밀처럼 진득하고 약간 쌉쌀한 달콤함.",
    "description_en": "Thick, molasses-like sweet aroma with slight bitterness."
  },
  {
    "group": "aroma",
    "category": "sweet",
    "tag_id": "vanilla",
    "tag_ko": "바닐라",
    "tag_en": "vanilla",
    "description_ko": "바닐라빈·바닐라 아이스크림 같은 크리미한 달콤함.",
    "description_en": "Creamy vanilla note reminiscent of vanilla beans or ice cream."
  },
  {
    "group": "aroma",
    "category": "roasted",
    "tag_id": "roasted",
    "tag_ko": "볶은 향",
    "tag_en": "roasted",
    "description_ko": "보리차·현미차처럼 곡물을 볶았을 때 나는 고소한 향.",
    "description_en": "Toasted grain-like roasted aroma."
  },
  {
    "group": "aroma",
    "category": "roasted",
    "tag_id": "toast",
    "tag_ko": "토스트",
    "tag_en": "toast",
    "description_ko": "구운 식빵·토스트 같은 따뜻한 구운 향.",
    "description_en": "Warm, toasted bread note."
  },
  {
    "group": "aroma",
    "category": "roasted",
    "tag_id": "grain",
    "tag_ko": "곡물향",
    "tag_en": "grain/cereal",
    "description_ko": "밥·쌀·보리 등 익힌 곡물에서 나는 고소한 향.",
    "description_en": "Cooked rice or cereal-like grain aroma."
  },
  {
    "group": "aroma",
    "category": "roasted",
    "tag_id": "roasted_nut",
    "tag_ko": "구운 견과",
    "tag_en": "roasted nuts",
    "description_ko": "구운 아몬드·호두·땅콩 같은 기름지고 고소한 향.",
    "description_en": "Roasted nuts aroma such as almond or peanut."
  },
  {
    "group": "aroma",
    "category": "roasted",
    "tag_id": "chestnut_nurungji",
    "tag_ko": "밤/누룽지",
    "tag_en": "roasted chestnut/scorched rice",
    "description_ko": "군밤·구운 고구마·누룽지 같은 구수한 향.",
    "description_en": "Toasty chestnut or scorched rice note."
  },
  {
    "group": "aroma",
    "category": "roasted",
    "tag_id": "smoky",
    "tag_ko": "탄향/스모키",
    "tag_en": "smoky",
    "description_ko": "숯불·훈제 음식 같은 연기향. 과하면 결점이 될 수 있다.",
    "description_en": "Smoke or charcoal-like aroma; can be a fault if too strong."
  },
  {
    "group": "aroma",
    "category": "roasted",
    "tag_id": "woody",
    "tag_ko": "목질/우디",
    "tag_en": "woody",
    "description_ko": "마른 나무·연필심 같은 건조한 나무 향.",
    "description_en": "Dry wood or bark-like aroma."
  },
  {
    "group": "aroma",
    "category": "spicy",
    "tag_id": "general_spice",
    "tag_ko": "향신료",
    "tag_en": "spicy",
    "description_ko": "특정 향신료를 집기 어렵지만 전체적으로 스파이스 랙 같은 향.",
    "description_en": "General mixed spice aroma."
  },
  {
    "group": "aroma",
    "category": "spicy",
    "tag_id": "cinnamon",
    "tag_ko": "계피",
    "tag_en": "cinnamon",
    "description_ko": "시나몬 가루·시나몬 롤의 달콤한 향신 향.",
    "description_en": "Sweet cinnamon-like spicy aroma."
  },
  {
    "group": "aroma",
    "category": "spicy",
    "tag_id": "pepper",
    "tag_ko": "후추",
    "tag_en": "pepper",
    "description_ko": "후추·알싸한 매운 향. 혀끝을 톡 쏘는 느낌과 함께 온다.",
    "description_en": "Peppery aroma with slight pungency."
  },
  {
    "group": "aroma",
    "category": "spicy",
    "tag_id": "clove",
    "tag_ko": "정향",
    "tag_en": "clove",
    "description_ko": "진한 향초·한약제 같은 묵직한 정향 향.",
    "description_en": "Heavy clove-like spice aroma."
  },
  {
    "group": "aroma",
    "category": "spicy",
    "tag_id": "ginger",
    "tag_ko": "생강",
    "tag_en": "ginger",
    "description_ko": "생강차·생강쿠키처럼 따뜻한 매운 향.",
    "description_en": "Warm ginger spice aroma."
  },
  {
    "group": "aroma",
    "category": "spicy",
    "tag_id": "cardamom_like",
    "tag_ko": "카다멈 느낌",
    "tag_en": "cardamom-like",
    "description_ko": "차이에서 나는 상쾌하면서 매운 카다멈 계열 향.",
    "description_en": "Cardamom-like fresh and spicy aroma."
  },
  {
    "group": "aroma",
    "category": "earthy",
    "tag_id": "earthy",
    "tag_ko": "흙향",
    "tag_en": "earthy",
    "description_ko": "젖지 않은 화분 흙 같은 건조한 흙냄새.",
    "description_en": "Dry soil-like earthy aroma."
  },
  {
    "group": "aroma",
    "category": "earthy",
    "tag_id": "wet_earth",
    "tag_ko": "젖은 흙",
    "tag_en": "wet earth",
    "description_ko": "비 온 뒤 흙냄새·숲길의 촉촉한 흙.",
    "description_en": "Wet soil or forest floor aroma after rain."
  },
  {
    "group": "aroma",
    "category": "earthy",
    "tag_id": "forest_wood",
    "tag_ko": "나무/삼림",
    "tag_en": "forest/woodland",
    "description_ko": "마른 낙엽·이끼 낀 나무껍질 같은 삼림 향.",
    "description_en": "Forest or woodland note with leaves and wood."
  },
  {
    "group": "aroma",
    "category": "earthy",
    "tag_id": "mushroom",
    "tag_ko": "버섯",
    "tag_en": "mushroom",
    "description_ko": "생버섯·말린 표고 같은 흙내와 구수함이 섞인 향.",
    "description_en": "Fresh or dried mushroom-like aroma."
  },
  {
    "group": "aroma",
    "category": "earthy",
    "tag_id": "fermented",
    "tag_ko": "발효취",
    "tag_en": "fermented",
    "description_ko": "젖산발효음료·숙성식품에서 느껴지는 발효 향.",
    "description_en": "Fermented, lactic or aged-food-like aroma."
  },
  {
    "group": "aroma",
    "category": "earthy",
    "tag_id": "yeasty_dough",
    "tag_ko": "효모/빵 반죽",
    "tag_en": "yeasty/dough",
    "description_ko": "반죽이 부풀어 오를 때 나는 효모·빵 반죽 향.",
    "description_en": "Yeasty bread dough aroma."
  },
  {
    "group": "aroma",
    "category": "earthy",
    "tag_id": "cellar",
    "tag_ko": "창고 숙성",
    "tag_en": "cellar/storage",
    "description_ko": "찻창·지하실·오래된 창고 같은 서늘한 숙성 향.",
    "description_en": "Cool cellar or storage-like aging aroma."
  },
  {
    "group": "aroma",
    "category": "cooling",
    "tag_id": "mint",
    "tag_ko": "민트",
    "tag_en": "mint",
    "description_ko": "생민트 잎·민트티 같은 상쾌한 박하 향.",
    "description_en": "Fresh mint leaf aroma."
  },
  {
    "group": "aroma",
    "category": "cooling",
    "tag_id": "peppermint",
    "tag_ko": "페퍼민트",
    "tag_en": "peppermint",
    "description_ko": "치약·박하사탕 같은 강한 박하향.",
    "description_en": "Strong peppermint candy or toothpaste-like aroma."
  },
  {
    "group": "aroma",
    "category": "cooling",
    "tag_id": "menthol",
    "tag_ko": "멘톨/청량",
    "tag_en": "menthol/cooling",
    "description_ko": "멘톨 캔디·쿨링제 같은 싸한 청량 향.",
    "description_en": "Menthol-like cooling aroma and sensation."
  },
  {
    "group": "aroma",
    "category": "cooling",
    "tag_id": "refreshing_herbs",
    "tag_ko": "상쾌한 허브",
    "tag_en": "refreshing herbs",
    "description_ko": "레몬 허브티 같은 산뜻하고 시원한 허브 향.",
    "description_en": "Refreshing herbal blend with light cooling effect."
  },
  {
    "group": "taste",
    "category": "basic",
    "tag_id": "sweet",
    "tag_ko": "단맛",
    "tag_en": "sweet",
    "description_ko": "설탕·꿀·과일처럼 혀끝에서 느껴지는 기본적인 단맛.",
    "description_en": "Basic sweetness perceived on the tongue like sugar or honey."
  },
  {
    "group": "taste",
    "category": "basic",
    "tag_id": "bitter",
    "tag_ko": "쓴맛",
    "tag_en": "bitter",
    "description_ko": "카페인·약처럼 느껴지는 기본적인 쓴맛. 농도에 따라 쾌/불쾌가 달라진다.",
    "description_en": "Basic bitterness like caffeine or medicine; pleasant or unpleasant depending on intensity."
  },
  {
    "group": "taste",
    "category": "basic",
    "tag_id": "sour",
    "tag_ko": "신맛",
    "tag_en": "sour",
    "description_ko": "레몬·사과·발효음료 같은 산미. 입맛을 돋우거나 과하면 시큼하게 느껴진다.",
    "description_en": "Acidic sourness like lemon or fermented drinks."
  },
  {
    "group": "taste",
    "category": "basic",
    "tag_id": "umami",
    "tag_ko": "감칠맛",
    "tag_en": "umami",
    "description_ko": "다시마·육수 같은 깊이 있는 구수함. 국물 같다 느껴질 때 사용.",
    "description_en": "Savory umami like broth or stock."
  },
  {
    "group": "taste",
    "category": "basic",
    "tag_id": "salty",
    "tag_ko": "짠맛",
    "tag_en": "salty",
    "description_ko": "미세한 염 맛. 차에서는 약하게 느껴질 수 있다.",
    "description_en": "Light saltiness occasionally perceived in tea."
  },
  {
    "group": "taste",
    "category": "direction",
    "tag_id": "vegetal_flavor",
    "tag_ko": "식물성 풍미",
    "tag_en": "vegetal flavor",
    "description_ko": "맛 자체가 풀·찻잎·채소를 떠올리게 하는 경우.",
    "description_en": "Flavor direction reminiscent of leaves or green vegetables."
  },
  {
    "group": "taste",
    "category": "direction",
    "tag_id": "floral_forward",
    "tag_ko": "꽃향 중심",
    "tag_en": "floral-forward",
    "description_ko": "맛과 여운이 전반적으로 꽃 느낌 위주일 때.",
    "description_en": "Flavor and aftertaste dominated by floral notes."
  },
  {
    "group": "taste",
    "category": "direction",
    "tag_id": "fruity_forward",
    "tag_ko": "과일 중심",
    "tag_en": "fruity-forward",
    "description_ko": "맛의 인상이 과일 주스·과일차에 가까운 경우.",
    "description_en": "Overall flavor direction is fruity like juice or fruit tea."
  },
  {
    "group": "taste",
    "category": "direction",
    "tag_id": "honey_sweet",
    "tag_ko": "꿀/달콤함",
    "tag_en": "honeyed/sweet",
    "description_ko": "혀에 남는 단맛이 꿀·시럽 계열에 가깝고 농도가 느껴질 때.",
    "description_en": "Honey-like, syrupy sweet flavor impression."
  },
  {
    "group": "taste",
    "category": "direction",
    "tag_id": "roasted_toasty",
    "tag_ko": "볶음/구운 맛",
    "tag_en": "roasted/toasty",
    "description_ko": "보리차처럼 입 안에서 고소하고 구운 곡물 맛이 강할 때.",
    "description_en": "Roasted or toasted cereal-like flavor."
  },
  {
    "group": "taste",
    "category": "direction",
    "tag_id": "earthy_aged",
    "tag_ko": "흙/숙성",
    "tag_en": "earthy/aged",
    "description_ko": "맛이 흙·나무·숙성식품을 연상시킬 만큼 묵직할 때.",
    "description_en": "Deep earthy or aged-food-like flavor direction."
  },
  {
    "group": "taste",
    "category": "direction",
    "tag_id": "nutty",
    "tag_ko": "견과",
    "tag_en": "nutty",
    "description_ko": "아몬드·호두·땅콩처럼 고소하고 기름진 맛.",
    "description_en": "Nutty flavor note like roasted nuts."
  },
  {
    "group": "taste",
    "category": "direction",
    "tag_id": "spiced",
    "tag_ko": "향신",
    "tag_en": "spiced",
    "description_ko": "계피·후추·정향 등 향신 요소가 맛으로도 느껴질 때.",
    "description_en": "Spice-driven flavor such as cinnamon or pepper."
  },
  {
    "group": "taste",
    "category": "direction",
    "tag_id": "brown_flavor",
    "tag_ko": "갈색 풍미",
    "tag_en": "brown/caramelized",
    "description_ko": "캐러멜·흑설탕처럼 갈색 계열의 캐러멜라이즈드 맛.",
    "description_en": "Brown, caramelized flavor similar to caramel or brown sugar."
  },
  {
    "group": "taste",
    "category": "defect",
    "tag_id": "too_bitter",
    "tag_ko": "너무 씀",
    "tag_en": "overly bitter",
    "description_ko": "적당한 쓴맛을 넘어서 약·탄맛처럼 부담스럽게 느껴질 정도의 강한 쓴맛.",
    "description_en": "Bitterness perceived as too strong or unpleasant."
  },
  {
    "group": "taste",
    "category": "defect",
    "tag_id": "too_astringent",
    "tag_ko": "떫음 강함",
    "tag_en": "overly astringent",
    "description_ko": "입 안이 심하게 마르고 수축되는 떫은 느낌. 우린 시간·농도 과다일 수 있음.",
    "description_en": "Excessive drying, puckering astringency."
  },
  {
    "group": "taste",
    "category": "defect",
    "tag_id": "harsh",
    "tag_ko": "자극적임",
    "tag_en": "harsh/irritating",
    "description_ko": "목을 긁거나 혀를 따갑게 하는 날카로운 맛.",
    "description_en": "Harsh, aggressive taste that irritates the mouth or throat."
  },
  {
    "group": "taste",
    "category": "defect",
    "tag_id": "over_fermented",
    "tag_ko": "발효취 강함",
    "tag_en": "overly fermented",
    "description_ko": "좋은 숙성 향을 넘어서 쉰 음식 같은 발효 맛이 강할 때.",
    "description_en": "Fermented flavor perceived as overdone or off-like."
  },
  {
    "group": "taste",
    "category": "defect",
    "tag_id": "dull_heavy",
    "tag_ko": "탁함/무거움",
    "tag_en": "dull/heavy",
    "description_ko": "맛이 뭉치고 답답해서 입 안이 무겁고 깔끔하지 않게 느껴지는 상태.",
    "description_en": "Dull, heavy taste lacking clarity or brightness."
  },
  {
    "group": "mouthfeel",
    "category": "body",
    "tag_id": "light_body",
    "tag_ko": "가벼움",
    "tag_en": "light-bodied",
    "description_ko": "물처럼 맑고 가벼워 입 안에 거의 남지 않는 질감.",
    "description_en": "Light-bodied, similar to water, leaving little weight in the mouth."
  },
  {
    "group": "mouthfeel",
    "category": "body",
    "tag_id": "medium_body",
    "tag_ko": "중간 바디",
    "tag_en": "medium-bodied",
    "description_ko": "너무 가볍지도 무겁지도 않은 평균적인 바디감.",
    "description_en": "Medium-bodied, neither too light nor too heavy."
  },
  {
    "group": "mouthfeel",
    "category": "body",
    "tag_id": "full_body",
    "tag_ko": "묵직함/풀바디",
    "tag_en": "full-bodied",
    "description_ko": "입 안을 가득 채우는 농도 높은 묵직한 질감.",
    "description_en": "Full-bodied, dense and weighty in the mouth."
  },
  {
    "group": "mouthfeel",
    "category": "texture",
    "tag_id": "smooth",
    "tag_ko": "매끄러움",
    "tag_en": "smooth",
    "description_ko": "거친 느낌 없이 물이 미끄러지듯 넘어가는 질감.",
    "description_en": "Smooth texture without roughness."
  },
  {
    "group": "mouthfeel",
    "category": "texture",
    "tag_id": "soft",
    "tag_ko": "부드러움",
    "tag_en": "soft",
    "description_ko": "자극이 적고 혀와 입천장을 살살 감싸는 부드러운 질감.",
    "description_en": "Soft, gentle mouthfeel with low aggression."
  },
  {
    "group": "mouthfeel",
    "category": "texture",
    "tag_id": "silky",
    "tag_ko": "실키함",
    "tag_en": "silky",
    "description_ko": "비단처럼 얇고 고운 질감. 혀 위를 미끄러지듯 흐른다.",
    "description_en": "Silky, thin and fine texture coating the tongue."
  },
  {
    "group": "mouthfeel",
    "category": "texture",
    "tag_id": "velvety",
    "tag_ko": "벨벳감",
    "tag_en": "velvety",
    "description_ko": "실키보다 조금 더 두툼하고 포근한 고운 질감.",
    "description_en": "Velvety, soft and plush mouthfeel."
  },
  {
    "group": "mouthfeel",
    "category": "texture",
    "tag_id": "creamy",
    "tag_ko": "크리미함",
    "tag_en": "creamy",
    "description_ko": "우유·생크림을 탄 듯한 부드럽고 진한 질감.",
    "description_en": "Cream-like thick and smooth texture."
  },
  {
    "group": "mouthfeel",
    "category": "texture",
    "tag_id": "buttery",
    "tag_ko": "버터리함",
    "tag_en": "buttery",
    "description_ko": "버터를 녹여 마시는 듯한 약간 기름진 부드러운 질감.",
    "description_en": "Buttery, slightly oily and very smooth mouthfeel."
  },
  {
    "group": "mouthfeel",
    "category": "texture",
    "tag_id": "coating",
    "tag_ko": "코팅감",
    "tag_en": "coating",
    "description_ko": "차가 혀와 입천장에 막을 씌운 듯 남아 있는 질감.",
    "description_en": "Coating sensation that clings to mouth surfaces."
  },
  {
    "group": "mouthfeel",
    "category": "sensation",
    "tag_id": "astringent",
    "tag_ko": "떫음/mouth-drying",
    "tag_en": "astringent/mouth-drying",
    "description_ko": "입 안이 마르고 수축되는 떫은 느낌. 타닌 과다 신호일 수 있다.",
    "description_en": "Drying, puckering sensation caused by tannins."
  },
  {
    "group": "mouthfeel",
    "category": "sensation",
    "tag_id": "mouth_watering",
    "tag_ko": "상큼하게 침 고임",
    "tag_en": "mouth-watering",
    "description_ko": "침이 돌고 입 안이 촉촉해지는 느낌. 산미·감칠맛이 적당할 때 자주 생긴다.",
    "description_en": "Mouth-watering effect increasing saliva flow."
  },
  {
    "group": "mouthfeel",
    "category": "sensation",
    "tag_id": "tingling",
    "tag_ko": "톡 쏘는 느낌",
    "tag_en": "tingling",
    "description_ko": "탄산수처럼 미세한 자극이나 살짝 알싸한 찌릿함.",
    "description_en": "Light tingling or prickling sensation on the tongue."
  },
  {
    "group": "mouthfeel",
    "category": "sensation",
    "tag_id": "brisk",
    "tag_ko": "산뜻함/brisk",
    "tag_en": "brisk/crisp",
    "description_ko": "입 안이 선명해지고 또 마시고 싶게 만드는 산뜻한 느낌.",
    "description_en": "Brisk, lively mouthfeel that refreshes the palate."
  },
  {
    "group": "mouthfeel",
    "category": "sensation",
    "tag_id": "warming",
    "tag_ko": "따뜻하게 퍼짐",
    "tag_en": "spreading warmth",
    "description_ko": "삼킨 뒤 가슴·배 쪽으로 따뜻함이 퍼지는 감각.",
    "description_en": "Warmth spreading down the chest after swallowing."
  },
  {
    "group": "mouthfeel",
    "category": "sensation",
    "tag_id": "cooling",
    "tag_ko": "시원하게 퍼짐",
    "tag_en": "spreading coolness",
    "description_ko": "목 뒤·가슴 안쪽에서 시원함이 올라오는 감각.",
    "description_en": "Cooling sensation spreading in the throat and chest."
  },
  {
    "group": "finish",
    "category": "length",
    "tag_id": "short",
    "tag_ko": "짧음",
    "tag_en": "short",
    "description_ko": "삼킨 뒤 금방 사라져 몇 초 안에 비어버리는 여운.",
    "description_en": "Finish disappears quickly within a few seconds."
  },
  {
    "group": "finish",
    "category": "length",
    "tag_id": "medium",
    "tag_ko": "중간",
    "tag_en": "medium",
    "description_ko": "잠깐은 남지만 오래 끌지 않는 평균적인 여운 길이.",
    "description_en": "Medium-length finish that lingers briefly."
  },
  {
    "group": "finish",
    "category": "length",
    "tag_id": "long",
    "tag_ko": "김",
    "tag_en": "long",
    "description_ko": "한 모금 후에도 향·맛이 오래 남는 긴 여운.",
    "description_en": "Long finish where flavor and aroma persist noticeably."
  },
  {
    "group": "finish",
    "category": "character",
    "tag_id": "sweet_finish",
    "tag_ko": "단 여운",
    "tag_en": "sweet finish",
    "description_ko": "혀 뒤쪽에서 단맛이 은근히 남아 있는 여운. 회감 느낌.",
    "description_en": "Subtle sweetness that remains at the back of the tongue."
  },
  {
    "group": "finish",
    "category": "character",
    "tag_id": "floral_finish",
    "tag_ko": "꽃 여운",
    "tag_en": "floral finish",
    "description_ko": "삼킨 뒤에도 꽃향이 목 뒤에 부드럽게 남는 여운.",
    "description_en": "Floral impression lingering in the throat after swallowing."
  },
  {
    "group": "finish",
    "category": "character",
    "tag_id": "fruity_finish",
    "tag_ko": "과일 여운",
    "tag_en": "fruity finish",
    "description_ko": "과일 캔디·과일껍질 느낌이 입 안에서 계속 떠오르는 여운.",
    "description_en": "Fruity notes lingering after the sip."
  },
  {
    "group": "finish",
    "category": "character",
    "tag_id": "roasted_finish",
    "tag_ko": "볶음 여운",
    "tag_en": "roasted finish",
    "description_ko": "구수한 곡물·볶은 견과의 여운이 남는 마무리.",
    "description_en": "Roasted grain or nutty aftertaste."
  },
  {
    "group": "finish",
    "category": "character",
    "tag_id": "cooling_finish",
    "tag_ko": "청량한 여운",
    "tag_en": "cooling finish",
    "description_ko": "목 뒤가 시원하거나 입 안이 산뜻해지는 마무리.",
    "description_en": "Cooling or refreshing sensation in the finish."
  },
  {
    "group": "finish",
    "category": "character",
    "tag_id": "astringent_finish",
    "tag_ko": "떫은 여운",
    "tag_en": "astringent finish",
    "description_ko": "삼킨 뒤에도 입 안이 계속 마르고 뻣뻣한 상태가 이어지는 여운.",
    "description_en": "Lingering astringent dryness in the aftertaste."
  },
  {
    "group": "finish",
    "category": "character",
    "tag_id": "dry_finish",
    "tag_ko": "드라이한 마무리",
    "tag_en": "dry finish",
    "description_ko": "와인처럼 입 안이 깔끔하게 말라가는 드라이한 마무리.",
    "description_en": "Dry, wine-like finish without sweetness."
  },
  {
    "group": "finish",
    "category": "character",
    "tag_id": "clean_finish",
    "tag_ko": "깨끗한 마무리",
    "tag_en": "clean finish",
    "description_ko": "이물감 없이 물로 헹군 듯 맑게 사라지는 마무리.",
    "description_en": "Clean finish with no off-notes or residue."
  },
  {
    "group": "finish",
    "category": "character",
    "tag_id": "muddy_finish",
    "tag_ko": "텁텁한 마무리",
    "tag_en": "muddy finish",
    "description_ko": "입 안에 먼지·종이·찌꺼기가 남은 듯 불쾌한 텁텁한 마무리.",
    "description_en": "Unpleasant, muddy aftertaste with lingering off-notes."
  }
] as const;

export const FLAVOR_TAGS = FLAVOR_TAG_ROWS.map((row) => ({
  group: row.group,
  category: row.category,
  tagId: row.tag_id,
  tagKo: row.tag_ko,
  tagEn: row.tag_en,
  descriptionKo: row.description_ko,
  descriptionEn: row.description_en,
})) satisfies readonly FlavorTagDefinition[];

export const FLAVOR_TAG_LABELS = FLAVOR_TAGS.map((tag) => tag.tagKo);

export const FLAVOR_TAGS_BY_ID = Object.fromEntries(
  FLAVOR_TAGS.map((tag) => [tag.tagId, tag]),
) as Record<string, FlavorTagDefinition>;

export const FLAVOR_TAG_LABEL_BY_ID = Object.fromEntries(
  FLAVOR_TAGS.map((tag) => [tag.tagId, tag.tagKo]),
) as Record<string, string>;

export const FLAVOR_TAG_CSV_PATH = '/data/tea_flavor_tags_v1.csv';
