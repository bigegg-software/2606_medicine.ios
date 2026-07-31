import moment from 'moment';

export function toLiveId(value?: number | string | null) {
  if (value == null || value === '') return '';
  return String(value);
}

export function formatLiveStartTime(time?: string | null) {
  if (!time?.trim()) return '--';
  const target = moment(time);
  if (!target.isValid()) return time;
  const today = moment().startOf('day');
  const dayDiff = target.clone().startOf('day').diff(today, 'day');
  if (dayDiff === 0) return `今天 ${target.format('HH:mm')}`;
  if (dayDiff === 1) return `明天 ${target.format('HH:mm')}`;
  return target.format('M月D日 HH:mm');
}

/** 信息栏时段文案，如：2026-07-31 10:46  直播 */
export function formatLiveDailySchedule(start?: string | null) {
  if (!start?.trim()) return '';
  const startMoment = moment(start);
  if (!startMoment.isValid()) return '';
  return `${startMoment.format('YYYY-MM-DD HH:mm')}  直播`;
}

export function formatLiveViewCount(count?: number | null) {
  const value = Number(count ?? 0);
  if (!Number.isFinite(value) || value <= 0) return '0人次观看';
  return `${value}人次观看`;
}

export function formatLiveWatchingCount(count?: number | null) {
  const value = Number(count ?? 0);
  const safe = Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  return `${safe.toLocaleString('en-US')}人次观看`;
}

/** 预约人数展示用数字 */
export function formatLiveReserveCount(count?: number | null) {
  const value = Number(count ?? 0);
  const safe = Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  return safe.toLocaleString('en-US');
}

export function getLiveStatusText(status?: number, statusName?: string) {
  if (statusName?.trim()) return statusName.trim();
  if (status === 1) return '直播中';
  if (status === 2) return '已结束';
  return '未开始';
}

export function getLiveStatusStyle(status?: number) {
  if (status === 1) {
    return { bg: '#6D925E', text: '#FFFFFF', dot: '#FFFFFF' };
  }
  if (status === 2) {
    return { bg: '#FB4550', text: '#FFFFFF', dot: '#FFFFFF' };
  }
  return { bg: '#EE9C44', text: '#FFFFFF', dot: '#FFFFFF' };
}

/** 第三方观看链接 */
export function getLiveWatchUrl(live: {
  liveLink?: string | null;
  watchUrl?: string | null;
} | null | undefined) {
  const url = live?.liveLink?.trim() || live?.watchUrl?.trim() || '';
  return url;
}

/** 观看方式文案：跳转第三方平台 小鹅通 观看 */
export function formatLiveWatchMethodText(platformLabel?: string | null) {
  const platform = platformLabel?.trim() || '第三方平台';
  return `跳转第三方平台 ${platform} 观看`;
}

/** 将富文本 HTML 包装为可自适应高度的 WebView 文档 */
export function buildRichHtmlDocument(
  html: string,
  options?: { color?: string; fontSize?: number; lineHeight?: number },
) {
  const color = options?.color ?? '#333333';
  const fontSize = options?.fontSize ?? 14;
  const lineHeight = options?.lineHeight ?? 22;
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
<style>
  html, body { margin: 0; padding: 0; background: transparent; }
  body {
    color: ${color};
    font-size: ${fontSize}px;
    line-height: ${lineHeight}px;
    word-wrap: break-word;
    overflow-wrap: break-word;
    -webkit-text-size-adjust: 100%;
  }
  img { max-width: 100%; height: auto; }
  p { margin: 0 0 8px; }
  ul, ol { padding-left: 1.2em; margin: 0 0 8px; }
  li { margin-bottom: 4px; }
  h1, h2, h3, h4 { margin: 0 0 8px; font-size: 15px; font-weight: 600; }
  a { color: #6D925E; }
</style>
</head>
<body>${html}
<script>
  function postHeight() {
    var h = Math.max(
      document.body.scrollHeight || 0,
      document.documentElement.scrollHeight || 0
    );
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(String(h));
    }
  }
  postHeight();
  window.addEventListener('load', postHeight);
  setTimeout(postHeight, 50);
  setTimeout(postHeight, 200);
</script>
</body>
</html>`;
}
