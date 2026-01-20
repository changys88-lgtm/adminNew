const fs     = require('fs');
const path   = require('path');
const axios  = require('axios');
const crypto = require('crypto')
const zlib   = require('zlib');
const xml2js = require('xml2js');
const deps   = require('../../src/common/dependencies');
const https  = require('https');
const agent  = new https.Agent({ rejectUnauthorized: false }); // SSL 인증서 검증 안 함
const {  
    galArrFlight, galArrSegment, galArrFare, galArrPrice, galArrPriceInfo, galArrTax, galArrPriceOption, 
    galArrPriceOption2, galArrPriceOption3, galArrBland, galArrBland2, galRuleData, galSeatDetail
}   = require('../../src/utils/galParseData');
const { resolve } = require('path');
const { reject } = require('promise');
const { calculateAge , convertDays } = require('../../src/utils/ages');
const { arrTitleChange } = require('../../src/utils/airConst');
const { interlineLogSave } = require('../../src/utils/database');

function createHeader() {
    const GAL_BRANCH = "P7144368";
	  const GAL_UAPI   = "uAPI1308860155-67329f48";
	  const GAL_PASSWD = "3g=MsT8+6$";

    const sec         = Buffer.from(`Universal API/${GAL_UAPI}:${GAL_PASSWD}`).toString('base64');

    const uApiUrl     = "https://emea.universal-api.pp.travelport.com/B2BGateway/connect/uAPI";
    const headers = {
        'Authorization': `Basic ${sec}`,
        'Content-Type': 'text/xml; charset=UTF-8',
        'Accept-Encoding': 'gzip,deflate'
    };
    return headers;
}

function uapiGalClearXML(data = "") {
  const s = String(data);
  return s.replace(/(?:SOAP:|air:|common_v52_0:|universal:|common_v33_0:|terminal:|gdsQueue:|util:)/g, "");
}

