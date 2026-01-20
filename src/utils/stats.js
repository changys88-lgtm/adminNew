const deps = require('../../src/common/dependencies');
/**
 * 한 건(row) 기준 집계
 * @param {object} aData    누적 객체 (initDayStats() 결과)
 * @param {object} put      DB row (mssql record)
 * @param {object} opts     { GU1, GU5 }
 *   - GU1: 'ISSUE' | 'ORDER' | 'DEP'
 *   - GU5: 'DAY' | 'MONTH'
 */

function initDayStats(existing) {
    const aData = existing || {};
    if (!aData.DAY) {
        aData.DAY = {
            TOTAL: 0,
            AIRAMT: 0,
            TAXAMT: 0,
            MEMBER: 0,
            ORDERS: 0,
            ORDER2: 0
        };
    }
    if (typeof aData.TOT !== 'number') aData.TOT = 0;
    return aData;
}

function accumulateDayRow(aData, put, { GU1, GU5 }) {
  
  initDayStats(aData);
  const in_status      = String(put.in_status ?? '').trim();
  const issue_date     = String(put.issue_date ?? '').trim();
  const order_date     = String(put.order_date ?? '').trim();
  const in_date        = String(put.in_date ?? '').trim();
  let   total_amount   = Number(put.total_amount ?? 0);
  const adult_member   = Number(put.adult_member ?? 0);
  const child_member   = Number(put.child_member ?? 0);
  const infant_member  = Number(put.infant_member ?? 0);
  const air_amount     = Number(put.air_amount ?? 0);
  const child_amount   = Number(put.child_amount ?? 0);
  const infant_amount  = Number(put.infant_amount ?? 0);
  const adult_tax      = Number(put.adult_tax ?? 0);
  const child_tax      = Number(put.child_tax ?? 0);
  const infant_tax     = Number(put.infant_tax ?? 0);

  // in_status 4,5,6,7일 때만 매출 집계
  let gubun = ''; // DAY key (일/월)

  if (/[4567]/i.test(in_status)) {
    aData.TOT += total_amount;

    const member  = adult_member + child_member + infant_member;
    const air_amt = (air_amount * adult_member) + 
                    (child_amount * child_member) +
                    (infant_amount * infant_member);
    const tax     = (adult_tax * adult_member) +
                    (child_tax * child_member) +
                    (infant_tax * infant_member);

    // 기준 날짜 선택
    let keyDate;
    if (GU1 === 'ISSUE')      keyDate = issue_date;
    else if (GU1 === 'ORDER') keyDate = order_date;
    else if (GU1 === 'DEP')   keyDate = in_date;
    else                      keyDate = issue_date;

    // DAY: 일 기준, 그 외: 월 기준
    if (GU5 === 'DAY') gubun = keyDate.slice(6, 8); // dd
    else               gubun = keyDate.slice(4, 6); // mm

    // 합이 더 크면 total_amount 보정
    const airPlusTax = air_amt + tax;
    if (total_amount < airPlusTax) total_amount = airPlusTax;
    // 버킷 초기화
    if (!aData.DAY[gubun]) {
        aData.DAY[gubun] = {
            TOTAL: 0,
            AIRAMT: 0,
            TAXAMT: 0,
            MEMBER: 0,
            ORDERS: 0,
            ORDER2: 0
        };
    }
    
    //console.log(gubun)
    // 일/월별 집계
    aData.DAY[gubun].TOTAL  += total_amount;
    aData.DAY[gubun].AIRAMT += air_amt;
    aData.DAY[gubun].TAXAMT += tax;
    aData.DAY[gubun].MEMBER += member;
    aData.DAY[gubun].ORDERS += 1;

    // 전체 합계
    aData.DAY.TOTAL  += total_amount;
    aData.DAY.AIRAMT += air_amt;
    aData.DAY.TAXAMT += tax;
    aData.DAY.MEMBER += member;
    aData.DAY.ORDERS += 1;
  }

  // ORDER2 집계 (PHP도 if 밖에서 ++ 했던 부분)
  // 상태가 안 맞아도 "실제 예약건" 카운트만 따로 올리는 느낌이면 그대로 유지
  if (!gubun) {
    // gubun이 안 나오는 케이스 방지용: 일단 '00' 같은 기본 키를 줄 수도 있음
    gubun = '00';
    if (!aData.DAY[gubun]) {
      aData.DAY[gubun] = {
        TOTAL: 0,
        AIRAMT: 0,
        TAXAMT: 0,
        MEMBER: 0,
        ORDERS: 0,
        ORDER2: 0
      };
    }
  }

  aData.DAY[gubun].ORDER2 += 1;
  aData.DAY.ORDER2 += 1;
}

function buildDayHTML(aData, opts = {}) {
    const {
      GU2 = new Date().getFullYear(),
      GU3 = new Date().getMonth() + 1,
      GU5 = 'DAY',
      bgcolor1 = '#ffffff'
    } = opts;
    //console.log(GU3);
    initDayStats(aData); // 안전하게 구조 보정
  
    const days = (GU5 === 'DAY') ? deps.getLastDays(GU2, GU3) : 12;
    let listHTML = '';
    for (let ix = 1; ix <= days; ix++) {
      const dateObj = GU2+String(GU3).padStart(2,'0')+String(ix).padStart(2,'0');
      const weekStr = (GU5 === 'DAY')
        ? `(${deps.getWeekday(dateObj)})`
        : '월';
        
      const key = String(ix).padStart(2,'0');
  
      const bucket = aData.DAY[key] || {
        TOTAL: 0,
        AIRAMT: 0,
        TAXAMT: 0,
        MEMBER: 0,
        ORDERS: 0,
        ORDER2: 0
      };
      listHTML += `
        <tr HEIGHT="20" class="cmn_trbgcolor_titlebg"
            onmouseover="this.style.backgroundColor='#FFF99C'"
            onmouseout="this.style.backgroundColor='${bgcolor1}'"
            style="background-color:${bgcolor1}">
          <td>${ix} ${weekStr}</td>
          <td>${deps.numberFormat(bucket.ORDERS)}
            <span class="cored" title="실제 예약건">(${deps.numberFormat(bucket.ORDER2)})</span>
          </td>
          <td>${deps.numberFormat(bucket.MEMBER)}</td>
          <td>${deps.numberFormat(bucket.TOTAL)}</td>
          <td>${deps.numberFormat(bucket.AIRAMT)}</td>
          <td>${deps.numberFormat(bucket.TAXAMT)}</td>
        </tr>
      `;
    }
  
    listHTML += `
      <tr style="background-color:#eee;">
        <th>합 계</th>
        <th>${deps.numberFormat(aData.DAY.ORDERS)}</th>
        <th>${deps.numberFormat(aData.DAY.MEMBER)}</th>
        <th>${deps.numberFormat(aData.DAY.TOTAL)}</th>
        <th>${deps.numberFormat(aData.DAY.AIRAMT)}</th>
        <th>${deps.numberFormat(aData.DAY.TAXAMT)}</th>
      </tr>
    `;
  
    return listHTML;
  }




module.exports = {
    accumulateDayRow , 
    initDayStats ,
    buildDayHTML
}