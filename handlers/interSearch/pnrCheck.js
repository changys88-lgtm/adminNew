const deps = require('../../src/common/dependencies');
const { uapiGalPnrRetrieve , uapiGalClearXML } = require('../../src/utils/functionGalileo');
const {} = require('../../src/utils/functionSabre');
const { roundUp } = require('../../src/utils/numberSum');
const { calculateAge , convertDays } = require('../../src/utils/ages');
const { dataPick, mainInterQuery , interlineLogSave , interlineDatLog } = require('../../src/utils/database');
const xml2js = require('xml2js');
const { privateEncrypt } = require('crypto');
const { NVarChar } = require('mssql');
const { INSPECT_MAX_BYTES } = require('buffer');

async function itiCheckSimple(city, arr1 = {}, arr2 = {}) {
    const aOrder = arr1?.[city] ?? {};  // 기존 DB 값
    const aPnr   = arr2?.[city] ?? {};  // 새로 파싱한 값
  
    const getDate = (s) => String(s ?? '').slice(0, 8);   // YYYYMMDD
    const getTime = (s) => String(s ?? '').slice(8, 12);  // HHmm
  
    const depDate = getDate(aPnr.DEPTIME);
    const arrDate = getDate(aPnr.ARRTIME);
    const depTime = getTime(aPnr.DEPTIME);
    const arrTime = getTime(aPnr.ARRTIME);
  
    let msg = '';
    const updates = [];
  
    if (String(aOrder.in_date ?? '') !== depDate) {
      msg += `${city} 출발일: ${aOrder.in_date ?? ''} -> ${depDate} 변경<br>`;
      updates.push(` in_date = '${depDate}'`);
    }
    if (String(aOrder.out_date ?? '') !== arrDate) {
      msg += `${city} 도착일: ${aOrder.out_date ?? ''} -> ${arrDate} 변경<br>`;
      updates.push(` out_date = '${arrDate}'`);
    }
    if (String(aOrder.start_time1 ?? '') !== depTime) {
      msg += `${city} 출발시간: ${aOrder.start_time1 ?? ''} -> ${depTime} 변경<br>`;
      updates.push(` start_time1 = '${depTime}'`);
    }
    if (String(aOrder.start_time2 ?? '') !== arrTime) {
      msg += `${city} 도착시간: ${aOrder.start_time2 ?? ''} -> ${arrTime} 변경<br>`;
      updates.push(` start_time2 = '${arrTime}'`);
    }
  
    return [msg, updates];
}
  