function newTraceID() {
    const now = new Date();
    const key = String(now.getTime()) ;
    let   encrypted = deps.aes128Encrypt (deps.getNow().aviaSecurityKey, key);
    return encrypted.replace(/\+/g, '').replace(/\//g, '').replace(/=/g, '');
}

async function uapiGalParse (xml) {
    const parser = new xml2js.Parser({ explicitArray: false, trim: true , tagNameProcessors: [xml2js.processors.stripPrefix] });
    return await parser.parseStringPromise(xml);
}

async function uapiGalileoSave (galXml) {
    const result = await uapiGalParse(galXml);
    let   len = 0;
    const pool = await deps.getPool();
    const body = result.Envelope.Body;
    const isFault = body.Fault?.faultcode || '';
    const source  = isFault ? body.Fault.detail.ErrorInfo : body.LowFareSearchRsp.$;
    
    const TransactionId  = source.TransactionId;
    const TraceId        = source.TraceId;

    const rsp           = result.Envelope.Body.LowFareSearchRsp;
    const flightDetails = rsp.FlightDetailsList.FlightDetails;
    len           = Array.isArray(flightDetails) ? flightDetails.length : (flightDetails ? 1 : 0);
    const aFlight = [];
    const aSql = {
        HubGalileoFlight: [],
        HubGalileoSegment: [],
        HubGalileoFare:[],
        HubGalileoPrice:[],
        HubGalileoPriceInfo_fareref:[],
        HubGalileoPriceInfo_Tax:[],
        HubGalileoPriceInfo: [],
        HubGalileoPriceInfo_Option: [],
        HubGalileoPriceInfo_Option_detail: [],
        HubGalileoPrice_bland: [],
    };

    let arrSqlTable = [];
    arrSqlTable["HubGalileoFlight"]                   = `TransactionId,flight_key,DestinationTerminal,OriginTerminal,Equipment,FlightTime,ArrivalTime,DepartureTime,Destination,Origin`;
    arrSqlTable["HubGalileoSegment"]                  = `TransactionId,Segment_key,[Group],Carrier,FlightNumber,Origin,Destination,DepartureTime,ArrivalTime,FlightTime,Distance,ETicketability,Equipment,ChangeOfPlane,ParticipantLevel,LinkAvailability,PolledAvailabilityOption,OptionalServicesIndicator,AvailabilitySource,AvailabilityDisplayType,NumberOfStops,seg_flight_key,CodeshareInfo`;
    arrSqlTable["HubGalileoFare"]                     = `TransactionId,Fare_Key,FareBasis,PassengerTypeCode,Origin,Destination,EffectiveDate,DepartureDate,Amount,NegotiatedFare,NotValidAfter,NumberOfPieces,MaxWeight,FareInfoRef,FareRuleKey,AccountCode`;
    arrSqlTable["HubGalileoPrice"]                    = `TransactionId,Price_Key,TotalPrice,BasePrice,ApproximateTotalPrice,ApproximateBasePrice,Taxes,ApproximateTaxes,CompleteItinerary`;
    arrSqlTable["HubGalileoPriceInfo_fareref"]        = `TransactionId,Price_Key,PriceInfo_Key,minor_num,FareInfoRef, PassengerType`;
    arrSqlTable["HubGalileoPriceInfo_Tax"]            = `TransactionId,PriceInfo_Key,minor_num,Category,Amount`;
    arrSqlTable["HubGalileoPriceInfo"]                = `TransactionId,Price_Key,PriceInfo_Key,TotalPrice,BasePrice,ApproximateTotalPrice,ApproximateBasePrice,Taxes,LatestTicketingTime,PricingMethod,Refundable,ETicketability,PlatingCarrier,ProviderCode,FareCalc,PassengerType,ChangePenalty,CancelPenalty`;
    arrSqlTable["HubGalileoPriceInfo_Option"]         = `TransactionId,PriceInfo_Key,minor_num,LegRef,Destination,Origin`;
    arrSqlTable["HubGalileoPriceInfo_Option_detail"]  = `TransactionId,PriceInfo_Key,minor_num,minor_num2,minor_num3,shareCnt,Detail_Key,TravelTime,BookingCode,BookingCount,CabinClass,FareInfoRef,SegmentRef,Connection,sharePrice`;
    arrSqlTable["HubGalileoPrice_bland"]              = `TransactionId,Price_Key,BrandID,Name,BrandedDetailsAvailable,Carrier`;


    if (len > 0) {
        const flightDetailsList = [].concat(rsp.FlightDetailsList.FlightDetails || []);
        for (let ix = 0; ix < flightDetailsList.length; ix++) {
            const item = flightDetailsList[ix];
            let sql1 = '';
            let flight_key = '';

            for (const key of galArrFlight) {
                const val = item.$?.[key] || ''; // 속성 추출
                if (flight_key === '') flight_key = val;
                sql1 += (sql1 ? ',' : '') + `'${val}'`;
            }
            aFlight.push(flight_key);
            aSql.HubGalileoFlight.push(`('${TransactionId}',${sql1})`);
        }
        const airSegmentList = [].concat(rsp.AirSegmentList.AirSegment || []);
        for (let ix = 0; ix < airSegmentList.length; ix++) {
            const item = airSegmentList[ix];
            let sql2 = '';
            let Segment_key = '';
            for (const key of galArrSegment) {
                const val = item.$?.[key] || '';
                if (key === 'Segment_key' && !Segment_key) Segment_key = val;
                sql2 += (sql2 ? ',' : '') + `'${val}'`;
            }
            // 추가 필드: FlightDetailsRef, CodeshareInfo
            //console.log(item)
            const FlightDetailsRef = item.FlightDetailsRef?.$?.Key || '';
            const CodeshareInfo = item.CodeshareInfo?.$?.OperatingCarrier || '';
            sql2 += `,'${FlightDetailsRef}','${CodeshareInfo}'`;
            aSql.HubGalileoSegment.push(` ('${TransactionId}',${sql2})` );
        } 
        const fareInfoList = [].concat(rsp.FareInfoList.FareInfo || []);
        for (let ix = 0; ix < fareInfoList.length; ix++) {
            const item = fareInfoList[ix];
            let sql3 = '';
            for (const key of galArrFare) {
                const val = item.$?.[key] || '';
                sql3 += (sql3 ? ',' : '') + `'${val}'`;
            }
            const NumberOfPieces = item.BaggageAllowance?.NumberOfPieces || '';
            const MaxWeight = item.BaggageAllowance?.MaxWeight?.$?.Value || '';
            const FareInfoRef = item.FareRuleKey?.$?.FareInfoRef || '';
            const FareRuleKey = item.FareRuleKey?._ || '';
            const AccountCode = item.AccountCode?.$?.Code || '';
            aSql.HubGalileoFare.push( `('${TransactionId}',${sql3},'${NumberOfPieces}','${MaxWeight}','${FareInfoRef}','${FareRuleKey}','${AccountCode}')`);
        }
        const AirPricePointList = [].concat(rsp.AirPricePointList.AirPricePoint || []);
        for (let ix = 0 ; ix < AirPricePointList.length ; ix ++) {
            const point = AirPricePointList[ix];
            const attrs = point.$ || {};
            //console.log(attrs)
            let sql4 = '';
            let Price_Key = '';
            for (const key of galArrPrice) {
                const val = attrs[key] || '';
                if (!Price_Key) Price_Key = val;
                sql4 += (sql4 ? ',' : '') + `'${val}'`;
            }
            aSql.HubGalileoPrice.push(`('${TransactionId}',${sql4})`);
            const AirPricingList = [].concat(point.AirPricingInfo || []);
            //console.log(AirPricingList)
            for (let ix2  = 0 ; ix2 < AirPricingList.length ; ix2 ++) {
                const pItem  = AirPricingList[ix2];
                //console.log(pItem)
                const attrs2 = pItem.$ || {};
                const paxList = Array.isArray(pItem.PassengerType) ? pItem.PassengerType[0] : pItem.PassengerType;
                let sql5 = '';
                let PriceInfo_Key = '';
                for (const key of galArrPriceInfo) {
                    const val = attrs2[key] || '';
                    if (!PriceInfo_Key) PriceInfo_Key = val;
                    sql5 += (sql5 ? ',' : '') + `'${val}'`;
                }
                //console.log(paxList)
                const pax = paxList.PassengerType?.$ || {};
                const PassengerType = paxList?.['$']?.Code || '';
                const PassengerAge = paxList?.['$']?.Age || '';
                //console.log(PassengerType)
                const fareRefs = [].concat(pItem.FareInfoRef || []);
                fareRefs.forEach((ref, idx) => {
                    const FareInfoRef = ref?.$?.Key || '';
                    const minor = idx + 1;
                    const sql = ` ('${TransactionId}','${Price_Key}','${PriceInfo_Key}','${minor}','${FareInfoRef}','${PassengerType}') `;
                    aSql.HubGalileoPriceInfo_fareref.push(sql);
                });

                // 🎯 TaxInfo
                const taxList = [].concat(pItem.TaxInfo || []);
                taxList.forEach((tax, idx) => {
                    let sql6 = '';
                    const minor = idx + 1;
                    for (const key of galArrTax) {
                        const val = tax.$?.[key] || '';
                        sql6 += (sql6 ? ',' : '') + `'${val}'`;
                    }
                    const taxSql = ` ('${TransactionId}','${PriceInfo_Key}','${minor}',${sql6})`;
                    aSql.HubGalileoPriceInfo_Tax.push(taxSql);
                });
                const FareCalc = pItem.FareCalc || '';
                const ChangePenalty = `${pItem.ChangePenalty?.$?.PenaltyApplies || ''}/${pItem.ChangePenalty?.Amount || ''}`;
                const CancelPenalty = `${pItem.CancelPenalty?.$?.PenaltyApplies || ''}/${pItem.CancelPenalty?.Amount || ''}`;

                const sql = ` ('${TransactionId}','${Price_Key}',${sql5},'${FareCalc}','${PassengerType}','${ChangePenalty}','${CancelPenalty}')`;
                aSql.HubGalileoPriceInfo.push(sql);


                const options = [].concat(pItem.FlightOptionsList.FlightOption || []);
                for (let ix3 = 0 ; ix3 < options.length ; ix3 ++) {
                    const opt  = options[ix3];
                    const optAttrs = opt.$ || {};
                    let sql7 = '';
                    for (const key of galArrPriceOption) {
                        const val = optAttrs[key] || '';
                        sql7 += (sql7 ? ',' : '') + `'${val}'`;
                    }
                    aSql.HubGalileoPriceInfo_Option.push( `('${TransactionId}','${PriceInfo_Key}','${ix3 + 1}',${sql7})`  );
                

                    const options2 = [].concat(opt.Option || []);
                    for (let ix4 = 0; ix4 < options2.length; ix4++) {
                    const opt2 = options2[ix4];
                    const opt2Attrs = opt2.$ || '';
            
                    // 🎯 INSERT: Option_detail (상위 속성)
                    let sql8 = '';
                    for (const key of galArrPriceOption2) {
                        const val = opt2Attrs[key] || '';
                        sql8 += (sql8 ? ',' : '') + `'${val}'`;
                    }
            
                    const bookings = [].concat(opt2.BookingInfo || []);
                    const segCount = bookings.length;
            
                    for (let ix5 = 0; ix5 < segCount; ix5++) {
                        const booking = bookings[ix5];
                        let sql9 = '';
                        let FareInfoRef = '';
                        let BookingCode = '';
                        let BookingCount = '';
            
                        for (const key of galArrPriceOption3) {
                        const val = booking?.$?.[key] || '';
                        if (key === 'FareInfoRef' && !FareInfoRef) FareInfoRef = val;
                        if (key === 'BookingCode' && !BookingCode) BookingCode = val;
                        if (key === 'BookingCount' && !BookingCount) BookingCount = val;
                        sql9 += (sql9 ? ',' : '') + `'${val}'`;
                        }
            
                        // 🎯 Option.Connection 정보
                        const Connection = (
                        [].concat(opt2.Connection || [])[0]?.$?.SegmentIndex || ''
                        );
            
                        aSql.HubGalileoPriceInfo_Option_detail.push(`('${TransactionId}','${PriceInfo_Key}','${ix3 + 1}','${ix4 + 1}','${ix5 + 1}','${segCount}',${sql8},${sql9},'${Connection}','1')`);
                    }
                    }

                }


            }

        }
        const brands = [].concat(rsp.BrandList?.Brand || []);
        for (const brand of brands) {
            const brandAttrs = brand.$ || {};
            let sql9 = '';
            let Price_Key = '';

            for (const key of galArrBland) {
                const val = brandAttrs[key] || '';
                if (!Price_Key) Price_Key = val;
                sql9 += (sql9 ? ',' : '') + `'${val}'`;
            }

            aSql.HubGalileoPrice_bland.push( ` ('${TransactionId}',${sql9})` );
        }
        // 추후에 디비 입력창 만들기
        //console.log(aSql)

        for (const [tableName, rows] of Object.entries(aSql)) {
            if (!Array.isArray(rows) || rows.length === 0) {
                //console.log(`⚠️ [${tableName}] 데이터 없음, insert skip`);
                continue;
            }

            //console.log(`🚀 [${tableName}] - 총 ${rows.length}건 처리 시작`);

            // 999개씩 나누기
            for (let i = 0; i < rows.length; i += 999) {
                const chunk = rows.slice(i, i + 999);

                // 문자열 쿼리 형태로 가정 (예: insert into 테이블 values (...), (...), ...)
                const query = chunk.join(',\n');

                if (query) {
                    const fullQuery = `INSERT INTO hubGalileo.dbo.${tableName} (${arrSqlTable[tableName]}) VALUES \n${query};`;
                    try {
                        await pool.request().query(fullQuery);
                        //console.log(`✅ ${tableName} - ${i + 1} ~ ${i + chunk.length} insert 성공`);
                    } catch (err) {
                        console.error(`❌ ${tableName} insert 실패 (${i + 1} ~ ${i + chunk.length}):`, err);
                    // 필요 시 중단 또는 계속 진행
                    // break; 또는 continue;
                    }
                }
            }
        }
    
    }
    return [TransactionId , TraceId];
}

async function uapiGalSearch(pData) {
    const GAL_BRANCH = "P7144368";
    const {
      departure, arrive, departure_date, arrive_date, ticket_type, grade,
      airCabin1, airCabin2, airCabin3, airCabin4, airCabin5, airCabin6,
      adt, chd, kid, inf, stopover, airLike, airNotLike, cityLike,
      MaxJourneyTime, MaxShareTime, SearchPortData, RouteCount,
      bspSiteCode, SQSEARCHON
    } = pData;
  
    const TraceId = newTraceID();
    const portName = SearchPortData === 'P' ? 'Airport' : 'CityOrAirport';
    const transCabin = {
      Y: '',
      P: "<com:CabinClass Type='PremiumEconomy' />",
      C: "<com:CabinClass Type='Business' />",
      F: "<com:CabinClass Type='First' />"
    };
  
    const aCabin = {};
    for (let i = 1; i <= 6; i++) {
      const cab = pData[`airCabin${i}`];
      if (cab && cab !== 'Y') aCabin[i] = `<air:PreferredCabins>${transCabin[cab]}</air:PreferredCabins>`;
    }
  
    const makeCityLikeXML = (list) =>
      list.map(code => `<com:ConnectionPoint><com:City Code='${code}'/></com:ConnectionPoint>`).join('');
  
    let citySearchQryLike = '';
    if (cityLike) {
      const tmp = cityLike.split('/');
      citySearchQryLike = `
        <air:PermittedConnectionPoints>
          ${makeCityLikeXML(tmp)}
        </air:PermittedConnectionPoints>
      `;
    }
  
    const airLegModifiers = (i) => `
      <air:AirLegModifiers MaxConnectionTime='${MaxShareTime ?? 0}00'>
        ${aCabin[i] || ''}
        ${citySearchQryLike}
      </air:AirLegModifiers>
    `;
  
    const searchLeg = (from, to, date, i) => `
      <air:SearchAirLeg>
        <air:SearchOrigin><com:${portName} Code='${from}' PreferCity='true' /></air:SearchOrigin>
        <air:SearchDestination><com:${portName} Code='${to}' PreferCity='true' /></air:SearchDestination>
        <air:SearchDepTime PreferredTime='${deps.cutDate(date)}' />
        ${airLegModifiers(i)}
      </air:SearchAirLeg>
    `;
  
    let segs = searchLeg(departure, arrive, departure_date, 1);
    if (ticket_type === '2' && arrive_date) segs += searchLeg(arrive, departure, arrive_date, 2);
    else if (ticket_type === '3') {
      for (let i = 2; i <= RouteCount; i++) {
        const from = pData[`dep_city${i}`];
        const to = pData[`arr_city${i}`];
        const date = pData[`dep_date${i}`];
        segs += searchLeg(from, to, date, i);
      }
    }
  
    const pax = (type, count, age) =>
      Array.from({ length: count }, () => `<com:SearchPassenger Code='${type}'${age ? ` Age='${age}'` : ''} />`).join('');
  
    const searchPax = [
      pax('ADT', adt), pax('CNN', chd, 10), pax('CNN', kid, 5), pax('INF', inf, 1)
    ].join('');
    
    const arrSabreAir = ['OZ','RS','BX'];
    let stop = '';
    let sub  = '';
    let addSearchQry = '';
    if (stopover === "Y") stop = "false"; else stop = "true";
    const flightType = `<air:FlightType NonStopDirects='true' StopDirects='true' SingleOnlineCon='${stop}' SingleInterlineCon='${stop}' />`;
    if ((airLike || '').trim() !== '') {
      const tmp = (airLike || '').split("/");
      for (let data of tmp) {
        if (arrSabreAir.includes(data)) data = "YY"; 
        sub += `<com:Carrier Code='${data}' />`;
      }
      addSearchQry = `
        <air:PermittedCarriers>
          ${sub}
        </air:PermittedCarriers>
      `;
    } else {
      addSearchQry = `
        <air:ProhibitedCarriers>
          <com:Carrier Code='W2' />
          <com:Carrier Code='H1' />
          <com:Carrier Code='A1' />
          <com:Carrier Code='JQ' />
          <com:Carrier Code='ZA' />
          <com:Carrier Code='OZ' />
          <com:Carrier Code='RS' />
          <com:Carrier Code='BX' />
        </air:ProhibitedCarriers>
      `;
    }
    const MaxJourneyTimeData = MaxJourneyTime ? `MaxJourneyTime='${MaxJourneyTime}'` : '';
    const airSearchModifiers = `
      <air:AirSearchModifiers ${MaxJourneyTimeData}>
        <air:PreferredProviders><com:Provider Code='1G' /></air:PreferredProviders>
        ${addSearchQry}
        ${flightType}
      </air:AirSearchModifiers>
    `;
  
    const soapBody = `
      <soapenv:Envelope xmlns:soapenv='http://schemas.xmlsoap.org/soap/envelope/' xmlns:air='http://www.travelport.com/schema/air_v52_0' xmlns:com='http://www.travelport.com/schema/common_v52_0'>
        <soapenv:Body>
          <air:LowFareSearchReq TargetBranch='${GAL_BRANCH}' TraceId='${TraceId}' SolutionResult='false' AuthorizedBy='UAPIAVIA'>
            <com:BillingPointOfSaleInfo OriginApplication='uAPI' />
            ${segs}
            ${airSearchModifiers}
            ${searchPax}
          </air:LowFareSearchReq>
        </soapenv:Body>
      </soapenv:Envelope>
    `;

    galXml = await uapiGalQuery ('AirService',soapBody);
    const rData = await uapiGalileoSave (galXml);
    return { success: true, data: rData };
}

async function uapiGalGetToken(pData='') {
  const XML = `
      <SOAP-ENV:Envelope xmlns:SOAP-ENV='http://schemas.xmlsoap.org/soap/envelope/'>
        <SOAP-ENV:Body>
          <CreateTerminalSessionReq xmlns='http://www.travelport.com/schema/terminal_v33_0' xmlns:com='http://www.travelport.com/schema/common_v33_0' Host='1G' TargetBranch='${pData.BRANCH}'>
            <com:BillingPointOfSaleInfo OriginApplication='UAPI' />
          </CreateTerminalSessionReq>
        </SOAP-ENV:Body>
      </SOAP-ENV:Envelope>
  `;
  galXml = await uapiGalQuery ('TerminalService',XML);
  //galXml = `<SOAP:Envelope xmlns:SOAP="http://schemas.xmlsoap.org/soap/envelope/"><SOAP:Body><terminal:CreateTerminalSessionRsp xmlns:terminal="http://www.travelport.com/schema/terminal_v33_0"  TransactionId="17C481150A0D6A943ED0A557B9AED8F5" ResponseTime="108"><common_v33_0:HostToken xmlns:common_v33_0="http://www.travelport.com/schema/common_v33_0" Host="1G">7BE67F7F-49E8-4F6E-5063-71B0D9D73053</common_v33_0:HostToken></terminal:CreateTerminalSessionRsp></SOAP:Body></SOAP:Envelope>`;
  const res    = await uapiGalParse(uapiGalClearXML(galXml.trim()));
  const Token  = res?.Envelope?.Body?.CreateTerminalSessionRsp?.HostToken?._ ?? "";
  return Token ;

}

async function uapiGalEndToken(pData='') {
  const XML = `
    <soapenv:Envelope xmlns:soapenv='http://schemas.xmlsoap.org/soap/envelope/' xmlns:ter='http://www.travelport.com/schema/terminal_v33_0' xmlns:com='http://www.travelport.com/schema/common_v33_0'>
      <soapenv:Body>
        <ter:EndTerminalSessionReq TargetBranch='${pData.BRANCH}'>
          <com:BillingPointOfSaleInfo OriginApplication='UAPI'/>
          <com:HostToken Host='1G'>${pData.Token}</com:HostToken>
        </ter:EndTerminalSessionReq>
      </soapenv:Body>
    </soapenv:Envelope>
  `;
  galXml = await uapiGalQuery ('TerminalService',XML);
  return;
}

async function uapiGalTerminal (pData='') {
  const XML = `
    <SOAP-ENV:Envelope xmlns:SOAP-ENV='http://schemas.xmlsoap.org/soap/envelope/'>
      <SOAP-ENV:Body>
        <TerminalReq xmlns:com='http://www.travelport.com/schema/common_v33_0' TargetBranch='${pData.BRANCH}' xmlns='http://www.travelport.com/schema/terminal_v33_0' >
        <com:BillingPointOfSaleInfo OriginApplication='UAPI'/>
        <com:HostToken Host='1G'>${pData.Token}</com:HostToken>
        <TerminalCommand>${pData.Command}</TerminalCommand>
        </TerminalReq>
      </SOAP-ENV:Body>
    </SOAP-ENV:Envelope>
	`;
  if (pData.uid) {
      await interlineLogSave (pData.pool, {uid: pData.uid , query:pData.Command });
  }
  galXml = await uapiGalQuery ('TerminalService',XML);
  if (pData.uid) {
      await interlineLogSave (pData.pool, {uid: pData.uid , query:galXml });
  }
  return uapiGalClearXML(galXml);
}

async function uapiGalRuleSearch (pData='') {
  let fare    = '';
  let addFare = '';
  for (const val of pData.RULE) {
      const tmp = String(val).split('^^');
      fare += `<FareRuleKey FareInfoRef="${tmp[0]}" ProviderCode="1G">${tmp[1]}</FareRuleKey>`;
  }
  if (pData.VOR == "Y") addFare = "<air:FareRulesFilterCategory><air:CategoryCode>VOR</air:CategoryCode></air:FareRulesFilterCategory>";
	else {
		addFare = `
      <air:AirFareRulesModifier>
      <air:AirFareRuleCategory>
      <air:CategoryCode>TKT</air:CategoryCode>
      <air:CategoryCode>CHG</air:CategoryCode>
      </air:AirFareRuleCategory>
      </air:AirFareRulesModifier>
		`;
	}
  const XML = `
    <soapenv:Envelope xmlns:soapenv='http://schemas.xmlsoap.org/soap/envelope/' xmlns:air='http://www.travelport.com/schema/air_v52_0' xmlns:com='http://www.travelport.com/schema/common_v52_0'>
      <soapenv:Body>
        <AirFareRulesReq xmlns='http://www.travelport.com/schema/air_v52_0' TraceId="${pData.TraceId}" TargetBranch="${pData.BRANCH}">
          <com:BillingPointOfSaleInfo OriginApplication='uAPIAVIA' />
          ${fare}
          ${addFare} 
        </AirFareRulesReq>
      </soapenv:Body>
    </soapenv:Envelope>
	`;
  galXml = await uapiGalQuery ('AirService',XML);
  return uapiGalClearXML(galXml);
}

async function uapiGalQuery(urls , xml) {
    let url = 'https://apac.universal-api.pp.travelport.com/B2BGateway/connect/uAPI/'+urls;
    const header = createHeader();
    //console.log(xml)
    uapiGalLogSave (xml);
    try {
        const response = await axios.post(url, xml, {
         headers: header,
         timeout: 10000
        });
        const encoding = response.headers['content-encoding'];
        const galXml = (encoding === 'gzip')
          ? zlib.gunzipSync(response.data).toString('utf-8')
          : response.data.toString('utf-8');
        
        uapiGalLogSave (galXml);
        return galXml;
    } catch (err) {
        if (err.response?.data) {
          const errText = err.response.data.toString('utf-8');
          console.error('[❌ 서버 응답 에러]');
          console.error(errText);
        } else {
          console.error('SOAP Request Error:', err.message);
        }
    }
}

async function uapiGalAirPrice  (pData) {
    let len = Array.isArray(pData.Departure) ? pData.Departure.length : 0;
    let segData  = "";
    let airPrice = "";
    let galXml   = '';
    for (let ix = 0; ix < len; ix++) {
        // <air:Connection/>: 연속 구간(Group 동일)일 때만
        const currGroup = pData["Group"]?.[ix];
        const nextGroup = pData["Group"]?.[ix + 1];
        const addConn = currGroup === nextGroup ? "<air:Connection/>" : "";
    
        // BrandTier 우선, 없으면 Farebasis, 없으면 빈 문자열
        let fCode = "";
        if (pData["BrandTier"]?.[ix].trim() !== "") {
            fCode = ` BrandTier='${pData["BrandTier"]?.[ix]}' `;
        } else if (pData["Farebasis"]?.[ix].trim() !== "") {
            fCode = ` FareBasisCode='${pData["Farebasis"]?.[ix]}' `;
        }
    
        segData += `
          <air:AirSegment Key='${pData["AirSeg"]?.[ix]}'
            Group='${currGroup}'
            Carrier='${pData["AirCode"]?.[ix]}'
            FlightNumber='${pData["AirFltNum"]?.[ix]}'
            Origin='${pData["Departure"]?.[ix]}'
            Destination='${pData["Arrive"]?.[ix]}'
            DepartureTime='${pData["DepartureTime"]?.[ix]}'
            ArrivalTime='${pData["ArriveTime"]?.[ix]}'
            FlightTime='${pData["FltTime"]?.[ix]}'
            Distance='1111' ETicketability='Yes'
            Equipment='${pData["EQUIP"]?.[ix]}' ChangeOfPlane='false'
            ParticipantLevel='Secure Sell' LinkAvailability='true' PolledAvailabilityOption='Polled avail used'
            OptionalServicesIndicator='false'
            AvailabilitySource='S'
            AvailabilityDisplayType='Fare Shop/Optimal Shop'
            ProviderCode='1G'>
            ${addConn}
          </air:AirSegment>
        `;
    
        airPrice += `
          <air:AirSegmentPricingModifiers AirSegmentRef='${pData["AirSeg"]?.[ix]}'${fCode}>
            <air:PermittedBookingCodes>
              <air:BookingCode Code='${pData["AirCls"]?.[ix]}'/>
            </air:PermittedBookingCodes>
          </air:AirSegmentPricingModifiers>
        `;
    }
    let searchPax = '';
    len  = pData["GUBUNGAL"].length;
    const nowSec   = Math.floor(Date.now() / 1000);
    const sGrade   = pData.searchGrade;
    for (let ix = 0; ix < len; ix++) {
      const val0 = pData["GUBUNGAL"][ix].trim(); // 원본 값(ADT/CNN/INF)
      let ageAttr = "";               // " Age='10' " 같은 형태(앞뒤 공백 포함)
      let code    = val0;             // 최종 Code 값
      let bookingTravelerRef = "";
      let addPtc  = '';
      if (val0 === "ADT") {
        let adtType = "ADT";
        if (sGrade.length > 1) {
          adtType = sGrade;
          if (adtType !== "LBR") addPtc = " PricePTCOnly='true'";
        }
        code = adtType;
        bookingTravelerRef = Buffer.from(`${nowSec + ix}${adtType}`).toString("base64");
  
      } else if (val0 === "CNN") {
        let chdType = "CNN";
        if (sGrade === "VFR") chdType = "VFN";
        else if (sGrade === "LBR") chdType = "CNN";
  
        ageAttr = " Age='10' ";     // 2024-02-23 추가 로직 반영
        code    = chdType;
        bookingTravelerRef = Buffer.from(`${nowSec + ix}${chdType}`).toString("base64");
  
      } else if (val0 === "INF") {
        let infType = "INF";
        if (sGrade === "VFR") infType = "VFF";
        else if (sGrade === "LBR") infType = "INF";
  
        ageAttr = " Age='1' ";
        code    = infType;
        bookingTravelerRef = Buffer.from(`${nowSec + ix}${infType}`).toString("base64");
      }
  
      searchPax += `<com:SearchPassenger BookingTravelerRef='${bookingTravelerRef}' Code='${code}'${ageAttr}${addPtc} />`;
    }

    let brand = '';
    if (pData.BRAND === "Y") {
      brand = `
        <air:BrandModifiers>
          <air:FareFamilyDisplay ModifierType='FareFamily' />
        </air:BrandModifiers>
      `;
    }
    let accCode = '';
    if (pData.AccountCode !== "") {
			accCode = `
				<air:AccountCodes>
					<com:AccountCode Code='${pData.AccountCode}' />
				</air:AccountCodes>
			`;
		}
    sellCheck = pData.SellCheck === "Y" ? " SellCheck='true' " : '';


    const XML = `
      <soapenv:Envelope xmlns:soapenv='http://schemas.xmlsoap.org/soap/envelope/' xmlns:air='http://www.travelport.com/schema/air_v52_0' xmlns:com='http://www.travelport.com/schema/common_v52_0' >
        <soapenv:Body>
    
          <air:AirPriceReq TraceId='${pData.TraceId}' TargetBranch='${pData.Branch}' AuthorizedBy='UAPIAVIA'>
            <com:BillingPointOfSaleInfo OriginApplication='UAPI'/>
            <air:AirItinerary>
              ${segData}
            </air:AirItinerary>
            <air:AirPricingModifiers  ReturnServices='false' FaresIndicator='AllFares' ${sellCheck}>
              ${accCode}
              ${brand}
            </air:AirPricingModifiers>
            ${searchPax}
            <air:AirPricingCommand>
              ${airPrice}
            </air:AirPricingCommand>
          </air:AirPriceReq>
          
        </soapenv:Body>
      </soapenv:Envelope>
    `;
    //galXml = `<SOAP:Envelope xmlns:SOAP="http://schemas.xmlsoap.org/soap/envelope/"><SOAP:Body><air:AirPriceRsp xmlns:air="http://www.travelport.com/schema/air_v52_0" xmlns:common_v52_0="http://www.travelport.com/schema/common_v52_0"  TraceId="" TransactionId="07EBB2D70A0D6A926456CC8BB13ACD4E" ResponseTime="215"><common_v52_0:ResponseMessage Code="710401" Type="Warning" ProviderCode="1G"><![CDATA[Taxes returned at the FareInfo level are for informational purposes only, and may differ from those returned at the Itinerary/Passenger Type levels.]]></common_v52_0:ResponseMessage><common_v52_0:ResponseMessage Code="0" Type="Info" ProviderCode="1G"><![CDATA[No result found for Brand ID 1671296]]></common_v52_0:ResponseMessage><common_v52_0:ResponseMessage Code="0" Type="Info" ProviderCode="1G"><![CDATA[No result found for Brand ID 1671297]]></common_v52_0:ResponseMessage><air:AirItinerary><air:AirSegment Key="dLMk2jSqWDKAoZ34CAAAAA==" Group="0" Carrier="LJ" FlightNumber="217" ProviderCode="1G" Origin="ICN" Destination="NRT" DepartureTime="2025-11-10T08:05:00.000+09:00" ArrivalTime="2025-11-10T10:30:00.000+09:00" FlightTime="145" TravelTime="145" Distance="758" ClassOfService="O" Equipment="738" ChangeOfPlane="false" OptionalServicesIndicator="false" AvailabilitySource="A" ParticipantLevel="Secure Sell" LinkAvailability="true" PolledAvailabilityOption="O and D cache or polled status used with different local status" AvailabilityDisplayType="Fare Specific Fare Quote Unbooked"><air:CodeshareInfo OperatingCarrier="LJ">Jin Air Co Ltd</air:CodeshareInfo><air:FlightDetails Key="dLMk2jSqWDKApZ34CAAAAA==" Origin="ICN" Destination="NRT" DepartureTime="2025-11-10T08:05:00.000+09:00" ArrivalTime="2025-11-10T10:30:00.000+09:00" FlightTime="145" TravelTime="145" Distance="758"/></air:AirSegment><air:AirSegment Key="dLMk2jSqWDKAqZ34CAAAAA==" Group="1" Carrier="LJ" FlightNumber="206" ProviderCode="1G" Origin="NRT" Destination="ICN" DepartureTime="2025-11-12T13:50:00.000+09:00" ArrivalTime="2025-11-12T16:25:00.000+09:00" FlightTime="155" TravelTime="155" Distance="758" ClassOfService="O" Equipment="738" ChangeOfPlane="false" OptionalServicesIndicator="false" AvailabilitySource="A" ParticipantLevel="Secure Sell" LinkAvailability="true" PolledAvailabilityOption="O and D cache or polled status used with different local status" AvailabilityDisplayType="Fare Specific Fare Quote Unbooked"><air:CodeshareInfo OperatingCarrier="LJ">Jin Air Co Ltd</air:CodeshareInfo><air:FlightDetails Key="dLMk2jSqWDKArZ34CAAAAA==" Origin="NRT" Destination="ICN" DepartureTime="2025-11-12T13:50:00.000+09:00" ArrivalTime="2025-11-12T16:25:00.000+09:00" FlightTime="155" TravelTime="155" Distance="758"/></air:AirSegment></air:AirItinerary><air:AirPriceResult><air:AirPricingSolution Key="dLMk2jSqWDKAsZ34CAAAAA==" TotalPrice="KRW223900" BasePrice="KRW130000" ApproximateTotalPrice="KRW223900" ApproximateBasePrice="KRW130000" Taxes="KRW93900" Fees="KRW0" ApproximateTaxes="KRW93900" QuoteDate="2025-09-02"><air:AirSegmentRef Key="dLMk2jSqWDKAoZ34CAAAAA=="/><air:AirSegmentRef Key="dLMk2jSqWDKAqZ34CAAAAA=="/><air:AirPricingInfo Key="dLMk2jSqWDKAvZ34CAAAAA==" TotalPrice="KRW223900" BasePrice="KRW130000" ApproximateTotalPrice="KRW223900" ApproximateBasePrice="KRW130000" ApproximateTaxes="KRW93900" Taxes="KRW93900" LatestTicketingTime="2025-11-10T23:59:00.000+09:00" PricingMethod="Guaranteed" Refundable="true" IncludesVAT="false" ETicketability="Yes" PlatingCarrier="LJ" ProviderCode="1G"><air:FareInfo Key="dLMk2jSqWDKA1Z34CAAAAA==" FareBasis="OKRT" PassengerTypeCode="ADT" Origin="ICN" Destination="NRT" EffectiveDate="2025-09-02T09:55:00.000+09:00" DepartureDate="2025-11-10" Amount="KRW65000" NegotiatedFare="false" NotValidBefore="2025-11-10" NotValidAfter="2025-11-10" TaxAmount="KRW39300"><common_v52_0:Endorsement Value="NON ENDS LJ ONLY CHG/RFND"/><common_v52_0:Endorsement Value="PNTY MAY APPLY PER CPN"/><air:FareRuleKey FareInfoRef="dLMk2jSqWDKA1Z34CAAAAA==" ProviderCode="1G">6UUVoSldxwi5wuNQUv0losbKj3F8T9EyxsqPcXxP0TLGyo9xfE/RMsuWFfXVd1OAly5qxZ3qLwOXLmrFneovA5cuasWd6i8Dly5qxZ3qLwOXLmrFneovA60Y8cLhxDWkxWa1uaqI55k3aSkvhp2ybQfmRnHT9TuFVsZsBfUIzCxN3J3NyYpz6SpXYtmunhRENobWGVEOSn+7wucmbHHjkxll6FxyIC6cYuAWfcH2w92IEQfz1U0L76zkR0NOZSWq+liUWB2LhHTqkp0FEw0raOCbZ1nsUQQBbkibc0jxzA95xEYe+A+P2IuFsAExMoVlv4Xvb2u1Qx+/he9va7VDH7+F729rtUMfv4Xvb2u1Qx+/he9va7VDHzyxauAs+veBE308BFXsd7QPNqcmmS6r7B2WN4EjYakqj27MlTeVdiCZ3h6HjkXsKnkZrc8c9A1O5W4bRuwrrPA=</air:FareRuleKey><air:Brand Key="dLMk2jSqWDKA1Z34CAAAAA==" BrandID="1671296" UpSellBrandID="1671297" BrandTier="0001"/></air:FareInfo><air:FareInfo Key="dLMk2jSqWDKA4Z34CAAAAA==" FareBasis="OKRT" PassengerTypeCode="ADT" Origin="NRT" Destination="ICN" EffectiveDate="2025-09-02T09:55:00.000+09:00" DepartureDate="2025-11-12" Amount="KRW65000" NegotiatedFare="false" NotValidBefore="2025-11-12" NotValidAfter="2025-11-12" TaxAmount="KRW54600"><common_v52_0:Endorsement Value="NON ENDS LJ ONLY CHG/RFND"/><common_v52_0:Endorsement Value="PNTY MAY APPLY PER CPN"/><air:FareRuleKey FareInfoRef="dLMk2jSqWDKA4Z34CAAAAA==" ProviderCode="1G">6UUVoSldxwi5wuNQUv0losbKj3F8T9EyxsqPcXxP0TLGyo9xfE/RMsuWFfXVd1OAly5qxZ3qLwOXLmrFneovA5cuasWd6i8Dly5qxZ3qLwOXLmrFneovA60Y8cLhxDWkxWa1uaqI55k3aSkvhp2ybaoLWe07C/TOH274eehO7MpN3J3NyYpz6SpXYtmunhRENobWGVEOSn+snDhjAGY7khll6FxyIC6cYuAWfcH2w92IEQfz1U0L76zkR0NOZSWq+liUWB2LhHTvWpSmZkrE0eCbZ1nsUQQBk+wtX3ctXxd5xEYe+A+P2IuFsAExMoVlv4Xvb2u1Qx+/he9va7VDH7+F729rtUMfv4Xvb2u1Qx+/he9va7VDHzyxauAs+veBE308BFXsd7QPNqcmmS6r7B2WN4EjYakqj27MlTeVdiCZ3h6HjkXsKnkZrc8c9A1O5W4bRuwrrPA=</air:FareRuleKey><air:Brand Key="dLMk2jSqWDKA4Z34CAAAAA==" BrandID="1671296" UpSellBrandID="1671297" BrandTier="0001"/></air:FareInfo><air:BookingInfo BookingCode="O" CabinClass="Economy" FareInfoRef="dLMk2jSqWDKA1Z34CAAAAA==" SegmentRef="dLMk2jSqWDKAoZ34CAAAAA==" HostTokenRef="dLMk2jSqWDKAtZ34CAAAAA=="/><air:BookingInfo BookingCode="O" CabinClass="Economy" FareInfoRef="dLMk2jSqWDKA4Z34CAAAAA==" SegmentRef="dLMk2jSqWDKAqZ34CAAAAA==" HostTokenRef="dLMk2jSqWDKAuZ34CAAAAA=="/><air:TaxInfo Category="BP" Amount="KRW24000" Key="dLMk2jSqWDKAwZ34CAAAAA=="/><air:TaxInfo Category="OI" Amount="KRW6600" Key="dLMk2jSqWDKAxZ34CAAAAA=="/><air:TaxInfo Category="SW" Amount="KRW23200" Key="dLMk2jSqWDKAyZ34CAAAAA=="/><air:TaxInfo Category="TK" Amount="KRW9500" Key="dLMk2jSqWDKAzZ34CAAAAA=="/><air:TaxInfo Category="YR" Amount="KRW30600" Key="dLMk2jSqWDKA0Z34CAAAAA=="/><air:FareCalc>SEL LJ TYO 46.85OKRT LJ SEL 46.85OKRT NUC93.70END ROE1387.38933</air:FareCalc><air:PassengerType Code="ADT"/><air:ChangePenalty PenaltyApplies="Anytime"><air:Amount>KRW60000</air:Amount></air:ChangePenalty><air:CancelPenalty PenaltyApplies="Anytime"><air:Amount>KRW100000</air:Amount></air:CancelPenalty><air:BaggageAllowances><air:BaggageAllowanceInfo TravelerType="ADT" Origin="ICN" Destination="NRT" Carrier="LJ"><air:URLInfo><air:URL>VIEWTRIP.TRAVELPORT.COM/BAGGAGEPOLICY/LJ</air:URL></air:URLInfo><air:TextInfo><air:Text>15K</air:Text><air:Text>BAGGAGE DISCOUNTS MAY APPLY BASED ON FREQUENT FLYER STATUS/ ONLINE CHECKIN/FORM OF PAYMENT/MILITARY/ETC.</air:Text></air:TextInfo><air:BagDetails ApplicableBags="1stChecked"><air:BaggageRestriction><air:TextInfo><air:Text>CHGS MAY APPLY IF BAGS EXCEED TTL WT ALLOWANCE</air:Text></air:TextInfo></air:BaggageRestriction></air:BagDetails><air:BagDetails ApplicableBags="2ndChecked"><air:BaggageRestriction><air:TextInfo><air:Text>CHGS MAY APPLY IF BAGS EXCEED TTL WT ALLOWANCE</air:Text></air:TextInfo></air:BaggageRestriction></air:BagDetails></air:BaggageAllowanceInfo><air:BaggageAllowanceInfo TravelerType="ADT" Origin="NRT" Destination="ICN" Carrier="LJ"><air:URLInfo><air:URL>VIEWTRIP.TRAVELPORT.COM/BAGGAGEPOLICY/LJ</air:URL></air:URLInfo><air:TextInfo><air:Text>15K</air:Text><air:Text>BAGGAGE DISCOUNTS MAY APPLY BASED ON FREQUENT FLYER STATUS/ ONLINE CHECKIN/FORM OF PAYMENT/MILITARY/ETC.</air:Text></air:TextInfo><air:BagDetails ApplicableBags="1stChecked"><air:BaggageRestriction><air:TextInfo><air:Text>CHGS MAY APPLY IF BAGS EXCEED TTL WT ALLOWANCE</air:Text></air:TextInfo></air:BaggageRestriction></air:BagDetails><air:BagDetails ApplicableBags="2ndChecked"><air:BaggageRestriction><air:TextInfo><air:Text>CHGS MAY APPLY IF BAGS EXCEED TTL WT ALLOWANCE</air:Text></air:TextInfo></air:BaggageRestriction></air:BagDetails></air:BaggageAllowanceInfo><air:CarryOnAllowanceInfo Origin="ICN" Destination="NRT" Carrier="LJ"><air:TextInfo><air:Text>1P</air:Text></air:TextInfo><air:CarryOnDetails ApplicableCarryOnBags="1" BasePrice="KRW0" ApproximateBasePrice="KRW0" TotalPrice="KRW0" ApproximateTotalPrice="KRW0"><air:BaggageRestriction><air:TextInfo><air:Text>UPTO22LB/10KG AND UPTO45LI/115LCM</air:Text></air:TextInfo></air:BaggageRestriction></air:CarryOnDetails></air:CarryOnAllowanceInfo><air:CarryOnAllowanceInfo Origin="NRT" Destination="ICN" Carrier="LJ"><air:TextInfo><air:Text>1P</air:Text></air:TextInfo><air:CarryOnDetails ApplicableCarryOnBags="1" BasePrice="JPY0" TotalPrice="JPY0"><air:BaggageRestriction><air:TextInfo><air:Text>UPTO22LB/10KG AND UPTO45LI/115LCM</air:Text></air:TextInfo></air:BaggageRestriction></air:CarryOnDetails></air:CarryOnAllowanceInfo></air:BaggageAllowances></air:AirPricingInfo><air:FareNote Key="dLMk2jSqWDKA9Z34CAAAAA==">LAST DATE TO PURCHASE TICKET: 10NOV25</air:FareNote><air:FareNote Key="dLMk2jSqWDKA+Z34CAAAAA==">TICKETING AGENCY 3Y0G</air:FareNote><air:FareNote Key="dLMk2jSqWDKA/Z34CAAAAA==">DEFAULT PLATING CARRIER LJ</air:FareNote><air:FareNote Key="dLMk2jSqWDKAAa34CAAAAA==">E-TKT REQUIRED</air:FareNote><air:FareNote Key="dLMk2jSqWDKABa34CAAAAA==">TICKETING FEES MAY APPLY</air:FareNote><common_v52_0:HostToken Key="dLMk2jSqWDKAtZ34CAAAAA==">GFB10101ADT00  01OKRT                                  010001#GFB200010101NADTV3008SK230020000199KS#GFMCERT008NSK23 LJ ADTOKRT</common_v52_0:HostToken><common_v52_0:HostToken Key="dLMk2jSqWDKAuZ34CAAAAA==">GFB10101ADT00  02OKRT                                  010002#GFB200010102NADTV3008SK230020000199KS#GFMCERT008NSK23 LJ ADTOKRT</common_v52_0:HostToken></air:AirPricingSolution><air:AirPricingSolution Key="dLMk2jSqWDKACa34CAAAAA==" TotalPrice="KRW303900" BasePrice="KRW210000" ApproximateTotalPrice="KRW303900" ApproximateBasePrice="KRW210000" Taxes="KRW93900" Fees="KRW0" ApproximateTaxes="KRW93900" QuoteDate="2025-09-02"><air:AirSegmentRef Key="dLMk2jSqWDKAoZ34CAAAAA=="/><air:AirSegmentRef Key="dLMk2jSqWDKAqZ34CAAAAA=="/><air:AirPricingInfo Key="dLMk2jSqWDKAFa34CAAAAA==" TotalPrice="KRW303900" BasePrice="KRW210000" ApproximateTotalPrice="KRW303900" ApproximateBasePrice="KRW210000" ApproximateTaxes="KRW93900" Taxes="KRW93900" LatestTicketingTime="2025-11-10T23:59:00.000+09:00" PricingMethod="Guaranteed" Refundable="true" IncludesVAT="false" ETicketability="Yes" PlatingCarrier="LJ" ProviderCode="1G"><air:FareInfo Key="dLMk2jSqWDKALa34CAAAAA==" FareBasis="ZKRT" PassengerTypeCode="ADT" Origin="ICN" Destination="NRT" EffectiveDate="2025-09-02T09:55:00.000+09:00" DepartureDate="2025-11-10" Amount="KRW105000" NegotiatedFare="false" NotValidBefore="2025-11-10" NotValidAfter="2025-11-10" TaxAmount="KRW39300"><air:FareRuleKey FareInfoRef="dLMk2jSqWDKALa34CAAAAA==" ProviderCode="1G">6UUVoSldxwi5wuNQUv0losbKj3F8T9EyxsqPcXxP0TLGyo9xfE/RMsuWFfXVd1OAly5qxZ3qLwOXLmrFneovA5cuasWd6i8Dly5qxZ3qLwOXLmrFneovA60Y8cLhxDWkxWa1uaqI55k3aSkvhp2ybeLLvAJnqS8XoV5GS2AaPlhN3J3NyYpz6SUiZAdQ7jmTNobWGVEOSn+7wucmbHHjkxll6FxyIC6cYuAWfcH2w92IEQfz1U0L7134FbXFy8Co+liUWB2LhHTqkp0FEw0raOCbZ1nsUQQBbkibc0jxzA/8DlTO++m/CouFsAExMoVlv4Xvb2u1Qx+/he9va7VDH7+F729rtUMfv4Xvb2u1Qx+/he9va7VDHzyxauAs+veBE308BFXsd7QPNqcmmS6r7B2WN4EjYakqmtfRWENUdBmZ3h6HjkXsKnkZrc8c9A1O5W4bRuwrrPA=</air:FareRuleKey><air:Brand Key="dLMk2jSqWDKALa34CAAAAA==" BrandID="1671297" UpSellBrandFound="false" BrandTier="0002"/></air:FareInfo><air:FareInfo Key="dLMk2jSqWDKAMa34CAAAAA==" FareBasis="ZKRT" PassengerTypeCode="ADT" Origin="NRT" Destination="ICN" EffectiveDate="2025-09-02T09:55:00.000+09:00" DepartureDate="2025-11-12" Amount="KRW105000" NegotiatedFare="false" NotValidBefore="2025-11-12" NotValidAfter="2025-11-12" TaxAmount="KRW54600"><air:FareRuleKey FareInfoRef="dLMk2jSqWDKAMa34CAAAAA==" ProviderCode="1G">6UUVoSldxwi5wuNQUv0losbKj3F8T9EyxsqPcXxP0TLGyo9xfE/RMsuWFfXVd1OAly5qxZ3qLwOXLmrFneovA5cuasWd6i8Dly5qxZ3qLwOXLmrFneovA60Y8cLhxDWkxWa1uaqI55k3aSkvhp2ybU9Xkm3aCRY/LBjUYBGQujVN3J3NyYpz6SUiZAdQ7jmTNobWGVEOSn+snDhjAGY7khll6FxyIC6cYuAWfcH2w92IEQfz1U0L7134FbXFy8Co+liUWB2LhHTvWpSmZkrE0eCbZ1nsUQQBk+wtX3ctXxf8DlTO++m/CouFsAExMoVlv4Xvb2u1Qx+/he9va7VDH7+F729rtUMfv4Xvb2u1Qx+/he9va7VDHzyxauAs+veBE308BFXsd7QPNqcmmS6r7B2WN4EjYakqmtfRWENUdBmZ3h6HjkXsKnkZrc8c9A1O5W4bRuwrrPA=</air:FareRuleKey><air:Brand Key="dLMk2jSqWDKAMa34CAAAAA==" BrandID="1671297" UpSellBrandFound="false" BrandTier="0002"/></air:FareInfo><air:BookingInfo BookingCode="Z" CabinClass="Economy" FareInfoRef="dLMk2jSqWDKALa34CAAAAA==" SegmentRef="dLMk2jSqWDKAoZ34CAAAAA==" HostTokenRef="dLMk2jSqWDKADa34CAAAAA=="/><air:BookingInfo BookingCode="Z" CabinClass="Economy" FareInfoRef="dLMk2jSqWDKAMa34CAAAAA==" SegmentRef="dLMk2jSqWDKAqZ34CAAAAA==" HostTokenRef="dLMk2jSqWDKAEa34CAAAAA=="/><air:TaxInfo Category="BP" Amount="KRW24000" Key="dLMk2jSqWDKAGa34CAAAAA=="/><air:TaxInfo Category="OI" Amount="KRW6600" Key="dLMk2jSqWDKAHa34CAAAAA=="/><air:TaxInfo Category="SW" Amount="KRW23200" Key="dLMk2jSqWDKAIa34CAAAAA=="/><air:TaxInfo Category="TK" Amount="KRW9500" Key="dLMk2jSqWDKAJa34CAAAAA=="/><air:TaxInfo Category="YR" Amount="KRW30600" Key="dLMk2jSqWDKAKa34CAAAAA=="/><air:FareCalc>SEL LJ TYO 75.68ZKRT LJ SEL 75.68ZKRT NUC151.36END ROE1387.38933</air:FareCalc><air:PassengerType Code="ADT"/><air:ChangePenalty PenaltyApplies="Anytime"><air:Amount>KRW40000</air:Amount></air:ChangePenalty><air:CancelPenalty PenaltyApplies="Anytime"><air:Amount>KRW100000</air:Amount></air:CancelPenalty><air:BaggageAllowances><air:BaggageAllowanceInfo TravelerType="ADT" Origin="ICN" Destination="NRT" Carrier="LJ"><air:URLInfo><air:URL>VIEWTRIP.TRAVELPORT.COM/BAGGAGEPOLICY/LJ</air:URL></air:URLInfo><air:TextInfo><air:Text>15K</air:Text><air:Text>BAGGAGE DISCOUNTS MAY APPLY BASED ON FREQUENT FLYER STATUS/ ONLINE CHECKIN/FORM OF PAYMENT/MILITARY/ETC.</air:Text></air:TextInfo><air:BagDetails ApplicableBags="1stChecked"><air:BaggageRestriction><air:TextInfo><air:Text>CHGS MAY APPLY IF BAGS EXCEED TTL WT ALLOWANCE</air:Text></air:TextInfo></air:BaggageRestriction></air:BagDetails><air:BagDetails ApplicableBags="2ndChecked"><air:BaggageRestriction><air:TextInfo><air:Text>CHGS MAY APPLY IF BAGS EXCEED TTL WT ALLOWANCE</air:Text></air:TextInfo></air:BaggageRestriction></air:BagDetails></air:BaggageAllowanceInfo><air:BaggageAllowanceInfo TravelerType="ADT" Origin="NRT" Destination="ICN" Carrier="LJ"><air:URLInfo><air:URL>VIEWTRIP.TRAVELPORT.COM/BAGGAGEPOLICY/LJ</air:URL></air:URLInfo><air:TextInfo><air:Text>15K</air:Text><air:Text>BAGGAGE DISCOUNTS MAY APPLY BASED ON FREQUENT FLYER STATUS/ ONLINE CHECKIN/FORM OF PAYMENT/MILITARY/ETC.</air:Text></air:TextInfo><air:BagDetails ApplicableBags="1stChecked"><air:BaggageRestriction><air:TextInfo><air:Text>CHGS MAY APPLY IF BAGS EXCEED TTL WT ALLOWANCE</air:Text></air:TextInfo></air:BaggageRestriction></air:BagDetails><air:BagDetails ApplicableBags="2ndChecked"><air:BaggageRestriction><air:TextInfo><air:Text>CHGS MAY APPLY IF BAGS EXCEED TTL WT ALLOWANCE</air:Text></air:TextInfo></air:BaggageRestriction></air:BagDetails></air:BaggageAllowanceInfo><air:CarryOnAllowanceInfo Origin="ICN" Destination="NRT" Carrier="LJ"><air:TextInfo><air:Text>1P</air:Text></air:TextInfo><air:CarryOnDetails ApplicableCarryOnBags="1" BasePrice="KRW0" ApproximateBasePrice="KRW0" TotalPrice="KRW0" ApproximateTotalPrice="KRW0"><air:BaggageRestriction><air:TextInfo><air:Text>UPTO22LB/10KG AND UPTO45LI/115LCM</air:Text></air:TextInfo></air:BaggageRestriction></air:CarryOnDetails></air:CarryOnAllowanceInfo><air:CarryOnAllowanceInfo Origin="NRT" Destination="ICN" Carrier="LJ"><air:TextInfo><air:Text>1P</air:Text></air:TextInfo><air:CarryOnDetails ApplicableCarryOnBags="1" BasePrice="JPY0" TotalPrice="JPY0"><air:BaggageRestriction><air:TextInfo><air:Text>UPTO22LB/10KG AND UPTO45LI/115LCM</air:Text></air:TextInfo></air:BaggageRestriction></air:CarryOnDetails></air:CarryOnAllowanceInfo></air:BaggageAllowances></air:AirPricingInfo><common_v52_0:HostToken Key="dLMk2jSqWDKADa34CAAAAA==">GFB10101ADT00  01ZKRT                                  010001#GFB200010101NADTV3008FK230020000199KS#GFMCERS008NFK23 LJ ADTZKRT</common_v52_0:HostToken><common_v52_0:HostToken Key="dLMk2jSqWDKAEa34CAAAAA==">GFB10101ADT00  02ZKRT                                  010002#GFB200010102NADTV3008FK230020000199KS#GFMCERS008NFK23 LJ ADTZKRT</common_v52_0:HostToken></air:AirPricingSolution></air:AirPriceResult></air:AirPriceRsp></SOAP:Body></SOAP:Envelope>`;
    galXml = await uapiGalQuery ('AirService',XML); // 작업 완료후 제거
    
    const open  = "<air:AirPricingInfo";
    const close = "</air:AirPricingInfo>";
    const aInfo   = [];
    let   pos1 = galXml.indexOf(open);
    while (pos1 !== -1) {                        // PHP의 while ($pos1 > 0)보다 안전 (0 인덱스도 허용)
      const pos2 = galXml.indexOf(close, pos1);
      if (pos2 === -1) break;                    // 닫는 태그 없으면 중단

      let seg = galXml.slice(pos1, pos2 + close.length);
      // <common_v52_0:...>  → <com:...>,  </common_v52_0:...> → </com:...>
      seg = seg.replace(/<common_v52_0/g, "<com")
        .replace(/<\/common_v52_0/g, "</com");

      aInfo.push(seg);
      pos1 = galXml.indexOf(open, pos1 + 1);
    }    
    const res = await uapiGalParse(uapiGalClearXML(galXml.trim()));
    const faultstring = res?.Envelope?.Body?.Fault?.faultstring ?? "";
    const msg = faultstring.trim();
    if (msg !== "") {
      const safeMsg = msg.replace(/'/g, "''");  // SQL용 이스케이프
      await interlineLogSave (pData.pool, {uid: pData.uid , query:safeMsg });
    }
    
    const hostSql  = [];
    let   arrSql   = '';
    let   hostData = "";
    let   fareTL   = "";
    let   Obj      = '';
    let   sqlTmp   = '';
    let   ix       = 0;
    let   sqlQry   = '';
    let   result   = '';
    let   count    = 0;
    Obj  = res?.Envelope?.Body?.AirPriceRsp?.AirPriceResult?.AirPricingSolution.HostToken;
    len  = Obj?.length || 0;
    for (ix = 0 ; ix < len ; ix ++) {
      const tokenObj = Obj[ix];
      const key = tokenObj?.$?.Key ?? "";
      const val = typeof tokenObj === "string" ? tokenObj : tokenObj._ ?? "";
      minor = ix + 1;
      sqlTmp = `('${pData.uid}','${minor}','${key}','${val}')`;
      hostSql.push( sqlTmp );
      hostData += `<com:HostToken Key='${key}'>${val}</com:HostToken>`;
    }
    if (ix > 0) arrSql = `insert into interline_hostToken (uid_minor,minor_num,hostKey,hostToken) values ${hostSql.join(',')} `;
      
    Obj  = res?.Envelope?.Body?.AirPriceRsp?.AirPriceResult?.AirPricingSolution.FareNote;
    len = Obj?.length || 0;
    for (ix = 0 ; ix < len ; ix ++) {
      const note = Obj[ix];
      const text = typeof note === "string" ? note : (note._ ?? "");
      if (/LAST DATE TO PURCHASE TICKET/i.test(text)) {
        const dateStr = text.slice(-7);   // 마지막 7자리 추출
        fareTL = convertDays(dateStr,'A'); // Ted이 이미 구현한 날짜 파싱 함수
      }
    }
    sqlQry = `SELECT COUNT(*) AS cnt FROM interline_hostToken WHERE uid_minor = @uid`;
    result = await pData.pool.request()
      .input('uid', deps.sql.Int, pData.uid)
      .query(sqlQry);
    count = result.recordset[0].cnt ?? 0;
    if (count === 0) await pData.pool.request().query(arrSql);
    Obj                     = Array.isArray(res?.Envelope?.Body?.AirPriceRsp?.AirPriceResult?.AirPricingSolution) ? res?.Envelope?.Body?.AirPriceRsp?.AirPriceResult?.AirPricingSolution : [res?.Envelope?.Body?.AirPriceRsp?.AirPriceResult?.AirPricingSolution] ;
    Key			                = deps.getAttr(Obj[0], 'Key')
    TotalPrice		          = deps.getAttr(Obj[0], 'TotalPrice');
    BasePrice		            = deps.getAttr(Obj[0], 'BasePrice');
    ApproximateTotalPrice	  = deps.getAttr(Obj[0], 'ApproximateTotalPrice');
    ApproximateBasePrice	  = deps.getAttr(Obj[0], 'ApproximateBasePrice');
    Taxes			              = deps.getAttr(Obj[0], 'Taxes');
    Fees			              = deps.getAttr(Obj[0], 'Fees');
    ApproximateTaxes	      = deps.getAttr(Obj[0], 'ApproximateTaxes');
    QuoteDate		            = deps.getAttr(Obj[0], 'QuoteDate');

    const infos = Array.isArray(Obj[0]?.AirPricingInfo) ? Obj[0].AirPricingInfo : (Obj[0]?.AirPricingInfo ? [Obj[0].AirPricingInfo] : []);
    const aTotal = {};
    for (ix = 0; ix < infos.length; ix++) {
      const info = infos[ix];
  
      const price = deps.StrClear(deps.getAttr(info, 'ApproximateTotalPrice'));
  
      // 2025-08-22 구조: PassengerType["Code"] 우선
      const pt = Array.isArray(info?.PassengerType) ? info.PassengerType[0] : info?.PassengerType;
      const PassengerTypeCode =
        deps.getAttr(pt, 'Code') ||              // 권장 (신 구조)
        deps.getAttr(info, 'PassengerTypeCode'); // 예외적 fallback
  
      if (PassengerTypeCode && price) {
        aTotal[`${PassengerTypeCode}${price}`] = ix;
      }
    }
    const attKeyArray = [
      'Key','Group','Carrier','FlightNumber','ProviderCode','Origin','Destination',
      'DepartureTime','ArrivalTime','FlightTime','TravelTime','Distance','ClassOfService',
      'Equipment','ChangeOfPlane','OptionalServicesIndicator','AvailabilitySource',
      'ParticipantLevel','LinkAvailability','PolledAvailabilityOption','AvailabilityDisplayType'
    ];

    const itinerary = res.Envelope.Body?.AirPriceRsp?.AirItinerary;
    const rawSegs   = itinerary?.AirSegment;
    const segs      = Array.isArray(rawSegs) ? rawSegs : (rawSegs ? [rawSegs] : []);

    let airData = '';
    for (ix = 0; ix < segs.length; ix++) {
      const seg = segs[ix];

      // PHP: $sub .= " $key='$Obj2[$key]' ";
      // => Node: 속성 존재/부재와 무관하게 키를 모두 출력(부재 시 '')
      const parts = attKeyArray.map(key => {
        const val = deps.getAttr(seg, key) ?? '';
        return `${key}='${val}'`;
      });
      const sub = parts.length ? ` ${parts.join(' ')} ` : ' ';

      // PHP: 같은 Group이면 현재 세그먼트 안에 <air:Connection/> 추가
      const sameGroup =
        Array.isArray(pData?.Group) &&
        pData.Group[ix] != null &&
        pData.Group[ix + 1] != null &&
        String(pData.Group[ix]) === String(pData.Group[ix + 1]);

      const addConn = sameGroup ? '<air:Connection/>' : '';

      airData += `<air:AirSegment${sub}> ${addConn}\n</air:AirSegment>`;

    }

    let priceInfoData = "";
		let fChk          = "";
    let addAccData    = '';
		let pCnt          = 1;
		accCode           = res?.Envelope?.Body?.AirPriceRsp?.AirPriceResult?.AirPricingSolution?.AirPricingInfo?.FareInfo?.[0]?.AccountCode?.$?.Code || '';
    for (let idx = 0; idx < (pData.GUBUNGAL?.length || 0); idx++) {
      const val = pData.GUBUNGAL[idx];
      let adtType  = 'ADT';
      let adtType2 = 'ADT';
      let addPtc   = '';
      if ((sGrade || '').length > 1) {
        adtType    = sGrade;
        adtType2   = sGrade;
        if (sGrade === 'LBR') {
          addPtc   = '';   
          adtType  = 'ADT';
          adtType2 = 'LBR';
        } else {
          addPtc   = ' PricePTCOnly="true"';
        }
      }
      if (accCode && accCode !== '') {
        accCode = `<air:AccountCodes><com:AccountCode Code='${accCode}' /></air:AccountCodes>`;
      }
      let name  = '';
      let name2 = '';
      if (val === 'ADT') {
        name  = `${adtType}${pData.AdultFare ?? ''}`;
        name2 = `${adtType2}${pData.AdultFare ?? ''}`;
      }
      //console.log(aTotal)
      // 첫 루프에서 priceData 가공
      let priceData = '';
      if (!fChk) {
        priceData = aInfo?.[aTotal?.[name]] ?? '';
        if ((!priceData || priceData === '') && name2) {
          priceData = aInfo?.[aTotal?.[name2]] ?? '';
        }
        if (priceData) {
          priceData = priceData.replace(
            'air:AirPricingInfo Key',
            "air:AirPricingInfo AirPricingInfoGroup='1' Key"
          );
        }
        fChk = 'Y';
      }
      if (val === 'ADT' && priceData) {
        const needle = `<air:PassengerType Code="${adtType2}"${addPtc}/>`;
        const parts = priceData.split(needle); // PHP explode 동일
  
        let newData = parts[0] ?? '';
        for (let i = 1; i < parts.length; i++) {
          newData += `<air:PassengerType BookingTravelerRef="${pCnt}" Code="${adtType2}"${addPtc}/>` + parts[i];
          pCnt++;
        }
        priceInfoData += newData;
      }
      break;
    }
    for (let idx = 0; idx < (pData.GUBUNGAL?.length || 0); idx++) {
      const val = pData.GUBUNGAL[idx];
      if (val === "CNN") {
        if (sGrade === "VFR") {
          chdType    = "VFN";
					addAccData = `<air:PassengerType Code="VFR" AccompaniedPassenger="true"/>`;
        } else {
          chdType    = "CNN";
          addAccData = '';
        }
        name  = `${chdType}${pData.ChildFare ?? ''}`;
        if (!fChk) {
          priceData = aInfo?.[aTotal?.[name]] ?? '';
          if (priceData) {
            priceData = priceData.replace(
              'air:AirPricingInfo Key',
              "air:AirPricingInfo AirPricingInfoGroup='3' Key"
            );
          }
          fChk = 'Y';
        }
        age = "10";
        const needle = `<air:PassengerType Code="${chdType}" Age="${age}"${addPtc}/>`;
        const parts  = priceData.split(needle);
        const len    = parts.length;
        let newData = parts[0] ?? '';
        for (let ix = 1; ix < len; ix++) {
          newData += `<air:PassengerType BookingTravelerRef="${pCnt}" Age="${age}" Code="${chdType}"${addPtc}/>`
                  + addAccData
                  + parts[ix];
          pCnt++;
        }
        priceInfoData += newData;
        break;
      }
    }
    fChk = '';
    for (let idx = 0; idx < (pData.GUBUNGAL?.length || 0); idx++) {
      const val = pData.GUBUNGAL[idx];
      if (val === "INF") {
        infType = 'INF';
        if (sGrade === 'VFR') {
          infType = 'VFF';
          addAccData = '<air:PassengerType Code="VFR" AccompaniedPassenger="true"/>';
        } else {
          infType = 'INF';
          addAccData = '';
        }
        name = `${infType}${infantFare}`;
        if (!fChk) {
          const idx = aTotal?.[name];
          priceData = aInfo?.[idx] || '';
          if (priceData) {
            priceData = priceData.replace(
              'air:AirPricingInfo Key',
              "air:AirPricingInfo AirPricingInfoGroup='2' Key"
            );
          }
          fChk = 'Y';
        }
        age = 1;
        const needle = `<air:PassengerType Code="${infType}" Age="${age}"${addPtc}/>`;
        const parts  = (priceData || '').split(needle);
        const len    = parts.length;
        let newData  = parts[0] ?? '';
        for (let ix = 1; ix < len ; ix++) {
          newData += `<air:PassengerType BookingTravelerRef="${pCnt}" Age="${age}" Code="${infType}"${addPtc}/>`
                   + addAccData
                   + parts[ix];
          pCnt++;
        }
    
        priceInfoData += newData;
        break;
      }
    }

    if (accCode && accCode !== '') {
      priceInfoData = priceInfoData.replace(
        '<air:BaggageAllowances>',
        `<air:AirPricingModifiers FaresIndicator="AllFares">${accCode}</air:AirPricingModifiers><air:BaggageAllowances>`
      );
    }

    //console.log(priceInfoData)

    pData.AirPricingSolution = `
      <air:AirPricingSolution
        Key="${Key}"
        TotalPrice="${TotalPrice}"
        BasePrice="${BasePrice}"
        ApproximateTotalPrice="${ApproximateTotalPrice}"
        ApproximateBasePrice="${ApproximateBasePrice}"
        Taxes="${Taxes}"
        Fees="${Fees}"
        ApproximateTaxes="${ApproximateTaxes}"
        QuoteDate="${QuoteDate}">
        ${airData || ''}
        ${priceInfoData || ''}
        ${hostData || ''}
      </air:AirPricingSolution>
    `;

    let dep_tel = pData.DEPTEL;
    let Email   = pData.Email;
    len = pData?.PAX?.length ?? 0;
    const paxArray = {};
    let CTCM = '';
    for (let ix = 0; ix < len; ix++) {
      const pCnt  = ix + 1;
      const sex   = pData?.SEX?.[ix] ?? '';
      let   title = pData?.GUBUNGAL?.[ix] ?? '';
      if (sGrade === 'VFR') {
        if (title === 'ADT')      title = sGrade; 
        else if (title === 'CNN') title = 'VFR';
        else if (title === 'INF') title = 'VFF';
      } else if (sGrade === 'LBR') {
        if (title === 'ADT') title = sGrade; 
        else if (title === 'CNN') title = 'CNN';
        else if (title === 'INF') title = 'INF';
      }
      const fullName = String(pData?.PAX?.[ix] ?? '');
      const [last = '', first = ''] = fullName.split('/');
      let birthday = pData?.BIRTH2?.[ix] ?? '';
      if (!birthday) birthday = '19801212';
      const age = String(calculateAge(birthday)).padStart(2, '0');
      const apis = pData?.APIS?.[ix] ?? '';
      const DOCS = apis ? `<com:SSR Carrier="YY" FreeText="${apis}" Type="DOCS" />` : '';
      let PHONE = '';
      let SSR   = '';
      let CTCE  = '';
      if (ix === 0) {
        SSR     = `<com:SSR Type="CTCM" Status="HK" FreeText="${dep_tel}" Carrier="YY"/>`;
        PHONE   = `<com:PhoneNumber  Number="${dep_tel}" Text="CLIENT CONNECT"/>`;
        if (Email) {
          CTCE  = `<com:SSR Type="CTCE" Status="HK" FreeText="${Email}" Carrier="YY"/>`;
        }
      } else {
        SSR     = `<com:SSR Type="CTCM" Status="HK" FreeText="${dep_tel}" Carrier="YY"/>`;
      }
      const foreign = pData?.Foreign
        ? `<com:SSR Carrier="YY" FreeText="${pData.Foreign}" Type="DOCA" />`
        : '';
      let NameRemark = '';
      if (title === 'CNN' || title === 'VFN') {
        NameRemark = `<com:NameRemark><com:RemarkData>P-C${age} DOB${pData?.BIRTH?.[ix]}</com:RemarkData></com:NameRemark>`;
      } else if (title === 'INF' || title === 'VFF') {
        NameRemark = `<com:NameRemark><com:RemarkData>${Data?.BIRTH?.[ix]}</com:RemarkData></com:NameRemark>`;
      }
      const spc = pData?.AIR === 'TG' ? ' ' : '';
      let gender = arrTitleChange[sex];
      if (sGrade === 'LBR' && pData?.AIR === 'CZ' && (sex === 'M' || sex === 'F')) gender = ' DL';
      const travelerXML = `
        <com:BookingTraveler DOB="${deps.cutDate(birthday)}" Gender="${String(sex).slice(0, 1)}" Key="${pCnt}" TravelerType="${title}">
          <com:BookingTravelerName First="${first}" Last="${last}" Prefix="${spc + gender}" /> 
          ${PHONE}
          ${SSR}
          ${CTCE}
          ${DOCS}
          ${foreign}
          ${NameRemark}
        </com:BookingTraveler>
      `;
      paxArray[title] = (paxArray[title] || '') + travelerXML;
    }
    const { VFR = '', ADT = '', LBR = '', VFF = '', INF = '', LIF = '', VFN = '', CNN = '', LNN = '' } = paxArray || {};
    const pax = VFR + ADT + LBR + VFF + INF + LIF + VFN + CNN + LNN;
    CTCM = `<com:OSI Carrier="YY" Text="${pData.CTCM}" ProviderCode="1G"/>`;
    if (Email) CTCM += `<com:OSI Carrier="YY" Text="${Email}" ProviderCode="1G"/>`;

    const XML2 = `
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:univ="http://www.travelport.com/schema/universal_v52_0" xmlns:air="http://www.travelport.com/schema/air_v52_0" xmlns:com="http://www.travelport.com/schema/common_v52_0">
      <soapenv:Body>
        <univ:AirCreateReservationReq RetainReservation="Schedule" TargetBranch="${pData.Branch}" TraceId="${pData.TraceId}" RestrictWaitlist="true" AuthorizedBy="UAPIAVIA">
          <com:BillingPointOfSaleInfo OriginApplication="UAPI"/> 
          ${pax}
          ${CTCM}
          <com:AccountingRemark Key="ar01" Category="FT" TypeInGds="Other" ProviderCode="1G">
            <com:RemarkData>00JIAQIANG/SYSTICKET/361T///</com:RemarkData>
          </com:AccountingRemark>
          <com:ContinuityCheckOverride>yes</com:ContinuityCheckOverride>
          <com:AgencyContactInfo>
            <com:PhoneNumber Type="Agency" CountryCode="82" Number="${pData.AGTTEL}" Text="${pData.AGTNAME}"></com:PhoneNumber>
          </com:AgencyContactInfo>
          ${pData.AirPricingSolution}
          <com:ActionStatus Type="ACTIVE" TicketDate="T*" ProviderCode="1G">
            <com:Remark></com:Remark>
          </com:ActionStatus>
        </univ:AirCreateReservationReq>
      </soapenv:Body>
    </soapenv:Envelope>
    `;
    //console.log(XML2)
    galXml = await uapiGalQuery ('AirService',XML2); // 작업 완료후 제거
    const res2 = await uapiGalParse(uapiGalClearXML(galXml.trim()));
    const RecLoc = res2?.Envelope?.Body?.AirCreateReservationRsp?.UniversalRecord?.ProviderReservationInfo?.$?.LocatorCode || '';
    const pnr = RecLoc;
    let faultstring2 = res2?.Envelope?.Body?.Fault?.faultstring ?? "";
    let errMsg = '';
    if (faultstring2) {
      await interlineLogSave (pData.pool, {uid: pData.uid , query:faultstring2 });
      const Obj = res2?.Envelope?.Body?.Fault?.detail?.AvailabilityErrorInfo?.AirSegmentError ?? [];
      const errors = Array.isArray(Obj) ? Obj : [Obj];
      const attr = (seg, key) => seg?.[key] ?? seg?.$?.[key] ?? '';
      for (let ix = 0; ix < errors.length; ix += 1) {
        const seg = errors[ix]?.AirSegment ?? {};
        const Carrier        = attr(seg, 'Carrier');
        const FlightNumber   = attr(seg, 'FlightNumber');
        const Origin         = attr(seg, 'Origin');
        const Destination    = attr(seg, 'Destination');
        const ClassOfService = attr(seg, 'ClassOfService');
        const ErrorMessage   = errors[ix]?.ErrorMessage ?? '';

        errMsg += `
          ${Carrier} ${FlightNumber} ${Origin} ${Destination} ${ClassOfService} <br>
          ${ErrorMessage} <br>
        `;
      }
      faultstring2 += `<br>${errMsg.replace(/<br>/g,'')}`;
      if (errMsg) await interlineLogSave (pData.pool, {uid: pData.uid , query:errMsg });
    }
    
    //console.log(errMsg)
    return [RecLoc , faultstring2];
}

async function  uapiGalPnrRetrieve (pData) {

  const XML = `
  <soapenv:Envelope xmlns:soapenv='http://schemas.xmlsoap.org/soap/envelope/' xmlns:univ='http://www.travelport.com/schema/universal_v52_0' xmlns:com='http://www.travelport.com/schema/common_v52_0' >
    <soapenv:Header>
      <univ:SupportedVersions/>
    </soapenv:Header>
    <soapenv:Body>
      <univ:UniversalRecordRetrieveReq TraceId="${pData.TraceId}" TargetBranch="${pData.Branch}"  RetrieveProviderReservationDetails='true' ViewOnlyInd='false' AuthorizedBy='UAPIAVIA'>
      <com:BillingPointOfSaleInfo OriginApplication='UAPI'/>
      <univ:ProviderReservationInfo ProviderCode='1G' ProviderLocatorCode="${pData.RecLoc}" />
      </univ:UniversalRecordRetrieveReq>
    </soapenv:Body>
  </soapenv:Envelope>
  `;

  galXml = await uapiGalQuery ('UniversalRecordService',XML);
	return uapiGalClearXML(galXml);
}

function galBuildOneData(aTotalSeg) {
  const oneData = {};
  const adtSeg = aTotalSeg['ADT'] || {};

  for (const [priceKey, aGroup] of Object.entries(adtSeg)) {
    for (const [groupKey, mainSegData] of Object.entries(aGroup)) {
      for (const [segKey, mainShareData] of Object.entries(mainSegData)) {
        const len = mainShareData.length;

        for (let ix = 0; ix < len; ix++) {
          let lowData = mainShareData[ix];

          let {
            minor_num3,shareCnt,ApproximateTotalPrice,ApproximateBasePrice,ApproximateTaxes,BookingCode,BookingCount,Carrier,FlightNumber,
            DepartureTime,ArrivalTime,Origin,Destination,NumberOfPieces,MaxWeight
          } = lowData;

          BookingCode   = (BookingCode   || '').trim();
          BookingCount  = (BookingCount  || '').trim();
          Carrier       = (Carrier       || '').trim();
          FlightNumber  = (FlightNumber  || '').trim();
          Origin        = (Origin        || '').trim();
          Destination   = (Destination   || '').trim();

          const main =
            `//${ApproximateBasePrice}` +
            `//${Carrier}` +
            `//${FlightNumber}` +
            `//${BookingCode}` +
            `//${BookingCount}` +
            `//${ApproximateTaxes}` +
            `//${DepartureTime}` +
            `//${ArrivalTime}` +
            `//${Origin}` +
            `//${Destination}` +
            `//${NumberOfPieces}` +
            `//${MaxWeight}`;

          const date = deps.StrClear(DepartureTime).slice(0, 8);

          let sub = '';
          let share = '';

          if (len > 1) {
            // PHP처럼 ix를 한 번 더 증가시켜서 짝으로 처리
            ix++;
            if (ix < len) {
              lowData = mainShareData[ix];

              let {
                minor_num3,shareCnt,ApproximateTotalPrice,BookingCode,BookingCount,Carrier,FlightNumber,DepartureTime,ArrivalTime,Origin,Destination,umberOfPieces,MaxWeight
              } = lowData;

              BookingCode   = (BookingCode   || '').trim();
              BookingCount  = (BookingCount  || '').trim();
              Carrier       = (Carrier       || '').trim();
              FlightNumber  = (FlightNumber  || '').trim();
              Origin        = (Origin        || '').trim();
              Destination   = (Destination   || '').trim();

              sub =
                `||${Carrier}` +
                `//${FlightNumber}` +
                `//${BookingCode}` +
                `//${BookingCount}` +
                `//${DepartureTime}` +
                `//${ArrivalTime}` +
                `//${Origin}` +
                `//${Destination}` +
                `//${NumberOfPieces}` +
                `//${MaxWeight}`;

              share = '경유';
            }
          } else {
            sub = '';
            share = '직항';
          }

          if (!oneData[date]) oneData[date] = [];
          oneData[date].push(share + main + sub);
        }
      }
    }
  }

  return oneData;
}

function uapiGalLogSave (logdata,type='') {
    const nows    = deps.getNow().NOWS;
    const nowStr  = deps.getNow().NOWSTIME;
    const logFile = `../admin/Logs/${nows}_GalieoRqRs.txt`;
    const logData = `[${nowStr}]\r\n${logdata}\r\n\r\n`;
    fs.appendFileSync(logFile, logData);
}

module.exports = {
    createHeader,
    newTraceID,
    uapiGalSearch,
    uapiGalAirPrice,
    uapiGalPnrRetrieve,
    uapiGalClearXML,
    uapiGalGetToken,
    uapiGalEndToken,
    uapiGalTerminal,
    uapiGalParse,
    uapiGalRuleSearch,
    galBuildOneData
};