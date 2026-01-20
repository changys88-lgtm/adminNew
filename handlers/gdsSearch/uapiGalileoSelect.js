const deps = require('../../src/common/dependencies');
const { createHeader , newTraceID , uapiGalSearch } = require('../../src/utils/functionGalileo');

module.exports = async (req, res) => {
    const data = req.query;
    const maxUid = data.maxUid;
    const adt    = data.adt;
    const chd    = data.chd;
    const inf    = data.inf;
    let adtType  = 'ADT';
    let chdType  = 'CNN';
    let kidType  = 'KID';
    let infType  = 'INF';

    const pool = await deps.getPool();

    const cacheSql = `
        SELECT * FROM ${deps.hubGds}HubGalileoCache
        WHERE uid = @uid
    `;

    const cacheResult = await pool.request()
        .input('uid',maxUid)
        .query(cacheSql);
    const TransactionId             = cacheResult.recordset[0].TransactionId || null;
    const TransactionId_abacus      = cacheResult.recordset[0].TransactionId_abacus || null;
    const TransactionId_bxx         = cacheResult.recordset[0].TransactionId_bxx || null;
    const TraceId_bxx               = cacheResult.recordset[0].TraceId_bxx || null;
    const orgSrc                    = cacheResult.recordset[0].orgSrc || null;
    const orgDest                   = cacheResult.recordset[0].orgDest || null;

    const segDetail = {};
    const aTotalSeg = {};
    const segData = {};
    const shareData = {};
    //const joinPrice = {};

    const searchSql = `
        SELECT 
        a.TransactionId , a.Price_Key , a.TotalPrice , b.BasePrice , b.ApproximateTotalPrice , b.ApproximateBasePrice , b.Taxes
        ,b.PriceInfo_Key , b.FareCalc , b.PassengerType , b.ChangePenalty , b.CancelPenalty
        ,c.minor_num , c.minor_num2 , c.minor_num3 , c.shareCnt , c.Detail_Key , c.TravelTime , c.BookingCode , c.BookingCount , c.CabinClass , c.FareInfoRef , c.SegmentRef , c.Connection , c.sharePrice
        , d.Carrier, d.FlightNumber, d.[Group], d.Distance, d.NumberOfStops
        FROM ${deps.hubGds}HubGalileoPrice (NOLOCK) AS a
        LEFT OUTER JOIN ${deps.hubGds}HubGalileoPriceInfo (NOLOCK) AS b
        ON a.Price_Key = b.Price_Key AND a.TransactionId = b.TransactionId
        LEFT OUTER JOIN ${deps.hubGds}HubGalileoPriceInfo_Option_detail (NOLOCK) AS c
        ON b.PriceInfo_Key = c.PriceInfo_Key AND a.TransactionId = c.TransactionId
        LEFT OUTER JOIN ${deps.hubGds}HubGalileoSegment (NOLOCK) AS d
        ON c.SegmentRef = d.Segment_key AND a.TransactionId = d.TransactionId
        WHERE a.TransactionId = @TransactionId
        ORDER BY c.minor_num, c.minor_num2, c.minor_num3
    `;
  //console.log(searchSql)
  //console.log(TransactionId)
    const result = await pool.request()
        .input('TransactionId', TransactionId)
        .query(searchSql);
    for (const row of result.recordset) {
        const SegmentRef     = (row.SegmentRef || '').trim();
        const PassengerType  = (row.PassengerType || '').trim();
        const PlatingCarrier = (row.PlatingCarrier || '').trim();
        const Carrier        = (row.Carrier || '').trim();
        const FlightNumber   = (row.FlightNumber || '').trim();
        const BookingCode    = (row.BookingCode || '').trim();
        const BookingCount   = (row.BookingCount || '').trim();
        const CabinClass     = (row.CabinClass || '').trim();
        const minor_num3     = parseInt(row.minor_num3 || '0');
        const Connection     = parseInt(row.Connection || '0');
        const Detail_Key     = String(row.Detail_Key || '').trim();
        const Price_Key      = String(row.Price_Key || '').trim();
        const Group          = (row.Group || '').trim();
        const sharePrice     = String(row.sharePrice || '').trim();
        const Distance       = (row.Distance || '').trim();
        const key            = Carrier + PassengerType + BookingCode;
        //console.log(key)
        if (PassengerType === adtType) {
            aTotalSeg[PassengerType] ??= {};
            aTotalSeg[PassengerType][Price_Key] ??= {};
            aTotalSeg[PassengerType][Price_Key][Group] ??= {};
            aTotalSeg[PassengerType][Price_Key][Group][Detail_Key] ??= [];
            aTotalSeg[PassengerType][Price_Key][Group][Detail_Key].push(row);
        } else {
            aTotalSeg[PassengerType] ??= {};
            aTotalSeg[PassengerType][Price_Key] ??= [];
            aTotalSeg[PassengerType][Price_Key].push(row);
        }
      
        segData[key] ??= {};
        segData[key][SegmentRef] = row;
      
        if (minor_num3 === 1) {
            segDetail[PassengerType] ??= {};
            segDetail[PassengerType][Carrier + SegmentRef + BookingCode] ??= [];
            if (!segDetail[PassengerType][Carrier + SegmentRef + BookingCode].includes(Detail_Key)) {
                segDetail[PassengerType][Carrier + SegmentRef + BookingCode].push(Detail_Key);
            }
        } else {
            shareData[PassengerType + Detail_Key] ??= {};
            shareData[PassengerType + Detail_Key][minor_num3] = row;
        }
      
        //joinPrice[Price_Key] ??= {};
        //joinPrice[Price_Key][Group] ??= {};
        //joinPrice[Price_Key][Group][Detail_Key] ??= '';
        //joinPrice[Price_Key][Group][Detail_Key] += Carrier + FlightNumber + BookingCode;
    }
    //console.log(aTotalSeg)
    const fareData = {};
    const fareSql = `
        SELECT * FROM ${deps.hubGds}HubGalileoFare WITH (NOLOCK)
        WHERE TransactionId = @TransactionId
    `;
    const fareResult = await pool.request()
        .input('TransactionId', TransactionId)
        .query(fareSql);
    
    fareResult.recordset.forEach(row => {
        const Fare_Key = String(row.Fare_Key || '').trim();
        // 모든 필드 trim 처리
        for (const key in row) {
            if (typeof row[key] === 'string') {
            row[key] = row[key].trim();
            }
        }
        fareData[Fare_Key] = row;
    });

    const arraySeg = {};
    const segSql = `
        SELECT * FROM ${deps.hubGds}HubGalileoSegment WITH (NOLOCK)
        WHERE TransactionId = @TransactionId
        ORDER BY DepartureTime
    `;
    const segResult = await pool.request()
        .input('TransactionId', TransactionId)
        .query(segSql);

    segResult.recordset.forEach(row => {
        const Segment_key = String(row.Segment_key || '').trim();
        arraySeg[Segment_key] = row;
    });

    const aFlight = {};
    //let keyQryList = [];
    
    const flightSql = `
        SELECT * FROM ${deps.hubGds}HubGalileoFlight WITH (NOLOCK)
        WHERE TransactionId = @TransactionId
    `;
    const flightResult = await pool.request()
        .input('TransactionId', TransactionId)
        .query(flightSql);
    
    flightResult.recordset.forEach(row => {
        // 각 필드를 문자열로 변환 + trim 처리
        for (const key in row) {
            if (typeof row[key] === 'string') {
            row[key] = row[key].trim();
            }
        }
        
        const flight_key = row.flight_key;
        const valStr = `${row.DestinationTerminal}//${row.OriginTerminal}//${row.Equipment}//${row.FlightTime}`;
        aFlight[flight_key] = valStr;
        
        //keyQryList.push(`'${flight_key}'`);
    });

    let airMasterCache = [];

    let aData = [];
    let aData2 = [];
    let aData3 = [];
    let aData4 = [];
    let aData5 = [];
    let aData6 = [];
    if (aTotalSeg && typeof aTotalSeg[adtType] === 'object') {
        for (const [Price_Key, aGroup] of Object.entries(aTotalSeg[adtType])) {
            for (const [Group, mainSegData] of Object.entries(aGroup)) {
                for (const [segKey, mainShareData] of Object.entries(mainSegData)) {
                    const mainPriceData = mainShareData[0];
                    const SegmentRef    = String(mainPriceData.SegmentRef || '').trim();
                    const segInfo       = arraySeg[SegmentRef];
                    
                    const seg_flight_key = segInfo.seg_flight_key;
                    const ArrivalTime    = segInfo.ArrivalTime;
                    const DepartureTime  = segInfo.DepartureTime;
                    const Distance       = segInfo.Distance;
                    const NumberOfStops  = segInfo.NumberOfStops;
                    const Origin         = segInfo.Origin;
                    const Destination    = segInfo.Destination;
                    const FlightNumber   = segInfo.FlightNumber.trim();
                    let   Carrier        = segInfo.Carrier;
                    let   airCode        = Carrier + FlightNumber;
                    const startDate      = deps.StrClear(DepartureTime).substring(0, 8);
                    const arriveDate     = deps.StrClear(ArrivalTime).substring(0, 8);
                    const startTime      = deps.StrClear(DepartureTime).substring(8, 12);
                    const arriveTime     = deps.StrClear(ArrivalTime).substring(8, 12);
                    const tFlight        = (aFlight[seg_flight_key] || '').split('//');
                    const stop           = segInfo.ChangeOfPlane === 'false' ? 'N' : 'Y';
                    //console.log(segInfo)
                    //console.log(aFlight[segInfo.seg_flight_key])
                    // 항공편 마스터 등록
                    airMasterCache.push(`${airCode}/${FlightNumber}/${startDate}/${startTime}/${arriveTime}/${Origin}/${Destination}/${arriveDate}`);

                    // 원래 편명 보존
                    const airOrg = airCode;

                    // 가격 및 세그먼트 관련 정보
                    const BookingCode   = String(mainPriceData.BookingCode || '').trim();
                    const BookingCount  = mainPriceData.BookingCount;
                    const CabinClass    = mainPriceData.CabinClass;
                    const Segment_key   = mainPriceData.SegmentRef;
                    //const Carrier       = mainPriceData.PlatingCarrier;

                    const sub = ` ||${BookingCode}/_/${BookingCount}/_/${CabinClass}`;
                    //console.log(sub)
                    // share count (경유 수)
                    const shareCnt = segData[Carrier + adtType + BookingCode]?.[Segment_key]?.shareCnt ?? 0;

                    // 운임 참조 키
                    const aFareInfoRef = mainPriceData.FareInfoRef;
                    const cFareInfoRef = aTotalSeg[chdType]?.[Price_Key]?.[Group]?.FareInfoRef;
                    //const kFareInfoRef = aTotalSeg[kidType]?.[Price_Key]?.[Group]?.FareInfoRef;
                    const iFareInfoRef = aTotalSeg[infType]?.[Price_Key]?.[Group]?.FareInfoRef;

                    // 운임 및 세금
                    let BasePrice  = mainPriceData.BasePrice;
                    const BasePrice2 = mainPriceData.ApproximateBasePrice;

                    // "KRW" 시작 아니면 대체
                    if (!String(BasePrice).startsWith('KRW')) BasePrice = BasePrice2;

                    // StrClear 함수는 숫자/소수점만 추출하는 Ted 정의 함수
                    const Tax1 = deps.StrClear(mainPriceData.Taxes);
                    const Tax2 = deps.StrClear(aTotalSeg[chdType]?.[Price_Key]?.[Group]?.Taxes);
                    const Tax4 = deps.StrClear(aTotalSeg[kidType]?.[Price_Key]?.[Group]?.Taxes);
                    const Tax3 = deps.StrClear(aTotalSeg[infType]?.[Price_Key]?.[Group]?.Taxes);

                    // 1. 수하물 및 운임 규정 정보
                    const fare = fareData[aFareInfoRef] || {};
                    const NumberOfPieces = fare.NumberOfPieces;
                    const MaxWeight      = fare.MaxWeight;
                    const AccountCode    = fare.AccountCode;
                    const FareRuleKey    = fare.FareRuleKey;

                    // 2. 운임 정리 (금액만 추출)
                    let Amount1  = deps.StrClear(BasePrice);
                    let Amount2  = deps.StrClear(aTotalSeg[chdType]?.[Price_Key]?.[Group]?.BasePrice);
                    let Amount2_ = deps.StrClear(aTotalSeg[chdType]?.[Price_Key]?.[Group]?.ApproximateBasePrice);
                    let Amount4  = deps.StrClear(aTotalSeg[kidType]?.[Price_Key]?.[Group]?.BasePrice);
                    let Amount4_ = deps.StrClear(aTotalSeg[kidType]?.[Price_Key]?.[Group]?.ApproximateBasePrice);
                    let Amount3  = deps.StrClear(aTotalSeg[infType]?.[Price_Key]?.[Group]?.BasePrice);
                    let Amount3_ = deps.StrClear(aTotalSeg[infType]?.[Price_Key]?.[Group]?.ApproximateBasePrice);

                    //console.log(Amount1 + ' ' + Amount2 + ' ' + Amount3 + ' ' +chdType)
                    //console.log(aTotalSeg['ADT']?.[Price_Key]?.[Group]);
                    //console.log(aTotalSeg['CNN']?.[Price_Key]?.[Group]);
                    // 3. 금액 보정 (더 큰 값 사용)
                    if (Amount2_ > Amount2) Amount2 = Amount2_;
                    if (Amount3_ > Amount3) Amount3 = Amount3_;

                    // 4. 세그먼트 카운트
                    const Detail_Key = mainPriceData.Detail_Key;
                    //const shareCnt2 = segDetail[adtType]?.[Carrier + Segment_key]?.length || 0;

                    // 5. 수수료 계산
                    //let feeString = BookingFee(airCode.substring(0, 2), startDate, cRow.src, cRow.dest, BookingCode, adt, chd, inf);

                    //if (b2b_site_code === 'FLYEASY') {
                        feeString = '10000/10000/0';
                    //}

                    const aFee = feeString.split('/').map(str => parseInt(str.trim(), 10) || 0);

                    // 퍼센트 방식과 정액 방식 구분
                    let fee1, fee2, fee3, totalFee;
                    //console.log(aFee)
                    if (aFee[0] !== 0 && String(aFee[0]).length < 4) {
                        fee1 = roundUp(Amount1 * aFee[0] / 100, 1) * adt;
                        fee2 = roundUp(Amount2 * aFee[1] / 100, 1) * chd;
                        fee3 = roundUp(Amount3 * aFee[2] / 100, 1) * inf;
                        totalFee = fee1 + fee2 + fee3;
                    } else {
                        fee1 = aFee[0] * adt;
                        fee2 = aFee[1] * chd;
                        fee3 = aFee[2] * inf;
                        totalFee = fee1 + fee2 + fee3;
                    }

                    // 개별 단가로 나누기
                    fee1 = aFee[0];
                    fee2 = aFee[1];
                    fee3 = aFee[2];
                    fee  = totalFee;

                    let sub3 = "";
                    let sub4 = "";
                    let BookingCode2 = "";
                    airCode = airOrg;

                    const sharePriceData = mainShareData[1];
                    let addBookCode = '';
                    let CodeshareInfo = '';
                    //console.log(mainShareData)
                    if (sharePriceData?.Price_Key) {
                        const Pax = adtType;  // "$adtType"
                        
                        // 1경유 세그먼트 정보
                        let SegmentRef = sharePriceData.SegmentRef;
                        const aFareInfoRef2 = sharePriceData.FareInfoRef;
                        BookingCode2 = String(sharePriceData.BookingCode || '').trim();
                        const BookingCount2 = sharePriceData.BookingCount;
                        const CabinClass2 = sharePriceData.CabinClass;
                    
                        let segInfo = arraySeg[SegmentRef] || {};
                        let src = segInfo.Origin;
                        let dest = segInfo.Destination;
                        let air = segInfo.Carrier;
                        let flight = segInfo.FlightNumber;
                        let time1 = segInfo.DepartureTime;
                        let time2 = segInfo.ArrivalTime;
                        let flightTime = segInfo.FlightTime;
                        let seg_flight_key2 = segInfo.seg_flight_key;
                        let Distance2 = segInfo.Distance;
                        let equip = String(segInfo.Equipment || '').trim();
                        
                        const fareInfo2 = fareData[aFareInfoRef2] || {};
                        const NumberOfPieces2 = fareInfo2.NumberOfPieces;
                        const MaxWeight2 = fareInfo2.MaxWeight;
                    
                        const sFlight = (aFlight[seg_flight_key2] || '').split('//');
                        sub3 = `||${SegmentRef}/_/${air}/_/${flight}/_/${src}/_/${dest}/_/${time1}/_/${time2}/_/${flightTime}/_/${sFlight[1]}/_/${sFlight[0]}/_/${BookingCode2}/_/${BookingCount2}/_/${CabinClass2}/_/${equip}/_/${NumberOfPieces2}|${MaxWeight2} |${Distance2}`;
                        airCode += `:${air}${flight}`;
                        addBookCode = BookingCode2;
                    }

                    airCode = airCode.trim();

                    let hiddenCity = '';
                    if (NumberOfStops === "1") {
                        // 숨은 경유지 SQL 조회 (await 필요)
                        const hiddenCitySql = `
                            SELECT Destination
                            FROM hubGalileo.dbo.HubGalileoFlight WITH (NOLOCK)
                            WHERE TransactionId = @TransactionId
                            AND flight_key = (
                                SELECT seg_flight_key
                                FROM hubGalileo.dbo.HubGalileoSegment WITH (NOLOCK)
                                WHERE TransactionId = @TransactionId
                                AND Segment_key = @Segment_key
                            )
                        `;
                        const result = await pool.request()
                            .input('TransactionId', TransactionId)
                            .input('Segment_key', Segment_key)
                            .query(hiddenCitySql);

                            hiddenCity = result.recordset[0]?.Destination || '';
                    }

                    // 운임 + 수수료 조합 문자열 (sub2)
                    const sub2 = ` ||${aFareInfoRef}/_/KRW/_/${Amount1}/_/${Amount2}/_/${Amount3}/_/${Tax1}/_/${Tax2}/_/${Tax3}/_/ /_/uAPI/_/${fee},${fee1},${fee2},${fee3}/_/|/_/${CabinClass}/_/${NumberOfPieces}|${MaxWeight} |${NumberOfStops}^${hiddenCity}^${AccountCode}/_/RT/_/0/_/${Price_Key}/_/${Distance}/_/${Amount4}/_/${Tax4}`;

                    // 조합 데이터 저장
                    const fullKey = airCode + BookingCode + addBookCode + Price_Key;
                    //console.log(Price_Key)
                    const commonString = `${airCode}/_/${startTime}/_/${arriveTime}/_/${tFlight[3]}/_/${ArrivalTime}/_/${stop}/_/${Origin}/_/${Destination}/_/${tFlight[2]}/_/${startDate}|${DepartureTime}|${ArrivalTime}/_/${FlightNumber}/_/${stop}/_/${tFlight[1]}/_/${tFlight[0]}/_/${CodeshareInfo}/_/${Segment_key}/_/${seg_flight_key}${sub}${sub2}${sub3}${sub4}`;

                    // 그룹별 분류
                    if (Group === '0')      aData[fullKey]  = commonString;
                    else if (Group === '1') aData2[fullKey] = commonString;
                    else if (Group === '2') aData3[fullKey] = commonString;
                    else if (Group === '3') aData4[fullKey] = commonString;
                    else if (Group === '4') aData5[fullKey] = commonString;
                    else if (Group === '5') aData6[fullKey] = commonString;
                }
            }
        }
    }
    //console.log(aData)
    let list = '';
    if (aData && Object.keys(aData).length > 0) {
        list = Object.entries(aData)
            .map(([key, val]) => `111${key}^:^${val}`)
            .join('^::^');
    }    
    // aData2
    if (aData2 && Object.keys(aData2).length > 0) {
        const list2 = Object.entries(aData2)
            .map(([key, val]) => `222${key}^:^${val}`)
            .join('^::^');
        list += list ? '^::^' + list2 : list2;
    }
    // aData3
    if (aData3 && Object.keys(aData3).length > 0) {
        const list3 = Object.entries(aData3)
            .map(([key, val]) => `222${key}^:^${val}`)
            .join('^::^');
        list += list ? '^::^' + list3 : list3;
    }
    // aData4
    if (aData4 && Object.keys(aData4).length > 0) {
        const list4 = Object.entries(aData4)
            .map(([key, val]) => `222${key}^:^${val}`)
            .join('^::^');
        list += list ? '^::^' + list4 : list4;
    }
    res.json({ result: 'ok',datas:list });
};