const deps = require('../../src/common/dependencies');
const { multiCurl } = require('../../src/utils/multiNetwork');
const { interSearchLogSave } = require('../../src/utils/database');
const { arrInterType, arrInterGubun, arrCabinType, arrGdsType , arrDsrType , arrCountryCode , arrGender, arrCardType ,arrPaxRelation } = require('../../src/utils/airConst');

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
    let { ticket_type , departure , departure2 , departure_date , arrive , arrive2 , arrive_date , dep_city2, arr_city2 , dep_city1 , arr_city1 } = data;
    let { grade , adt , chd , inf , stopover = ''} = data;
    departure_date = deps.StrClear(departure_date);
    let addQry = '';
    if (ticket_type === "2" && arrive_date !== "") {
        seg2 = `
          <air:SearchAirLeg>
            <air:SearchOrigin>
              <com:CityOrAirport Code='${arrive}' PreferCity='true' />
            </air:SearchOrigin>
            <air:SearchDestination>
              <com:CityOrAirport Code='${departure}' PreferCity='true' />
            </air:SearchDestination>
            <air:SearchDepTime PreferredTime='${deps.cutDate(arrive_date)}' />
          </air:SearchAirLeg>
        `;
        addQry = ` AND src2 = '${arrive}' AND dest2 = '${departure}' AND arr_date = '${deps.StrClear(arrive_date)}' `;
        ticket_type = 2;
        departure2 = data.dep_city2 = arrive;
        arrive2 = data.arr_city2 = departure;
      
        res.cookie("AviaSearchDate2", arrive_date, { maxAge: 86400 * 1000 * 30 });
    } else if (ticket_type === "3") {
        addQry = '';
        for (let ix = 2; ix <= RouteCount; ix++) {
          addQry += ` AND src${ix} = '${data[`dep_city${ix}`]}' AND dest${ix} = '${data[`arr_city${ix}`]}' AND dep_date${ix} = '${deps.StrClear(data[`dep_date${ix}`])}' `;
          res.cookie(`AviaSearchDate${ix}`, data[`dep_date${ix}`], { maxAge: 86400 * 1000 * 30 });
        }
    } else {
        ticket_type = 1;
    }

    res.cookie("AviaSearchDate1", departure_date     , { maxAge: 86400 * 1000 * 30 });
    res.cookie("AviaSearchStop" , stopover           , { maxAge: 86400 * 1000 * 30 });

    if ((grade || '').length === 1) {
        if (ticket_type === "1") {
            grade = data.airCabin1 || '';
        } else if (ticket_type === "2") {
            grade = (data.airCabin1 || '') + (data.airCabin2 || '');
        } else {
            grade = (data.airCabin1 || '') + (data.airCabin2 || '') + (data.airCabin3 || '');
        }
    }

    const logUid = await interSearchLogSave (data,pool); // 검색 로그 저장

	let cacheQuery = `select cache_time,force_clear,groupName,countryName from airPort_code where portCode = '${arrive}' `;
    let cacheResult = await pool.request().query(cacheQuery);
    let groupName   = cacheResult.recordset[0].groupName   || '';
    if (groupName === "국내") {
		cacheQuery = `select cache_time,force_clear,groupName,countryName from airPort_code where portCode = '${departure}' `;
		cacheResult = await pool.request().query(cacheQuery);
	}
    let cache_time  = cacheResult.recordset[0].cache_time  || 60;
	let force_clear = cacheResult.recordset[0].force_clear.trim() || '';
    let countryName = cacheResult.recordset[0].countryName || '';

    if (force_clear == "Y" || data.CacheIgnore == "Y") cache_time = 0; // 강제 캐쉬 시간 종료
	else if (data.JoinServer == "Local") cache_time = 600;

    if (data.CacheIgnore !== "Y") cache_time = 600;// 1 Hour Cache
    const now = new Date();
    let limit = new Date(now.getTime() - cache_time * 60 * 1000);
    limit = deps.getDateTimeNumber(limit);
	let addQry2 = ` and up_date > '${limit}' `;
	let addQry3 = ` and up_date < '${limit}' `;

    let sub4    = '';
    let addQry4 = ` and AirLikeData = '' `;
    if (data.SearchAirLikeData) {
        sub4    = (data.SearchAirLikeData || []).join('/');
        addQry4 = ` and AirLikeData = '${sub4}' `;
    }
    let sub7    = '';
    let addQry7 = ` and CityLikeData = '' `;
    if (data.SearchCityLikeData) {
        sub7     = (data.SearchCityLikeData || []).join('/');
        addQry7  = ` and CityLikeData = '${sub7}' `; 
    }

    let orgSrc  = departure;
	let orgDest = arrive;

	let addQry5 = ` and bspSiteCode    = '${bspSiteCode}' `;
	let addQry6 = ` and MaxJourneyTime = '${data.SearchMaxJourneyTimeData}' `;
	let addQry8 = ` and MaxShareTime   = '${data.SearchMaxShareTimeData}' `;
	let addQry9 = ` and SearchPortData = '${data.SearchPortData}' `;

    if (grade === "LBR") sub4 = "CZ";
    
	// const tempQuery = ` 
    //     select TransactionId,TraceId,TransactionId_abacus, TransactionId_bxx , TraceId_bxx , ndcTrNumber from ${deps.hubGds}HubGalileoCache 
    //     where 
    //         stopover = '${stopover}' and grade = '${grade}' and src = '${departure}' and dest = '${arrive}' 
    //         and dep_date = '${deps.StrClear(departure_date)}' and ticket_type = '${ticket_type}' 
    //         and adt = '${adt}' and chd = '${chd}' and inf = '${inf}' 
    //         ${addQry} ${addQry3} ${addQry4} ${addQry5} ${addQry6} ${addQry7} ${addQry8} ${addQry9}
    //         `;
	// const tempResult            = await pool.request().query(tempQuery);
    // let   TransactionId         = tempResult.recordset[0]?.TransactionId || '';
    // let   TraceId               = tempResult.recordset[0]?.TraceId || '';
    // let   TransactionId_abacus  = tempResult.recordset[0]?.TransactionId_abacus || '';
    // let   TransactionId_bxx     = tempResult.recordset[0]?.TransactionId_bxx || '';
    // let   TraceId_bxx           = tempResult.recordset[0]?.TraceId_bxx || '';
    // let   ndcTrNumber           = tempResult.recordset[0]?.ndcTrNumber || '';

	if (force_clear == "Y") {
		let sql = ` update airPort_code set force_clear = '' where portCode = '${arrive}' `;
		pool.request().query(sql);
	}

    let maxUid = '';
    let TransactionId_abacus = '';

    const maxSql = `
    SELECT MAX(uid) AS maxUid
    FROM ${deps.hubGds}HubGalileoCache
        WHERE stopover = '${stopover ?? ''}'
            AND grade = '${grade}'
            AND src = '${departure}'
            AND dest = '${arrive}'
            AND dep_date = '${departure_date}'
            AND ticket_type = '${ticket_type}'
            AND adt = '${adt}'
            AND chd = '${chd}'
            AND inf = '${inf}'
            ${addQry} ${addQry2} ${addQry4} ${addQry5} ${addQry6} ${addQry7} ${addQry8} ${addQry9}
    `;
    //console.log(maxSql)
    if (!force_clear) {
        const maxResult = await pool.request().query(maxSql);
        maxUid = maxResult.recordset[0].maxUid || '';
    }
    console.log('old: '+maxUid)
    const pData = {
        departure_date: departure_date,
        arrive_date: data.arrive_date,
        departure: data.departure,
        arrive: data.arrive,
      
        RouteCount: data.RouteCount,
      
        dep_city2: data.dep_city2,
        arr_city2: data.arr_city2,
        dep_city3: data.dep_city3,
        arr_city3: data.arr_city3,
        dep_city4: data.dep_city4,
        arr_city4: data.arr_city4,
        dep_city5: data.dep_city5,
        arr_city5: data.arr_city5,
        dep_city6: data.dep_city6,
        arr_city6: data.arr_city6,
      
        dep_date1: data.dep_date1,
        dep_date2: data.dep_date2,
        dep_date3: data.dep_date3,
        dep_date4: data.dep_date4,
        dep_date5: data.dep_date5,
        dep_date6: data.dep_date6,
      
        airCabin1: data.airCabin1,
        airCabin2: data.airCabin2,
        airCabin3: data.airCabin3,
        airCabin4: data.airCabin4,
        airCabin5: data.airCabin5,
        airCabin6: data.airCabin6,
      
        departure2: departure2,
        arrive2: arrive2,
        adt: adt,
        chd: chd,
        inf: inf,
        grade: grade,
        stopover: stopover,
        ticket_type: ticket_type,
      
        airLike: sub4,
        cityLike: sub7,
      
        MaxJourneyTime: data.SearchMaxJourneyTimeData,
        MaxShareTime: data.SearchMaxShareTimeData,
        SearchPortData: data.SearchPortData
    };
    
    const getData = new URLSearchParams(pData).toString();

    let TraceId       = '';
    let TransactionId = '';
    let TransactionId_bxx = '';
    let TraceId_bxx   = '';
    let ndcTrNumber   = '';
    let SQSEARCHON    = "N";
    let link1 = '';
    let link2 = '';
    let link3 = '';
    let link4 = '';
    let searchType = '';
    const checkAirports = /SIN|DPS|MLE|HKG|MAA/i;
    if ((checkAirports.test(arrive) || checkAirports.test(departure)) && stopover === "Y") SQSEARCHON = "Y";

    link1 = `${deps.searchUrl}/gdsSearch/uapiGalileo?SQSEARCHON=${SQSEARCHON}&bspSiteCode=${bspSiteCode}&${getData}`;
    link2 = `${deps.searchUrl}/gdsSearch/uapiSabre?SQSEARCHON=${SQSEARCHON}&bspSiteCode=${bspSiteCode}&${getData}`;
    const stTime1 = process.hrtime();
    //console.log(link1)
    if (!maxUid) {
        await (async () => {
            const requests = [
                { url: link1 , method:'get' }          
            ];
            if (link2) requests.push({url: link2 , method: 'get'});
            if (link3) requests.push({url: link3 , method: 'get'});
            if (link4) requests.push({url: link4 , method: 'get'});

            const results = await multiCurl(requests);
            results.forEach((res, idx) => {
            if (res.success) {
                //console.log(`✅ ${idx + 1}번 요청 성공`, res.data.received.GDS);
                if (res.data.received.GDS == "G") {
                    TransactionId = res.data.received.TID;
                    TraceId       = res.data.received.TRID;
                } else if (res.data.received.GDS == "A") {
                    TransactionId_abacus = res.data.received.TID;
                }
            } else {
                console.log(`❌ ${idx + 1}번 요청 실패`, res.error);
            }
            });
        })();
    }
    const stTime2 = process.hrtime(stTime1);
    const gap = stTime2[0] + stTime2[1] / 1e9;

    if ( !maxUid &&  (TransactionId !== '' || TransactionId_abacus !== '')) {
        const insertSql = `
          INSERT INTO ${deps.hubGds}HubGalileoCache (
            grade, src, dest, src2, dest2, src3, dest3, src4, dest4, src5, dest5, src6, dest6,
            dep_date, arr_date, dep_date2, dep_date3, dep_date4, dep_date5, dep_date6,
            ticket_type, up_date, TransactionId, TraceId, adt, chd, inf, stopover,
            AirLikeData, CityLikeData, bspSiteCode, MaxJourneyTime, MaxShareTime,
            TransactionId_abacus, TransactionId_bxx, TraceId_bxx, ndcTrNumber, SearchPortData
          )
          OUTPUT inserted.uid
          VALUES (
            @grade, @src, @dest, @src2, @dest2, @src3, @dest3, @src4, @dest4, @src5, @dest5, @src6, @dest6,
            @dep_date, @arr_date, @dep_date2, @dep_date3, @dep_date4, @dep_date5, @dep_date6,
            @ticket_type, @up_date, @TransactionId, @TraceId, @adt, @chd, @inf, @stopover,
            @AirLikeData, @CityLikeData, @bspSiteCode, @MaxJourneyTime, @MaxShareTime,
            @TransactionId_abacus, @TransactionId_bxx, @TraceId_bxx, @ndcTrNumber, @SearchPortData
          )
        `;

        try {
            const result = await pool.request()
            .input('grade', pData.grade)
            .input('src', pData.departure)
            .input('dest', pData.arrive)
            .input('src2', pData.dep_city2)
            .input('dest2', pData.arr_city2)
            .input('src3', pData.dep_city3)
            .input('dest3', pData.arr_city3)
            .input('src4', pData.dep_city4)
            .input('dest4', pData.arr_city4)
            .input('src5', pData.dep_city5)
            .input('dest5', pData.arr_city5)
            .input('src6', pData.dep_city6)
            .input('dest6', pData.arr_city6)
            .input('dep_date', deps.StrClear(pData.departure_date))
            .input('arr_date', deps.StrClear(pData.arrive_date))
            .input('dep_date2', deps.StrClear(pData.dep_date2))
            .input('dep_date3', deps.StrClear(pData.dep_date3))
            .input('dep_date4', deps.StrClear(pData.dep_date4))
            .input('dep_date5', deps.StrClear(pData.dep_date5 || ''))
            .input('dep_date6', deps.StrClear(pData.dep_date6 || ''))
            .input('ticket_type', ticket_type)
            .input('up_date', deps.getNow().NOWSTIME)
            .input('TransactionId', TransactionId)
            .input('TraceId', TraceId)
            .input('adt', adt)
            .input('chd', chd)
            .input('inf', inf)
            .input('stopover', stopover || '')
            .input('AirLikeData', sub4)
            .input('CityLikeData', sub7)
            .input('bspSiteCode', bspSiteCode)
            .input('MaxJourneyTime', data.SearchMaxJourneyTimeData)
            .input('MaxShareTime', data.SearchMaxShareTimeData)
            .input('TransactionId_abacus', TransactionId_abacus)
            .input('TransactionId_bxx', TransactionId_bxx || '')
            .input('TraceId_bxx', TraceId_bxx || '')
            .input('ndcTrNumber', ndcTrNumber)
            .input('SearchPortData', data.SearchPortData)
            .query(insertSql);
            maxUid = result.recordset[0]?.uid || '';
            console.log('new: '+maxUid)
        } catch (err) {
            console.log(pData)
            console.log(err.stack , err.number , err.lineNumber , err.procName);
        }
      
        /*
        const selectSql = `
          SELECT MAX(uid) AS maxUid
          FROM ${deps.hubGds}HubGalileoCache
          WHERE stopover = @stopover AND grade = @grade
            AND src = @src AND dest = @dest AND dep_date = @dep_date
            AND ticket_type = @ticket_type AND adt = @adt AND chd = @chd
            AND inf = @inf AND TransactionId = @TransactionId
            AND TraceId = @TraceId AND AirLikeData = @AirLikeData
            AND CityLikeData = @CityLikeData AND bspSiteCode = @bspSiteCode
            ${addQry5} ${addQry6} ${addQry7} ${addQry8} ${addQry9}
        `;
      
        const result = await pool.request()
          .input('stopover', stopover ?? '')
          .input('grade', pData.grade)
          .input('src', pData.departure)
          .input('dest', pData.arrive)
          .input('dep_date', deps.StrClear(departure_date))
          .input('ticket_type', ticket_type)
          .input('adt', adt)
          .input('chd', chd)
          .input('inf', inf)
          .input('TransactionId', TransactionId)
          .input('TraceId', TraceId)
          .input('AirLikeData', sub4)
          .input('CityLikeData', sub7)
          .input('bspSiteCode', bspSiteCode)
          .query(selectSql);
        */
        
        searchType = 'R';
    } else {
        searchType = 'C';
    }
    const searchTime = gap.toFixed(2);
    try {
        const logSql = `update interline_search_log set searchType = @searchType , searchTime = @searchTime  where log_uid = @log_uid `;
                await pool.request()
                .input('searchType',searchType )
                .input('log_uid',logUid )
                .input('searchTime',searchTime )
                .query(logSql);
    } catch (err) {
        console.log(err.stack);
    }
    res.json ({success:'ok',id:maxUid});


}