function tlParsing(data) {
    const src0 = String(data ?? '');
    const trigger = /(ISSUE AND ADV E-TKT IN PNR BY|ISSUE TICKETS FOR|ADV TKT NBR|PLS ADV TKT BY|ADTK|AUTO XX|WL BE XXLD|WILL CXL|OR CXL|AUTOCANCEL|CANCELS| CXL |AUTO TICKET|PLS ISSUE TKT|TKT IS ISSUED|WILL BE XLD|AUTO CNL|SEG WILL BE CANX|ENTER VALID TICKET NBR|WL BE CXLD|ADV OTO TKT|LT OR ELSE WILL XXL|TW SUBJ CXL|KOREAN STANDARD TIME|PLS TICKET OR CANCEL BY)/i;
  
    if (!trigger.test(src0)) return [];
  
    let s = src0;
    let dateStr = '';
  
    // 1) DDMMMYY/HHMMZ  (예: 31JUL25/0426Z) → date=31JUL25, "GMT0" 추가
    const m1 = s.match(/\b\d{2}[A-Z]{3}\d{2}\/\d{4}Z\b/i);
    if (m1) {
      dateStr = m1[0].slice(0, 7); // DDMMMYY
      s += 'GMT0';
    } else {
      // 2) DDMMM HHMMZ  (예: 31JUL 0426Z) → HHMMZ → HHMMGMT0 치환, date=DDMMM
      const m2 = s.match(/\b\d{2}[A-Z]{3}\s\d{4}Z\b/i);
      if (m2) {
        const [d, t] = m2[0].split(/\s+/);
        dateStr = d;
        s = s.replace(t, t.replace(/Z$/i, 'GMT0'));
      } else {
        // 3) DDMMMYYYY / DDMMMYY / DDMMM
        const m3 =
          s.match(/[0-9]{1,2}(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[0-9]{4}/i) ||
          s.match(/[0-9]{1,2}(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[0-9]{2}/i) ||
          s.match(/[0-9]{1,2}(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)/i);
        dateStr = m3 ? m3[0] : '';
      }
    }
  
    // 시간 추출: 공백/슬래시 뒤의 4자리
    let timeMatch = s.match(/(?:\s|\/)(\d{4})/i);
    let timeVal = deps.StrClear(timeMatch?.[1] ?? '');
  
    // GMT0/ZZZ 있으면 +900 (원본 PHP 로직 그대로, overflow 보정 없음)
    if (/GMT0|ZZZ/i.test(s) && timeVal) {
      timeVal = String(Number(timeVal) + 900);
    }
  
    // 날짜가 4글자면 앞에 '0' 붙임 (예: 7JAN → 07JAN)
    if (dateStr.length === 4) dateStr = '0' + dateStr;
  
    return [dateStr, deps.StrClear(timeVal)];
  }

module.exports = async (req, res) => {
    const data         = req.body;
    const AviaLoginId  = req.cookies?.AviaLoginId || '';
    const b2bMASTER    = req.cookies?.b2bMASTER || '';
    const b2bSiteCode  = req.cookies?.b2bSiteCode || '';
    let   errorMsgs    = '';
    let   sqlText      = '';
    let   result       = '';
    let   rs           = '';
    let   resData      = '';
    let   response     = '';
    let   Obj          = '';
    let   reval_req    = '';
    const uid          = data.uid;
    const mode         = data.mode || '';
    const aviaSecurityKey = deps.getNow().aviaSecurityKey;

    pool = await deps.getPool();
    let mainRow   =  await mainInterQuery (uid);
    const {atr_yes} = mainRow;
    const cmpFltData = {};
    const aRemark    = [];
    let TrueLastDateToTicket = '';
    let AirV ;
    const sql = deps.sql;
    
    sqlText = `select * from interline_routing where uid_minor = @uid order by minor_num `;
    result = await pool.request().input('uid' , sql.Int , uid).query(sqlText);
    for (const row of result.recordset) {
        const { minor_num, air_code, citycode, in_date, start_time1, forced_tl, GoodCode } = row;
        cmpFltData[citycode] = row;
    }


    const aSegKey = {};
    const aData   = {};
    if (atr_yes.trim() === "G") {
        mainRow.Branch = 'P7144368';
        let galXml        = await uapiGalPnrRetrieve (mainRow);
       
        //galXml = uapiGalClearXML(galXml);

        const parser      = new xml2js.Parser({ explicitArray: false, trim: true , tagNameProcessors: [xml2js.processors.stripPrefix] });
        response          = await parser.parseStringPromise(galXml.trim());
        const faultstring = response?.Envelope?.Body?.Fault?.faultstring ?? "";
        errorMsgs         = faultstring.trim();
        if (errorMsgs) {
            rs = 'no';
            resData[0] = errorMsgs;
        } else {
            rs = 'ok';
            Obj = response?.Envelope?.Body?.UniversalRecordRetrieveRsp ?? "";
            const UniversalLocatorCode   = Obj.UniversalRecord?.$?.LocatorCode || '';
            const UniversalVersion       = Obj.UniversalRecord?.$?.Version || '';
            const ProviderLocatorCode    = Obj.UniversalRecord?.ProviderReservationInfo?.$?.LocatorCode || '';
            const ReservationLocatorCode = Obj.UniversalRecord?.AirReservation?.$?.LocatorCode || '';
            const SupplierLocatorCode    = Obj.UniversalRecord?.AirReservation?.SupplierLocator?.$?.SupplierLocatorCode || '';
            const airPnr                 = SupplierLocatorCode;

            sqlText = `update interline_minor set 
                    UniversalVersion        = @UniversalVersion      ,
                    UniversalLocatorCode    = @UniversalLocatorCode  , 
                    ProviderLocatorCode     = @ProviderLocatorCode   , 
                    ReservationLocatorCode  = @ReservationLocatorCode, 
                    SupplierLocatorCode     = @SupplierLocatorCode   , 
                    forced_tl               = @forced_tl 
                    where uid_minor = @uid 
                `;
            result = await pool.request()
                        .input('UniversalVersion'       , sql.NVarChar ,UniversalVersion  )
                        .input('UniversalLocatorCode'   , sql.NVarChar ,UniversalLocatorCode  )
                        .input('ProviderLocatorCode'    , sql.NVarChar ,ProviderLocatorCode  )
                        .input('ReservationLocatorCode' , sql.NVarChar ,ReservationLocatorCode  )
                        .input('SupplierLocatorCode'    , sql.NVarChar ,SupplierLocatorCode  )
                        .input('forced_tl'              , sql.NVarChar ,''  )
                        .input('uid'                    , sql.Int      ,uid  )
                        .query(sqlText)
            Obj = response?.Envelope?.Body?.UniversalRecordRetrieveRsp?.UniversalRecord;
            const airRes  = Array.isArray(Obj?.AirReservation) ? Obj.AirReservation[0] : Obj?.AirReservation;
            const segList = Array.isArray(airRes?.AirSegment) ? airRes?.AirSegment : [airRes?.AirSegment];
            
            // 여정 체크
            for (let ix = 0; ix < segList.length; ix++) {
                const seg = segList[ix];
                AirV           = deps.getAttr(seg, 'Carrier');
                const FltNum         = deps.getAttr(seg, 'FlightNumber');
                let   Status         = deps.getAttr(seg, 'Status');
                const SegNum         = deps.getAttr(seg, 'Group');
                const StartAirp      = deps.getAttr(seg, 'Origin');
                const EndAirp        = deps.getAttr(seg, 'Destination');
                const CabinClass     = deps.getAttr(seg, 'CabinClass');
                const DepartureTime  = deps.StrClear(deps.getAttr(seg, 'DepartureTime'));
                const ArrivalTime    = deps.StrClear(deps.getAttr(seg, 'ArrivalTime'));
                const BIC            = deps.getAttr(seg, 'ClassOfService');
                const Equipment      = deps.getAttr(seg, 'Equipment');
                const segKey         = deps.getAttr(seg, 'Key');

                const VndLocInd      = seg?.VndLocInd ?? '';
                const SegmentRemark  = seg?.SegmentRemark ?? '';
                const OperatingCarrier = deps.getAttr(seg?.CodeshareInfo, 'OperatingCarrier');

                // FlightDetails (단일/복수 모두 처리)
                const fdList       = Array.isArray(seg?.FlightDetails) ? seg?.FlightDetails : [seg?.FlightDetails];
                const fd0          = fdList[0] || {};
                const Terminal1    = deps.getAttr(fd0, 'OriginTerminal');
                const Terminal2    = deps.getAttr(fd0, 'DestinationTerminal');

                aSegKey[segKey]    = StartAirp + EndAirp;

                // 2025-08-25: aData 구성
                const city = StartAirp + EndAirp;
                aData[city] = {
                    ...(aData[city] || {}),
                    DEPTIME:   DepartureTime,
                    ARRTIME:   ArrivalTime,
                    ACTION:    Status,
                    CLS:       BIC,
                    SRC:       StartAirp,
                    DEST:      EndAirp,
                    EQUIP:     Equipment,
                    AIRCODE:   (AirV + FltNum).trim(),
                    //CODESHARE: CODESHARE,
                };
                const rsMsg = await itiCheckSimple(city, cmpFltData, aData);
                if (rsMsg?.[0]) {
                    await interlineDatLog(pool, {db_name:'interline', uid, content: rsMsg[0], username: AviaLoginId }); // 메모 추가
                    sqlText = `UPDATE interline_routing SET ${rsMsg[1].join(', ')} WHERE uid_minor='${uid}' AND citycode='${city}'`;
                    await pool.request().query(sqlText);
                    sqlText = `UPDATE interline_minor SET tkConfirm='${deps.getNow().NOWSTIME}' WHERE uid_minor='${uid}'`;
                    await pool.request().query(sqlText);
                }
                const Destination   = deps.getAttr(seg, 'Destination');
                const HiddenStop    = deps.getAttr(fd0, 'Destination'); // 첫 구간의 숨은 목적지
                let hiddenQry = '';
                if (Destination !== HiddenStop && HiddenStop !== '') {
                    hiddenQry = `, HiddenStop='${HiddenStop}'`;
                    for (let iix = 0; iix < 2; iix++) {
                      const fdi = fdList[iix];
                      if (!fdi) break;
              
                      const Destination_   = deps.getAttr(fdi, 'Destination');
                      const Origin_        = deps.getAttr(fdi, 'Origin');
                      const DepartureTime_ = deps.getAttr(fdi, 'DepartureTime');
                      const ArrivalTime_   = deps.getAttr(fdi, 'ArrivalTime');
                      const TravelTime_    = deps.getAttr(fdi, 'TravelTime');
                      const FlightTime_    = deps.getAttr(fdi, 'FlightTime');
                      const Equipment_     = deps.getAttr(fdi, 'Equipment');
                      const GroundTime_    = deps.getAttr(fdi, 'GroundTime');
              
                      const ix2  = ix + 1;
                      const iix2 = iix + 1;
              
                      sqlText    = `SELECT COUNT(*) AS cnt FROM interline_routing_hidden WHERE uid_minor='${uid}' AND minor_num='${ix2}' AND idx='${iix2}'`;
                      result = await pool.request().query(sqlText);
                      rCnt   = Number(result.recordset[0]?.cnt || 0);
                      if (Number(rCnt) === 0) {
                        sqlText = `INSERT INTO interline_routing_hidden (uid_minor, minor_num, idx) VALUES ('${uid}','${ix2}','${iix2}')`;
                        await pool.request().query(sqlText);
                      }
              
                      sqlText = `
                        UPDATE interline_routing_hidden SET
                          DepartureTime='${DepartureTime_}',
                          ArrivalTime='${ArrivalTime_}',
                          Origin='${Origin_}',
                          Destination='${Destination_}',
                          FlightTime='${FlightTime_}',
                          TravelTime='${TravelTime_}',
                          Equipment='${Equipment_}',
                          GroundTime='${GroundTime_}'
                        WHERE uid_minor='${uid}' AND minor_num='${ix2}' AND idx='${iix2}'
                      `;
                      await pool.request().query(sqlText);
                    }
                }
                const terminal = `${Terminal1}/${Terminal2}`.trim();
                const air_code = (AirV + FltNum).trim();

                let qry = `seat_status='${Status}', in_date='${DepartureTime?.slice(0,8)}', start_time1='${DepartureTime?.slice(8,12)}', start_time2='${ArrivalTime?.slice(8,12)}', `;
                qry += `air_class='${BIC}', air_code='${air_code}', out_date='${ArrivalTime?.slice(0,8)}', terminal='${terminal}', citycode='${city}'`;
                if (OperatingCarrier) qry += `, OperatingAirline='${OperatingCarrier}'`;
                if (CabinClass)       qry += `, cabinClass='${CabinClass}'`;
                if (SegmentRemark)    qry += `, AirlineData='${SegmentRemark}'`;
                if (SegmentRemark && !OperatingCarrier) qry += `, OperatingAirline='YY'`;

                sqlText = `UPDATE interline_routing SET ${qry} ${hiddenQry} WHERE uid_minor = @uid AND citycode=@city`;

                if (reval_req !== 'R') {
                    await pool.request()
                        .input('uid', sql.Int , uid)
                        .input('city', sql.NVarChar , city)
                        .query(sqlText);
                }
            }

            const remark = Obj.GeneralRemark || [];
            for (let ix = 0; ix < (Array.isArray(remark) ? remark.length : 1); ix++) {
                const data = remark[ix]?.RemarkData || '';
                if (data) aRemark.push(data);
            }
            // 승객 체크
            TrueLastDateToTicket = Obj.AirReservation?.AirPricingInfo?.$?.TrueLastDateToTicket || '';
            if (TrueLastDateToTicket) TrueLastDateToTicket = deps.StrClear(TrueLastDateToTicket).slice(0,12);
            let PlatingCarrier = Obj.AirReservation?.AirPricingInfo?.$?.PlatingCarrier;
            if (PlatingCarrier) {
                sqlText = `update interline_minor set main_air = @main_air where uid_minor = @uid `;
                await pool.request().input('main_air', sql.NVarChar ,PlatingCarrier ) .input('uid' , sql.Int , uid).query(sqlText);
            }
            const paxRes  = Array.isArray(Obj?.BookingTraveler) ? Obj.BookingTraveler : [Obj?.BookingTraveler];
            let mileQry = '';
            let aLocn   = [];
            for (let ix = 0  ; ix < paxRes.length ; ix ++) {
                const SupplierCodes = paxRes[ix].LoyaltyCard?.$?.SupplierCode || '';
                let   Status        = paxRes[ix].LoyaltyCard?.ProviderReservationSpecificInfo?.$?.ProviderReservationLevel;
                if (SupplierCodes) {
                    if (Status === "true") Status = "HK";
				    else Status = "NO";
				    mileQry = `, mileageStatus = "${Status}" `; //  2025-07-02 추가
                }
                const Key           = paxRes[ix].$?.Key;
                const TravelerType  = paxRes[ix].$?.TravelerType;
                const Gender        = paxRes[ix].$?.Gender;
                const Last          = paxRes[ix].BookingTravelerName.$?.Last;
                let   First         = paxRes[ix].BookingTravelerName.$?.First;
                First = deps.removeNameSuffix (First);

                sqlText = `update interline_pax set BookingTravelerRef = @Key ${mileQry} where uid_minor = @uid and eng_name1 = @Last and eng_name2 = @First `;
                await pool.request()
                    .input('Key'   , sql.NVarChar , Key)
                    .input('uid'   , sql.Int , uid)
                    .input('Last'  , sql.NVarChar , Last)
                    .input('First' , sql.NVarChar , First)
                    .query(sqlText);
                const locnRes = Array.isArray(paxRes[ix]?.AirSeatAssignment) ? paxRes[ix]?.AirSeatAssignment : [paxRes[ix]?.AirSeatAssignment] ;
                for (let ii = 0 ; ii < locnRes.length ; ii ++ ) {
                    const SegmentRef = locnRes[ii]?.$?.SegmentRef || '';
                    const Status     = locnRes[ii]?.$?.Status || '';
                    const Seat       = (locnRes[ii]?.$?.Seat || '').slice(-3);
                    if (Seat) {
                        if (!aLocn[ii]) {
                            aLocn[ii] = [];
                        }
                        deps.arrPush(aLocn[ii],"SEAT"   ,Seat);
                        deps.arrPush(aLocn[ii],"STATUS" ,Status);
                        deps.arrPush(aLocn[ii],"SEG"    ,SegmentRef);
                    }
                }
            }
            if (aLocn.length > 0) {
                for (let key of aLocn) {
                    sqlText = `UPDATE interline_routing SET 
                        Locn = @Locn, Locn_status = @Locn_status' WHERE uid_minor = @uid AND citycode = @citycode'
                    `;
                    await pool.request()
                            .input('Locn', sql.NVarChar , aLocn[key]["SEAT"].join("/"))
                            .input('Locn_status', sql.NVarChar , aLocn[key]["STATUS"].join("/"))
                            .input('uid',sql.Int , uid)
                            .input('citycode', sql.NVarChar , aSegKey[aLocn[key]["SEG"][0]])
                            .query(sqlText);
                }
            }
            const accountCode = (Obj.AirReservation?.AirPricingInfo?.[0]?.FareInfo?.[0]?.AccountCode?.$?.Code || '').trim();
            if (accountCode) {
                sqlText = `UPDATE interline_minor SET AccountCode = '${accountCode}' WHERE uid_minor = @uid `;
                await pool.request().input('uid',sql.Int, uid ).query(sqlText);                
            }
            let aBag = [];
		    const priceRes = Array.isArray(Obj.AirReservation?.AirPricingInfo) ? Obj.AirReservation?.AirPricingInfo : ( Obj.AirReservation?.AirPricingInfo ? [Obj.AirReservation?.AirPricingInfo] : '') ;
            let minor  = 0;
            let contentChange = '';
            const aQry = [];
            let Total = 0;
            let adtCard = 0;
            let adtCash = 0;
            let chdCard = 0;
            let chdCash = 0;
            let infCard = 0;
            let infCash = 0;
            for (let priceCnt = 0 ; priceCnt < priceRes.length ; priceCnt ++) {
                await interlineLogSave(pool, {uid,query: `요금추출 = ${priceCnt} `,id:AviaLoginId});
                const ApproximateBasePrice  = Number(deps.StrClear(priceRes[priceCnt]?.$?.ApproximateBasePrice || 0));
                const ApproximateTotalPrice = Number(deps.StrClear(priceRes[priceCnt]?.$?.ApproximateTotalPrice || 0));
                const Taxes                 = Number(deps.StrClear(priceRes[priceCnt]?.$?.Taxes || 0));
                const PricingInfo           = priceRes[priceCnt]?.$?.Key || '';
                const fareRes = Array.isArray(priceRes[priceCnt]?.FareInfo) ? priceRes[priceCnt]?.FareInfo : (priceRes[priceCnt]?.FareInfo ? [priceRes[priceCnt]?.FareInfo] : '' );
                minor = priceCnt + 1;
                let fare    = "";
                let baggage = "";
                let NVB     = "";
                let NVA     = "";
                let PaxType = '';
                for (let ix = 0 ; ix < fareRes.length ; ix ++) {
                    let   BaggageAllowance  = fareRes[ix]?.BaggageAllowance?.NumberOfPieces || '';
                    const BaggageValue      = fareRes[ix]?.BaggageAllowance?.MaxWeight?.$?.Value || '';
                    const BaggageUnit       = fareRes[ix]?.BaggageAllowance?.MaxWeight?.$?.Unit || '';
                    const FareBasis         = fareRes[ix]?.$.FareBasis;
                    const NotValidAfter     = fareRes[ix]?.$.NotValidAfter;
                    const NotValidBefore    = fareRes[ix]?.$.NotValidBefore;
                    const PassengerTypeCode = fareRes[ix]?.$.PassengerTypeCode;
                    const Origin            = fareRes[ix]?.$.Origin;
                    const Destination       = fareRes[ix]?.$.Destination;
                    if (!BaggageAllowance) BaggageAllowance = BaggageValue + BaggageUnit.slice(0,1);
                    else BaggageAllowance += 'PC';
                    fare    += FareBasis+";";
                    baggage += BaggageAllowance + ";";
                    NVB     += deps.StrClear(NotValidBefore) + ";";
                    NVA     += deps.StrClear(NotValidAfter)  + ";";
                    PaxType  = PassengerTypeCode;
                    aBag[ix] ||= BaggageAllowance;
                }
                const taxRes = Array.isArray(priceRes[priceCnt]?.TaxInfo) ? priceRes[priceCnt]?.TaxInfo : (priceRes[priceCnt]?.TaxInfo ? [priceRes[priceCnt].TaxInfo] : '');
                let taxQry = [];
                for (let ix = 0 ; ix < taxRes.length ; ix ++) {
                    const Amount    = deps.StrClear(taxRes[ix].$.Amount);
                    const Category  = taxRes[ix].$.Category;
                    taxQry.push(` tax_code${ix+1} = '${Category}' , tax_amount${ix+1} = '${Amount}'  `);
                }
                const FareCalc = priceRes[priceCnt]?.FareCalc || '';
                sqlText = `IF NOT EXISTS 
                    ( select 1 from interline_quote WITH (UPDLOCK , HOLDLOCK) where uid_minor = @uid and minor_num = @minor )
                    BEGIN
                        INSERT INTO interline_quote (uid_minor,minor_num) values (@uid , @minor)
                    END
                `;
                await pool.request()
                    .input('uid' , sql.Int , uid)
                    .input('minor' , sql.Int , minor)
                    .query(sqlText);
                const req = pool.request()
                    .input('uid',            sql.Int, uid)
                    .input('minor',          sql.Int, minor)
                    .input('shown_amount',   sql.Float, deps.StrClear(ApproximateBasePrice) ?? '')
                    .input('fare_basis',     sql.NVarChar, fare ?? '')
                    .input('bagage',         sql.NVarChar, baggage ?? '')           // 주의: 컬럼명 'bagage'
                    .input('min_stay',       sql.NVarChar, NVB ?? '')
                    .input('max_stay',       sql.NVarChar, NVA ?? '')
                    .input('fare_cont',      sql.NVarChar, FareCalc ?? '')
                    .input('PaxType',        sql.NVarChar, PaxType ?? '')
                    .input('PricingInfo',    sql.NVarChar, PricingInfo ?? '');
                const sets = [
                    'shown_amount = @shown_amount',
                    'fare_basis   = @fare_basis',
                    'bagage       = @bagage',
                    'min_stay     = @min_stay',
                    'max_stay     = @max_stay',
                    'fare_cont    = @fare_cont',
                    'PaxType      = @PaxType',
                    'PricingInfo  = @PricingInfo',
                ];
                sqlText = `
                    UPDATE interline_quote
                    SET ${sets.join(', ')} , ${taxQry.join(', ')}
                    WHERE uid_minor = @uid AND minor_num = @minor
                `;
                await req.query(sqlText);

                if (mode === "reCheck") { // PNR 재생성에서 넘어 올때
                    if (/(ADT|VFR|LBR)/i.test(PaxType) || PaxType.startsWith("A") ) {
                        adtCard = ApproximateBasePrice + Taxes;
                        adtCash = adtCard + mainRow.issueComm;
                        contentChange += `성인 요금 : ${mainRow.air_amount} -> ${ApproximateBasePrice} <br> `;
                        contentChange += `성인 택스 : ${mainRow.adult_tax} -> ${Taxes} <br>`;
                        aQry.push(` air_amount = '${ApproximateBasePrice}' , adult_tax = '${Taxes}'  `);
                        Total += ApproximateTotalPrice * Number(mainRow.adult_member || 0);                      
                    } else if (/(VNN|V10)/i.test(PaxType) || PaxType.startsWith("C") ) {
                        chdCard = ApproximateBasePrice + Taxes;
                        chdCash = chdCard + mainRow.issueComm;
                        contentChange += `소아 요금 : ${mainRow.child_amount} -> ${ApproximateBasePrice} <br> `;
                        contentChange += `소아 택스 : ${mainRow.child_tax} -> ${Taxes} <br> `;
                        aQry.push(` child_amount = '${ApproximateBasePrice}' , child_tax = '${Taxes}'  `);
                        Total += ApproximateTotalPrice * Number(mainRow.child_member || 0);
                    } else {
                        infCard = ApproximateBasePrice + Taxes;
                        infCash = infCard;
                        contentChange += `유아 요금 : ${mainRow.infant_amount} -> ${ApproximateBasePrice} <br> `;
                        contentChange += `유아 택스 : ${mainRow.infant_tax} -> ${Taxes} <br> `;
                        aQry.push(` infant_amount = '${ApproximateBasePrice}' , infant_tax = '${Taxes}'  `);
                        Total += ApproximateTotalPrice * Number(mainRow.infant_member || 0);
                    }
                }
            }
            
            if (mode === "reCheck") { // PNR 재생성에서 넘어 올때
                sqlText = `update interline_pax set card_price = @adtCard where uid_minor = @uid and sex in ('M','F') and card_price > 0`;
                await pool.request().input('adtCard',sql.Int , adtCard ).input('uid',sql.Int , uid).query(sqlText);
                sqlText = `update interline_pax set cash_price = @adtCash where uid_minor = @uid and sex in ('M','F') and cash_price > 0`;
                await pool.request().input('adtCash',sql.Int , adtCash ).input('uid',sql.Int , uid).query(sqlText);
                sqlText = `update interline_pax set card_price = @chdCard where uid_minor = @uid and sex in ('MC','FC') and card_price > 0`;
                await pool.request().input('chdCard',sql.Int , chdCard ).input('uid',sql.Int , uid).query(sqlText);
                sqlText = `update interline_pax set cash_price = @chdCash where uid_minor = @uid and sex in ('MC','FC') and cash_price > 0`;
                await pool.request().input('chdCash',sql.Int , chdCash ).input('uid',sql.Int , uid).query(sqlText);
                sqlText = `update interline_pax set card_price = @infCard where uid_minor = @uid and sex in ('MI','FI') and card_price > 0`;
                await pool.request().input('infCard',sql.Int , infCard ).input('uid',sql.Int , uid).query(sqlText);
                sqlText = `update interline_pax set cash_price = @infCash where uid_minor = @uid and sex in ('MI','FI') and cash_price > 0`;
                await pool.request().input('infCash',sql.Int , infCash ).input('uid',sql.Int , uid).query(sqlText);
                if (!contentChange) {
                    contentChange = '요금 변동 없음';
                }
                await interlineDatLog(pool, {db_name:'interline', uid, content: contentChange , username: AviaLoginId }); // 메모 추가
                if (aQry.length > 0) {
                    sqlText = `update interline set ${aQry.join (",")} , total_amount = @Total , input_amount = @Total where uid = @uid `;
                    await pool.request().input('Total',sql.Int , Total ).input('uid',sql.Int , uid).query(sqlText);
                }
                sqlText = `update interline_minor set QuoteDate = @NOWS  where uid_minor = @uid`;
                await pool.request().input('NOWS',sql.NVarChar , deps.getNow().NOWS ).input('uid',sql.Int , uid).query(sqlText);
            }
            // TL
            let tlArray = [];
            let dateArray = [];
            if (TrueLastDateToTicket) dateArray.push(TrueLastDateToTicket);
            let cmpDate = mainRow.issue_date.slice(0,12);
            let tmp1 = '';
            let tmp2 = '';
            let TL   = '';
            let DtStamp = '';
            let VenderRemark = '';
            for (let Rmk of aRemark) {
                if (AirV === "ZE" || AirV === "YP") Rmk = Rmk.replace(/^[\s\S]*?SUBJ CXL\s*/i, 'SUBJ CXL ');
                const tlData = tlParsing (Rmk);
                if (tlData[0]) {
                    tmp1 = convertDays(tlData[0],'C',cmpDate);
                    tmp2 = tlData[1];
                }
                DtStamp = tmp1 + tmp2;
                if (DtStamp > cmpDate) {
                    dateArray.push(DtStamp);
                    VenderRemark = 'Y';
                }
            }
            if (VenderRemark ) {
                sqlText = `update interline_minor set VenderRemark = @VenderRemark where uid_minor = @uid`;
                await pool.request()
                        .input ('VenderRemark' , sql.NVarChar , VenderRemark)
                        .input ('uid'          , sql.Int      , uid)
                        .query(sqlText);
            }
            const arr = Array.isArray(dateArray) ? dateArray : [];
            dateArray.sort((a,b) => a.localeCompare(b));
            TL = dateArray[0];
            if (TL) {
                sqlText = `update interline set TL = @TL where uid = @uid`;
                await pool.request()
                        .input('TL', sql.NVarChar , TL)
                        .input('uid', sql.Int , uid)
                        .query(sqlText);
            }
        }
    }
    //console.log(TrueLastDateToTicket)
    res.json ({success: 'ok', pnr:resData[0] , errorMsg: resData[1] });
}
