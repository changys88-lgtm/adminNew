function cutDate(str, gubun = '-', type = '') {
  if (str === 'OPEN') return '미지정';
  if (str.length === 10) str = timeFromUnix(str);
  str = String(str).replace(/[^0-9]/g, ''); // 숫자만 추출 (StrClear)
  if (!str) return '';

  //str = String(str).replace(/[^0-9]/g, ''); // StrClear() 기능: 숫자만 추출

  if (type === 'S') {
    return str.substring(2, 4) + gubun; // ex) 25-
  }

  if (type === 'SS') {
    return ''; // 예외처리
  }

  let result = str.substring(0, 4); // 연도
  if (str.length >= 6) result += gubun + str.substring(4, 6); // 월
  if (str.length >= 8) result += gubun + str.substring(6, 8); // 일

  return result;
}
function cutDateTime(str, type = '') {
    if (!str) return '';
  
    str = String(str).replace(/[^0-9]/g, ''); // 숫자만 추출 (StrClear)
    if (str.length === 10) str = timeFromUnix(str);

    const y1 = str.substring(0, 2);
    const y2 = str.substring(2, 2 + 2);
    const m = str.substring(4, 4 + 2);
    const d = str.substring(6, 6 + 2);
    const h = str.substring(8, 8 + 2);
    const i = str.substring(10, 10 + 2);
    const s = str.substring(12, 12 + 2);
    const sStr = s ? ':' + s : '';
  
    switch (type) {
      case 'BR':
        if (str.length === 10) return `${y1}-${y2}-${m}<br>${d}:${h}`;
        return `${y2}-${m}-${d}<br>${h}:${i}`;
      case 'S':
        if (str.length === 10) return `${y1}-${y2}-${m} ${d}:${h}`;
        return `${y2}-${m}-${d} ${h}:${i}`;
      case 'SS':
        if (str.length === 10) return `${y2}-${m} ${d}:${h}`;
        return `${m}-${d} ${h}:${i}`;
      case 'L':
        if (parseInt(y1) < 19) return `${y1}년 ${y2}월 ${m}일 ${d}시${h}분`;
        return `${y1}${y2}년 ${m}월 ${d}일 ${h}시${i}분`;
      default:
        return `${y1}${y2}-${m}-${d} ${h}:${i}${sStr}`;
    }
}
function cutTime(str, gubun = ':') {
  if (!str) return '';
  if (typeof str !== 'string') str = String(str);
  str = str.replace(/:/g, '').trim();

  if (str.length === 0) return str;

  if (str.length < 3) {
    return str;
  } else {
    if (str.length < 4 && str.length > 2) {
      str = str.padStart(4, '0'); 
    }

    const cleared = StrClear(str);
    if (cleared.length === 6) {
      return `${str.slice(0,2)}${gubun}${str.slice(2,4)}${gubun}${str.slice(4,6)}`;
    } else if (str.length === 5) {
      return `${str.slice(0,2)}${gubun}${str.slice(2,4)}+${str.slice(4)}`;
    } else {
      return `${str.slice(0,2)}${gubun}${str.slice(2)}`;
    }
  }
}
function StrClear(str) {
  if (typeof str !== 'string') str = String(str || '');
  let result = '';
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    const code = ch.charCodeAt(0);
    if ((code >= 48 && code <= 57) || ch === '.') {
      result += ch;
    }
  }
  return result;
}  
function FltTmCheck(time, minStatus = "", language = "ko") {
  if (!time || isNaN(time)) return "--";

  const minute = time % 60;
  const hour = Math.floor(time / 60);

  if (minStatus === "") {
    if (language === "en") {
      return `${hour}h ${minute}m`;
    } else {
      return `${hour}시간 ${minute}분`;
    }
  } else if (minStatus === ":") {
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  } else if (minStatus === "NULL") {
    return `${String(hour).padStart(2, '0')}${String(minute).padStart(2, '0')}`;
  }
}
function cardNumSplit(str) {
  if (!str || typeof str !== 'string') return ['','','',''];
  const clean = str.trim();
  return [
    clean.slice(0, 4),
    clean.slice(4, 8),
    clean.slice(8, 12),
    clean.slice(12, 16)
  ];
}
function getWeekday(dateStr) {
  if (!dateStr.trim()) return '';
  else {
    const year  = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day   = dateStr.substring(6, 8);
    const date  = new Date(`${year}-${month}-${day}`);
    return date.getDay(); // 0 (일) ~ 6 (토)
  }
}
function getDateTimeNumber(date) {
  const pad = (n) => String(n).padStart(2, '0');

  const yyyy = date.getFullYear();
  const MM = pad(date.getMonth() + 1); // 월은 0부터 시작
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());

  return `${yyyy}${MM}${dd}${hh}${mm}${ss}`;
}

