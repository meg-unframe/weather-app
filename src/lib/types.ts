// クライアント・サーバー共通の型定義

export type Location = {
  name: string;
  state?: string;
  country: string;
  lat: number;
  lon: number;
};

export type Condition = {
  description: string;
  icon: string;
};

export type CurrentWeather = {
  /** 観測時刻 (UNIX秒) */
  dt: number;
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  condition: Condition;
  /** 直近1時間の降水量 (mm)。APIが返さない場合は undefined */
  rain1h?: number;
  snow1h?: number;
};

export type ForecastSlot = {
  /** 予報対象時刻 (UNIX秒) */
  dt: number;
  /** 現地時刻の日付 YYYY-MM-DD */
  date: string;
  /** 現地時刻の時 0-23 */
  hour: number;
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  /** 降水確率 0-100 (%) */
  pop: number;
  condition: Condition;
  /** 3時間の降水量 (mm) */
  rain3h?: number;
  snow3h?: number;
};

export type WeatherResponse = {
  location: Location;
  /** UTCからの時差 (秒) */
  timezoneOffset: number;
  /** 現地時刻での今日 YYYY-MM-DD */
  today: string;
  current: CurrentWeather;
  forecast: ForecastSlot[];
};

export type ApiError = {
  error: string;
};
