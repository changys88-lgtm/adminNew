const deps = require('../../src/common/dependencies');
const { multiCurl } = require('../../src/utils/multiNetwork');
const { interSearchLogSave } = require('../../src/utils/database');

module.exports = async (req, res) => {
    //console.log(req.body);
    const data = req.body;
    const AviaLoginId = req.cookies.AviaLoginId;
    data.AviaLoginId  = AviaLoginId;
    const bspSiteCode = 'OY00170';
    const ip =
        req.headers['x-forwarded-for']?.split(',')[0] || // 프록시 있을 경우
        req.socket?.remoteAddress ||                     // 일반적인 경우
        req.connection?.remoteAddress || 
        null;
    data.ip = ip;
    pool = await deps.getPool();
    let { ticket_type , depCode , dep_date , arrCode , arr_date , airType  } = data;
    let { grade , adtMem , chdMem , infMem } = data;
        
    data.departure      = depCode;
    data.arrive         = arrCode;
    data.departure_date = dep_date;
    data.dep_date2      = arr_date;
    data.ref            = 'DOM';
    const logUid = await interSearchLogSave (data,pool); // 검색 로그 저장

    const cityTable = [];
    cityTable[depCode+arrCode] = "Dep";
    cityTable[arrCode+depCode] = "Arr";

    const getData1 = `src=${depCode}&dest=${arrCode}&depDate=${dep_date}&air_code=&adt=${adtMem}&chd=${chdMem}&inf=${infMem}&grade=${grade}`;
    const getData2 = `dest=${depCode}&src=${arrCode}&depDate=${arr_date}&air_code=&adt=${adtMem}&chd=${chdMem}&inf=${infMem}&grade=${grade}`;

    let link1 = '';
    let link2 = '';
    let key   = '';
    let uid   = '';
    let sqlText   = '';
    let sqlResult = '';
    let html = '';
    const aData = [];
    link1 = `${deps.searchUrl}/gdsSearch/airlineSearchDcjeju?key=1&bspSiteCode=${bspSiteCode}&${getData1}`;
    if (ticket_type === "2") link2 = `${deps.searchUrl}/gdsSearch/airlineSearchDcjeju?key=2&bspSiteCode=${bspSiteCode}&${getData2}`;
    const stTime1 = process.hrtime();
    const aUid = [];

    await (async () => {
        const requests = [
            { url: link1 , method:'get' }          
        ];
        if (link2) requests.push({url: link2 , method: 'get'});

        const results = await multiCurl(requests);
        
        results.forEach((res, idx) => {
        if (res.success) {
            //console.log(`✅ ${idx + 1}번 요청 성공`, res.data);
            key = res.data.received?.KEY;
            uid = res.data.received?.UID;
            aUid.push(uid);
        } else {
            console.log(`❌ ${idx + 1}번 요청 실패`, res.error);
        }
        });
    })();
    //console.log(aUid)

    const aName = [];
    sqlText = `select code_2,name from OYE2021.DBO.airLine_code where code_2 in ('${airType.split("/").join("','")}') `;
    sqlResult = await pool.request().query(sqlText);
    for (const row of sqlResult.recordset) {
        const {code_2 , name} = row;
        aName[code_2.trim()] = name;
    }

    const addQry = `
        , MAX(CASE WHEN f.paxType = 'adult'  THEN f.total END) AS adtPrice
        , MAX(CASE WHEN f.paxType = 'child'  THEN f.total END) AS chdPrice
        , MAX(CASE WHEN f.paxType = 'infant' THEN f.total END) AS infPrice
        , MAX(CASE WHEN f.paxType = 'adult'  THEN f.tax END) AS adtTax
        , MAX(CASE WHEN f.paxType = 'child'  THEN f.tax END) AS chdTax
		, MAX(CASE WHEN f.paxType = 'adult'  THEN f.fuel END) AS adtFuel
        , MAX(CASE WHEN f.paxType = 'child'  THEN f.fuel END) AS chdFuel
    `;
    sqlText = ` select a.* ${addQry} from ${deps.hubDom}DomDcJejuSegment as a 
            LEFT JOIN ${deps.hubDom}DomDcJejuSegment_fare AS f  ON f.uid_minor = a.uid  AND f.airCnt    = a.airCnt  AND f.fCnt      = a.fCnt  
        where a.uid in ( ${aUid.join(',')} ) 
        GROUP BY 
            a.uid, a.airCnt, a.fCnt, a.remark, a.tasf, a.seatCount, a.isOpCar, a.opCarrierCd, a.opCarrierNm,
            a.isReturn, a.classType, a.classTypeNm, a.isAvailable, a.resrvToken,
            a.q, a.flight, a.flightNumber, a.fareType, a.bookingClass,
            a.depCity, a.arrCity, a.depCityNm, a.arrCityNm,
            a.depDate, a.arrDate, a.depUDate, a.arrUDate
        order by depDate  `;
    sqlResult = await pool.request().query(sqlText);
    let cnt = 0;
    const aCity = [];
    for (const row of sqlResult.recordset) {
        let {cardCode , opCarrierCd,  depDate, arrDate, flight , flightNumber , depCity , arrCity , classTypeNm , seatCount , grade , adtPrice , chdPrice , infPrice } = row;
        let {depCityNm , arrCityNm , cabinClass , airCnt , fCnt , bookingClass , adtTax , chdTax , adtFuel , chdFuel } = row;
        if (!cardCode) {
            const city      = depCity + arrCity;
            const keyName   = cityTable[city];
            let   cView = "Y";
            if (grade === "C" && classTypeNm !== "비즈니스석") cView = "N";
            aCity[keyName] = `${depCityNm}->${arrCityNm}`;
            const opCarrierCd_ = (opCarrierCd) ? `${opCarrierCd} 운항` : ''; 
            const flightTime = deps.timeTermCheck (deps.StrClear(arrDate), deps.StrClear(depDate));
            if ( cView === "Y") {
                html = `
                    <ul class='air-schedule-list ${keyName}Sort' id='${keyName}Area_${cnt}' data-time='${depDate.slice(11,16)}' data-time2='${arrDate.slice(11,16)}' data-price='${adtPrice}' 
                    onclick="return airSelect('${keyName}','${flight}','${flightNumber}','${aName[flight]}','${dep_date}','${arr_date}','${depCode}','${arrCode}','${depCityNm}','${arrCityNm}','${deps.StrClear(depDate)}'
                    ,'${deps.StrClear(arrDate)}','${flightTime}','${adtPrice}','${chdPrice}','${infPrice}','${cabinClass}','${uid}','${airCnt}','${fCnt}','${bookingClass}','${seatCount}','${cnt}','${opCarrierCd}'
                    ,'${adtTax}' , '${chdTax}' , '${adtFuel}' , '${chdFuel}'  )">
                        <li>
                            <img src='../images/airline/${flight}.png' class='list-air-icon'>
                            <span>${aName[flight]}</span>
                            <span class='air_num'>${flight}${flightNumber}</span>
                            <span class='cored font11'>${opCarrierCd_}</span>
                        </li>
                        <li>${depDate.slice(11,16)}</li>
                        <li>${arrDate.slice(11,16)}</li>
                        <li class='warm-color'>${classTypeNm}</li>
                        <li class='seatcount'>${seatCount}</li>
                        <li>${deps.numberFormat(adtPrice)}</li>
                    </ul>
                `;
                deps.arrPush(aData,keyName,html);
                cnt ++;
            }
        }
    }
    const stTime2 = process.hrtime(stTime1);
    const gap = stTime2[0] + stTime2[1] / 1e9;
    let   depData = Array.isArray(aData?.Dep) ? aData.Dep.join(' ') : '';
    let   arrData = Array.isArray(aData?.Arr) ? aData.Arr.join(' ') : '';
    //console.log(aUid)
    const searchTime = gap.toFixed(2);
    const logSql = `update interline_search_log set searchTime = @searchTime  where log_uid = @log_uid `;
            await pool.request()
            .input('log_uid',logUid )
            .input('searchTime',searchTime )
            .query(logSql);
    //console.log(aData)

    
    depCityName = aCity.Dep;
    arrCityName = aCity.Arr || '';
    depDateName = deps.cutDate(dep_date || '') + "("+deps.getWeek(deps.getWeekday(dep_date || ''))+")";
    arrDateName = deps.cutDate(arr_date || '') + "("+deps.getWeek(deps.getWeekday(arr_date || ''))+")";
    
    if (ticket_type === "1" || !arrData ) {
        let names = '';
        if (ticket_type === "1") names = "편도 조회 중";
	    else names = "운항 스케쥴 없음";
        arrData = `
            <div id='smallPopup_arti' style='width:180px; left:50%'>
                <img src='../images/shadowforloading.png' style='opacity:.8; width:55%; height:auto;  margin-top: 25%;  margin-left:8%; position:absolute; z-index:-1;'>	
                <img src='../images/airplaneforloading.png' style='width:85%; height:auto; margin-left:8%; transform:translate3d(0,0,0); rotate(-4deg)' > 
                <p style='text-align: center; margin-top: 15%; font-size:14px; color: #454444;'>${names}</p> 
            </div>
        `;
    }

    res.json ({success:'ok', dep : depData  , arr: arrData , depName : depCityName , arrName : arrCityName , depName2 : depDateName , arrName2 : arrDateName  });
}