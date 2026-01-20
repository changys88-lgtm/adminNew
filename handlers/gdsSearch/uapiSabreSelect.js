const deps = require('../../src/common/dependencies');
const { createHeader , newTraceID , uapiGalSearch } = require('../../src/utils/functionSabre');

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
//console.log(cacheSql + maxUid);
    const cacheResult = await pool.request()
        .input('uid',maxUid ?? '')
        .query(cacheSql);
    const TransactionId             = cacheResult.recordset[0].TransactionId || null;
    const TransactionId_abacus      = cacheResult.recordset[0].TransactionId_abacus || null;
    const TransactionId_bxx         = cacheResult.recordset[0].TransactionId_bxx || null;
    const TraceId_bxx               = cacheResult.recordset[0].TraceId_bxx || null;
    const orgSrc                    = cacheResult.recordset[0].orgSrc || null;
    const orgDest                   = cacheResult.recordset[0].orgDest || null;

    const segData = {};
    const fareData = {};
    const fareBasisCodeData = {};
    const passengerFareData = {};
    const segQuery = `
        SELECT 
            a.*, 
            c.FareReference, 
            c.SeatsRemainingNumber, 
            c.SeatsRemainingBelowMin, 
            c.Cabin, 
            c.Meal,
            (
                SELECT COUNT(*) 
                FROM ${deps.hubSabre}HubFlightSegment 
                WHERE TransactionId = a.TransactionId 
                AND SequenceNumber = a.SequenceNumber 
                AND minor_num = a.minor_num
            ) AS segCount
            FROM ${deps.hubSabre}HubFlightSegment a WITH (NOLOCK) 
            LEFT OUTER JOIN ${deps.hubSabre}HubSeats c WITH (NOLOCK) ON a.TransactionId = c.TransactionId AND a.SequenceNumber = c.SequenceNumber AND a.minor_num1 = c.minor_num
        WHERE a.TransactionId = @TransactionId
    `;
    //console.log(segQuery)
    const segResult = await pool.request()
        .input('TransactionId', TransactionId_abacus)
        .query(segQuery);

    for (const row of segResult.recordset) {
        for (const key in row) {
            if (row[key] !== null && typeof row[key] === 'string') {
                row[key] = row[key].trim();
            }
        }
    
        const seq = row.SequenceNumber;
        const minor = row.minor_num1;
    
        if (!segData[seq]) segData[seq] = {};
        segData[seq][minor] = row;
    }
    /* 
    const fareQuery = `
        SELECT *
        FROM hubSabre.dbo.HubItinTotalFare a WITH (NOLOCK)
        WHERE a.TransactionId = @TransactionId
    `;
    //console.log(fareQuery)
    const fareResult = await pool.request()
        .input('TransactionId',TransactionId_abacus)
        .query(fareQuery);
    for (const row of fareResult.recordset) {
        for (const key in row) {
            if (row[key] !== null && typeof row[key] === 'string') {
                row[key] = row[key].trim();
            }
        }
        const seq = row.SequenceNumber;
        fareData[seq] = row;
    }
    */
    
    const fbQuery = `
        SELECT a.*, b.BaggageInformationProvisionType	, b.BaggageInformationAirlineCode , b.AllowanceWeight , b.AllowanceUnit , b.AllowancePieces
        FROM ${deps.hubSabre}HubFareBasisCode a WITH (NOLOCK)
        LEFT OUTER JOIN ${deps.hubSabre}HubBaggageInformation b WITH (NOLOCK)
        ON a.TransactionId = b.TransactionId
        AND a.SequenceNumber = b.SequenceNumber
        AND a.minor_num = b.minor_num
        AND a.PassengerTypeQuantityCode = b.PassengerTypeQuantityCode
        WHERE a.TransactionId = @TransactionId
    `;
    //console.log(fbQuery)
    //console.log(TransactionId_abacus)
    const fbResult = await pool.request()
        .input('TransactionId',  TransactionId_abacus)
        .query(fbQuery);

    for (const row of fbResult.recordset) {
        for (const key in row) {
            if (row[key] !== null && typeof row[key] === 'string') {
                row[key] = row[key].trim();
            }
        }

        // 조건에 따라 저장
        if (row.PassengerTypeQuantityCode === 'ADT') {
            const seq = row.SequenceNumber;
            const minor = row.minor_num;

            if (!fareBasisCodeData[seq]) fareBasisCodeData[seq] = {};
            fareBasisCodeData[seq][minor] = row;
        }
    }

    const paxQuery = `
        SELECT *
        FROM ${deps.hubSabre}HubPassengerFare a WITH (NOLOCK)
        WHERE a.TransactionId = @TransactionId
    `;
    //console.log(paxQuery)
    const paxResult = await pool.request()
        .input('TransactionId', TransactionId_abacus)
        .query(paxQuery);
    for (const row of paxResult.recordset) {
        for (const key in row) {
            if (row[key] !== null && typeof row[key] === 'string') {
                row[key] = row[key].trim();
            }
        }
        const seq = row.SequenceNumber;
        const paxType = row.PassengerTypeQuantityCode;

        if (!passengerFareData[seq]) passengerFareData[seq] = {};
        passengerFareData[seq][paxType] = row;

    }
    
    let aData  = [];
    let aData2 = [];
    let aData3 = [];
    let aData4 = [];
    let addBookCode = '';

    for (const [SequenceNumber, value] of Object.entries(segData)) {
        
        let sub3 = '', sub4 = '', airCode = '';
        for (const [minor_num1, segDatas] of Object.entries(value)) {
            const { TransactionId,minor_num,minor_num1,minor_num2,ElapsedTime,DepartureCountry,ArrivalCountry,DepartureDateTime,ArrivalDateTime,StopQuantity
                ,FlightNumber,ResBookDesigCode,FlightSegmentElapsedTime,DepartureAirportLocationCode,DepartureAirportTerminalID,ArrivalAirportLocationCode,ArrivalAirportTerminalID
                ,OperatingAirlineCode,OperatingAirlineFlightNumber,MarketingAirlineCode,DepartureTimeZoneGMTOffset,ArrivalTimeZoneGMTOffset,eTicketInd,MileageAmount,AirEquipType
                ,NumberOfStops,StopAirportLocationCode,FareReference,SeatsRemainingNumber,SeatsRemainingBelowMin,Cabin,Meal,segCount
            } = segDatas;
            const {PassengerTypeQuantityCode,PassengerTypeQuantityQuantity,FareBasisCode,AvailabilityBreak,DepartureAirportCode,ArrivalAirportCode,FareComponentBeginAirport
                ,FareComponentEndAirport,FareComponentDirectionality,FareComponentVendorCode,FareComponentFareTypeBitmap,FareComponentFareType,FareComponentFareTariff,FareComponentFareRule
                ,FareComponentCabinCode,GovCarrier,BaggageInformationProvisionType,BaggageInformationAirlineCode,AllowanceWeight,AllowanceUnit,AllowancePieces
            } = fareBasisCodeData[SequenceNumber][minor_num];


            const Segment_key    = `${TransactionId}_${SequenceNumber}_${minor_num}`;
            const seg_flight_key = `${TransactionId}_${SequenceNumber}`;

            //const FareBasisCode  = fareBasisCodeData?.[SequenceNumber]?.[minor_num]?.FareBasisCode || '';
            const aFareInfoRef   = FareBasisCode;

            // 첫 세그먼트 출발 항공사 저장
            if (minor_num1 === 1) {
                orgAirCode = OperatingAirlineCode;
            }

            //const sabreAir = arraySabreAir.join('|');
            if (minor_num2 === 1) {
                airCode         = (MarketingAirlineCode + FlightNumber).toLowerCase();
                CodeshareInfo   = OperatingAirlineCode !== MarketingAirlineCode ? OperatingAirlineCode : '';

                depTimeStr      = deps.StrClear(DepartureDateTime);
                startDate       = depTimeStr.substring(0, 8);
                startTime       = depTimeStr.substring(8, 12);

                arrTimeStr      = deps.StrClear(ArrivalDateTime);
                arriveDate      = arrTimeStr.substring(0, 8);
                arriveTime      = arrTimeStr.substring(8, 12);

                BookingCode     = (ResBookDesigCode || '').trim();
                BookingCount    = SeatsRemainingNumber;
                CabinClass      = Cabin;
                Carrier         = OperatingAirlineCode;

                Price_Key       = `${TransactionId}_${SequenceNumber}`;

                const tFlight = [
                    DepartureAirportTerminalID,
                    ArrivalAirportTerminalID,
                    AirEquipType,
                    FlightSegmentElapsedTime
                ];

                cal = '';
                if (DepartureTimeZoneGMTOffset > 0) cal = '+';
                DepartureTime = `${DepartureDateTime}.000${cal}${DepartureTimeZoneGMTOffset}`;

                cal = '';
                if (ArrivalTimeZoneGMTOffset > 0) cal = '+';
                ArrivalTime = `${ArrivalDateTime}.000${cal}${ArrivalTimeZoneGMTOffset}`;

                Origin = DepartureAirportLocationCode;
                Destination = ArrivalAirportLocationCode;

                stop = StopQuantity === 0 ? 'N' : 'Y';

                sub = ` ||${BookingCode}/_/${BookingCount}/_/${CabinClass}`;

                NumberOfPieces				= AllowancePieces;
                MaxWeight				    = AllowanceWeight;

                const paxFare   = passengerFareData?.[SequenceNumber] || {};
                const Amount1   = paxFare['ADT']?.EquivFareAmount || '';
                const Amount2   = paxFare['CNN']?.EquivFareAmount || '';
                const Amount3   = paxFare['INF']?.EquivFareAmount || '';
                const Amount4   = paxFare['KID']?.EquivFareAmount || '';
                const Tax1      = paxFare['ADT']?.PassengerTotalTaxAmount || '';
                const Tax2      = paxFare['CNN']?.PassengerTotalTaxAmount || '';
                const Tax3      = paxFare['INF']?.PassengerTotalTaxAmount || '';
                const Tax4      = paxFare['KID']?.PassengerTotalTaxAmount || '';

                feeString = '10000/10000/0';
                //}

                const aFee = feeString.split('/').map(str => parseInt(str.trim(), 10) || 0);

                // 퍼센트 방식과 정액 방식 구분
                let fee1, fee2, fee3, totalFee;

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

                if (segCount === 1) {
                    const sub2         = ` ||${aFareInfoRef}/_/KRW/_/${Amount1}/_/${Amount2}/_/${Amount3}/_/${Tax1}/_/${Tax2}/_/${Tax3}/_/ /_/A/_/${fee},${fee1},${fee2},${fee3}/_/|/_/${CabinClass}/_/${NumberOfPieces}|${MaxWeight} |${NumberOfStops}^${StopAirportLocationCode}/_/RT/_/0/_/${Price_Key}/_/${MileageAmount}/_/${Amount4}/_/${Tax4}`;

                    const fullKey      = `${airCode}${BookingCode}${addBookCode}${Price_Key}`;
                    const commonString = `${airCode}/_/${startTime}/_/${arriveTime}/_/${tFlight[3]}/_/${ArrivalTime}/_/${stop}/_/${Origin}/_/${Destination}/_/${tFlight[2]}/_/${startDate}|${DepartureTime}|${ArrivalTime}/_/${FlightNumber}/_/${stop}/_/${tFlight[0]}/_/${tFlight[1]}/_/${CodeshareInfo}/_/${Segment_key}/_/${seg_flight_key}${sub}${sub2}${sub3}${sub4}`;

                    if (minor_num === 1) aData[fullKey]  = commonString;
                    if (minor_num === 2) aData2[fullKey] = commonString;
                    if (minor_num === 3) aData3[fullKey] = commonString;
                    if (minor_num === 4) aData4[fullKey] = commonString;

                } else {
                    if (minor_num2 > 1) {
                        airCode += `:${MarketingAirlineCode}${FlightNumber}`;
                        const CodeshareInfo_    = (OperatingAirlineCode !== MarketingAirlineCode) ? OperatingAirlineCode : '';

                        const SegmentRef        = `${TransactionId}_${SequenceNumber}_${minor_num1}`;
                        const flight            = FlightNumber;
                        const air               = MarketingAirlineCode;
                        const src               = DepartureAirportLocationCode;
                        const dest              = ArrivalAirportLocationCode;
                        const NumberOfPieces    = AllowancePieces;
                        const MaxWeight         = AllowanceWeight;

                        cal = '';
                        if (DepartureTimeZoneGMTOffset > 0) cal = '+';
                        const time1 = `${DepartureDateTime}.000${cal}${DepartureTimeZoneGMTOffset}`;

                        cal = '';
                        if (ArrivalTimeZoneGMTOffset > 0) cal = '+';
                        const time2 = `${ArrivalDateTime}.000${cal}${ArrivalTimeZoneGMTOffset}`;

                        const flightTime        = FlightSegmentElapsedTime;
                        const CabinClass        = Cabin;
                        const BookingCode       = (ResBookDesigCode || '').trim();
                        const equip             = AirEquipType;

                        const subNum            = minor_num2 + 1;
                        const subStr            = `||${SegmentRef}/_/${air}/_/${flight}/_/${src}/_/${dest}/_/${time1}/_/${time2}/_/${flightTime}/_/${sFlight[1]}/_/${sFlight[0]}/_/${BookingCode}/_/${BookingCount}/_/${CabinClass}/_/${equip}/_/${NumberOfPieces}|${MaxWeight} |${MileageAmount} | ${CodeshareInfo_}`;

                        eval(`sub${subNum} = \`${subStr}\`;`); // 또는 객체 형태로 저장하는 게 안전해

                        if (segCount === minor_num2) {
                            const sub2          = ` ||${aFareInfoRef}/_/KRW/_/${Amount1}/_/${Amount2}/_/${Amount3}/_/${Tax1}/_/${Tax2}/_/${Tax3}/_/${Q}/_/A/_/${fee},${fee1},${fee2},${fee3}/_/|/_/${CabinClass}/_/${NumberOfPieces}|${MaxWeight} |${NumberOfStops}^${StopAirportLocationCode}/_/RT/_/0/_/${Price_Key}/_/${Mileage}`;
                            const commonString  = `${airCode}/_/${startTime}/_/${arriveTime}/_/${tFlight[3]}/_/${ArrivalTime}/_/${stop}/_/${Origin}/_/${Destination}/_/${tFlight[2]}/_/${startDate}|${DepartureTime}|${ArrivalTime}/_/${FlightNumber}/_/${stop}/_/${tFlight[0]}/_/${tFlight[1]}/_/${CodeshareInfo}/_/${Segment_key}/_/${seg_flight_key}${sub}${sub2}${sub3}${sub4}`;
                            const fullKey       = `${airCode}${BookingCode}${addBookCode}${Price_Key}`;
                            if (minor_num === 1) aData[fullKey]  = commonString;
                            if (minor_num === 2) aData2[fullKey] = commonString;
                            if (minor_num === 3) aData3[fullKey] = commonString;
                            if (minor_num === 4) aData4[fullKey] = commonString;
                          }
                    }                      
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
    res.json({ result: 'ok',datas:list  });
};