function numberFormat(num) {
    return Number(num).toLocaleString('ko-KR'); // 세 자리마다 , 넣어줌
}

function getWeek(week) {
  const ar = ["일", "월", "화", "수", "목", "금", "토"];
  return ar[week];
}

function makeTime(dateStr,type='K') {
  if (dateStr === null || dateStr === undefined || dateStr === '') return null;
  
  // 안전하게 문자열로 변환
  let str = '';
  if (typeof dateStr === 'string') {
    str = dateStr.trim();
  } else if (typeof dateStr === 'number') {
    str = String(dateStr);
  } else {
    str = String(dateStr || '');
  }
  
  if (!str || str.length < 8) return null;
  
  // 8자리면 시간 정보 추가
  if (str.length === 8) str += '000000';
  
  // 최소 14자리 보장
  str = str.padEnd(14, '0');
  
  const y = str.substring(0, 4) || '0000';
  const m = str.substring(4, 6) || '01';
  const d = str.substring(6, 8) || '01';
  const h = str.substring(8, 10) || '00';
  const i = str.substring(10, 12) || '00';
  const s = str.substring(12, 14) || '00';
  if (type === "unix") {
      return Math.floor(Date.UTC(Number(y), Number(m)-1, Number(d), Number(h) + 9, Number(i), Number(s)) / 1000);
  } else {
      return new Date(`${y}-${m}-${d}T${h}:${i}:${s}`);
  }
}

function timeTermCheck(depart, arrive, minStatus = "") {
  const t1 = makeTime(depart).getTime(); // ms 단위
  const t2 = makeTime(arrive).getTime(); // ms 단위
  return (t1 - t2) / 60000; // → 분 단위
}

function telNumber(input) {
  if (input == null) return input;
  const MOBILE_OR_070_11 = /^(01[016789]|070)\d{8}$/; // 010/011/016/017/018/019, 070 + 8자리

  // 숫자만 추출
  let digits = String(input).replace(/\D/g, '');
  if (!digits) return input;

  // 국가코드 처리: 82xxxxxxxxxxx → 0xxxxxxxxxx
  if (digits.startsWith('82')) {
      digits = '0' + digits.slice(2);
  }

  // 뒤에 잡다한 숫자가 더 있는 경우를 방지: 마지막 11자리만 검사
  if (digits.length >= 11) {
      const last11 = digits.slice(-11);
      if (MOBILE_OR_070_11.test(last11)) {
          return `${last11.slice(0, 3)}-${last11.slice(3, 7)}-${last11.slice(7)}`;
      }
  } else if (digits.length === 10) {
      return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return input; // 인식 불가 시 원본 유지
}

function timeFromUnix (s) {
  let date;
  if (String(s).length === 10) date = new Date(s * 1000);
  else date = new Date(s);
  const pad = n => String(n).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth()+1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}
function BankAnySplit (str) {
  const s = String(str || '').replace(/\D/g, '');
  if (!s) return '';
  return [s.slice(0,3), s.slice(3,6), s.slice(6,9), s.slice(9)]
    .filter(Boolean)
    .join('-');
}
function ticketSplit (str) {
  const s = String(str || '').replace(/\D/g, '');
  if (!s) return '';
  return [s.slice(0,4), s.slice(4,7), s.slice(7)]
    .filter(Boolean)
    .join(' ');
}
function WeekdayOfMonth(year, month, weekday, n) {
  // month: 1~12, weekday: 0(일)~6(토), n: 1~6
  const first = new Date(year, month - 1, 1);
  const firstDow = first.getDay();               // 그달 1일의 요일
  const offset  = (weekday - firstDow + 7) % 7;  // 첫 번째 해당 요일까지 며칠 더?
  const day     = 1 + offset + (n - 1) * 7;      // n번째 해당 요일의 일자
  const dt      = new Date(year, month - 1, day);
  return (dt.getMonth() === month - 1) ? getDateTimeNumber(dt) : null; // 없으면 null(예: 6번째 등)
}

function timeToAgo (cache_time='60') {
    const now   = new Date();
    const limit = new Date(now.getTime() - cache_time * 60 * 1000);
    return getDateTimeNumber(limit);
}

function getLastDays (y,m) {
    return new Date(y,m,0).getDate();
}

module.exports = {
    cutDate, cutDateTime , StrClear , cutTime , FltTmCheck , cardNumSplit , getWeekday , getDateTimeNumber
    , numberFormat , getWeek , makeTime , timeTermCheck , telNumber , BankAnySplit , timeFromUnix , WeekdayOfMonth
    , timeToAgo , ticketSplit , getLastDays
};