const fs     = require('fs');
const path   = require('path');
const axios  = require('axios');
const xml2js = require('xml2js');
const { XMLParser } = require('fast-xml-parser');
const deps   = require('../../src/common/dependencies');
const https  = require('https');
const agent  = new https.Agent({ rejectUnauthorized: false }); // SSL 인증서 검증 안 함


class SWSWebService {
    constructor(from = 'awc.abacus.com.sg', username, password, ipcc, system = 'https://webservices.platform.sabre.com/websvc', mode = '' , client_id = '' , client_passwd = '') {
      this.from = from;
      this.username = username;
      this.password = password;
      this.ipcc = ipcc;
      this.system = system;
      this.mode = mode;
      this.token = '';
      this.cid = '';
      this.client_id      = client_id;
      this.client_passwd  = client_passwd;
      this.conversationId = `${Date.now()}@oye.co.kr`;
    }
  
    async SessionCreate() {
        const payload = `<SessionCreateRQ><POS><Source PseudoCityCode='${this.ipcc}' /></POS></SessionCreateRQ>`;
        const xml = this.buildEnvelope('SessionCreateRQ', payload, 'SabreXML', 'Session');
        const response = await this.sendSoap(xml);
        const tokens = this.extractBinaryToken(response);
        const token = tokens['#text'];
        this.token = token;
        return token;
    }
  
    async Execute(action, payload, ebType, ebService) {
      if (!this.token) await this.SessionCreate();
      const xml = this.buildEnvelope(action, payload, ebType, ebService);
      const response  = await this.sendSoap(xml);
      return this.extractSoapBody(response);
    }
  
    buildEnvelope(action, payload, ebType, ebService) {
      const timestamp = new Date().toISOString();
      const securityHeader = action === 'SessionCreateRQ'
        ? `<wsse:UsernameToken><wsse:Username>${this.username}</wsse:Username><wsse:Password>${this.password}</wsse:Password><Organization>${this.ipcc}</Organization>
            ${this.client_id ? `<Domain>AA</Domain><ClientId>${this.client_id}</ClientId><ClientSecret>${this.client_passwd}</ClientSecret>` : '<Domain>Default</Domain>'}
          </wsse:UsernameToken>`
        : `<wsse:BinarySecurityToken>${this.token}</wsse:BinarySecurityToken>`;
  
      return `<?xml version='1.0' encoding='utf-8'?>
        <soap-env:Envelope xmlns:soap-env='http://schemas.xmlsoap.org/soap/envelope/'>
            <soap-env:Header>
            <eb:MessageHeader xmlns:eb='http://www.ebxml.org/namespaces/messageHeader'>
                <eb:From><eb:PartyId eb:type='urn:x12.org.IO5:01'>${this.from}</eb:PartyId></eb:From>
                <eb:To><eb:PartyId eb:type='urn:x12.org.IO5:01'>webservices.sabre.com</eb:PartyId></eb:To>
                <eb:ConversationId>${this.conversationId}</eb:ConversationId>
                <eb:Service eb:type='${ebType}'>${ebService}</eb:Service>
                <eb:Action>${action}</eb:Action>
                <eb:CPAID>${this.ipcc}</eb:CPAID>
                <eb:MessageData>
                <eb:MessageId>mid:${Date.now()}${this.from}</eb:MessageId>
                <eb:Timestamp>${timestamp}</eb:Timestamp>
                <eb:TimeToLive>${timestamp}</eb:TimeToLive>
                </eb:MessageData>
            </eb:MessageHeader>
            <wsse:Security xmlns:wsse='http://schemas.xmlsoap.org/ws/2002/12/secext'>
                ${securityHeader}
            </wsse:Security>
            </soap-env:Header>
            <soap-env:Body>${payload}</soap-env:Body>
        </soap-env:Envelope>
        `;
    }
  
    async sendSoap(xml) {
      try {
        const response = await axios.post(this.system, xml, {
          headers: {
            'Content-Type': 'text/xml;charset=utf-8',
            'Content-Length': xml.length,
          },
          timeout: 10000,
        });
        return response.data;
        //return this.extractSoapBody(response.data);
      } catch (err) {
        console.error('SOAP 통신 실패:', err.message);
        throw err;
      }
    }
  
    extractBinaryToken(xml) {
      const parser = new XMLParser({ ignoreAttributes: false });
      const json = parser.parse(xml);
      return json['soap-env:Envelope']?.['soap-env:Header']?.['wsse:Security']?.['wsse:BinarySecurityToken'] || '';
    }
  
    async extractSoapBody(xml) {
      const parser = new XMLParser({ ignoreAttributes: false });
      const json = parser.parse(xml);
      return json['soap-env:Envelope']?.['soap-env:Body'] || null;
    }
  
    // 샘플 유틸: PNR 조회
    getPnrXml(pnr) {
      return `<OTA_TravelItineraryReadRQ xmlns='http://webservices.sabre.com/sabreXML/2003/07' Version='1.15.1'>
        <POS><Source PseudoCityCode='${this.ipcc}' /></POS>
        <UniqueID ID='${pnr}' />
      </OTA_TravelItineraryReadRQ>`;
    }
  
    // 샘플 유틸: Host Command
    getHostCommandXml(command) {
      return `<SabreCommandLLSRQ xmlns='http://webservices.sabre.com/sabreXML/2011/10' Version='2.0.0'>
        <Request Output='SCREEN' CDATA='true'><HostCommand>${command}</HostCommand></Request>
      </SabreCommandLLSRQ>`;
    }


    getPassengerXml(pData) {
        const paxTypes = [
          { code: 'ADT', count: pData.adt },   // 성인
          { code: 'C10', count: pData.chd },   // 소아
          { code: 'C05', count: pData.kid },   // 유아 (좌석O)
          { code: 'INF', count: pData.inf }    // 유아 (좌석X)
        ];
      
        let index = 1;
        let xml = '';
      
        for (const pax of paxTypes) {
          if (pax.count > 0) {
            xml += `
              <PassengerTypeQuantity Index='${index}' Code='${pax.code}' Quantity='${pax.count}'>
                <TPA_Extensions>
                  <VoluntaryChanges Match='Info' />
                </TPA_Extensions>
              </PassengerTypeQuantity>`;
            index++;
          }
        }
      
        return xml.trim();
    }

    buildSearchXml(pData) {
        const cabinMap = { Y: 'Economy', P: 'PremiumEconomy', C: 'Business', F: 'First' };
    
        let TripType = 'OneWay';
        //console.log(pData);
        let cabinPref1 = pData.airCabin1 ? cabinMap[pData.airCabin1] : cabinMap[pData.grade];
        let cabinPref2 = pData.airCabin2 ? cabinMap[pData.airCabin2] : cabinMap[pData.grade];
        const maxConnectionTime = pData.MaxShareTime ? `${pData.MaxShareTime}00` : '0';
    
        const connectionLocations = (pData.cityLike || '').split('/').filter(Boolean)
          .map(code => `<ConnectionLocation LocationCode='${code}' PreferLevel='Only' />`).join('\n');
        const airLike = pData.airLike || '';
        let  vendorPref = '';
        if (airLike) {
          vendorPref = (airLike || '').split('/').filter(Boolean)
            .map(code => `<VendorPref Type='Marketing' PreferLevel='Preferred' Code='${code}' />`).join('\n') ||
            `<VendorPref Type='Marketing' PreferLevel='Preferred' Code='YY' />`;
        
        } else {
          vendorPref = `
              <VendorPref Type='Marketing' PreferLevel='Preferred' Code='OZ' />
              <VendorPref Type='Marketing' PreferLevel='Preferred' Code='BX' />
              <VendorPref Type='Marketing' PreferLevel='Preferred' Code='RS' />
          `;
        }
        const stopoverXml = pData.stopover === 'Y'
          ? `<FlightTypePref MaxConnections='0' />`
          : `<FlightTypePref MaxConnections='1' />`;
    
        const depDate1 = deps.cutDate(pData.departure_date) + 'T00:00:00';
        const depDate2 = pData.arrive_date ? deps.cutDate(pData.arrive_date) + 'T00:00:00' : '';
    
        if (pData.ticket_type === '2') TripType = 'Return';
        else if (pData.ticket_type === '3') TripType = 'Circle';
    
        const origin1 = `<OriginDestinationInformation RPH="1">
            <DepartureDateTime>${depDate1}</DepartureDateTime>
            <OriginLocation LocationCode="${pData.departure}" />
            <DestinationLocation LocationCode="${pData.arrive}" />
            ${connectionLocations ? `<ConnectionLocations>${connectionLocations}</ConnectionLocations>` : ''}
            <TPA_Extensions>
              <CabinPref Cabin="${cabinPref1}" PreferLevel="Only" />
              <ConnectionTime Max="${maxConnectionTime}" />
            </TPA_Extensions>
          </OriginDestinationInformation>`;
    
        const origin2 = TripType === 'Return' ? `<OriginDestinationInformation RPH="2">
            <DepartureDateTime>${depDate2}</DepartureDateTime>
            <OriginLocation LocationCode="${pData.arrive}" />
            <DestinationLocation LocationCode="${pData.departure}" />
            <TPA_Extensions>
              <CabinPref Cabin="${cabinPref2}" PreferLevel="Only" />
              <ConnectionTime Max="${maxConnectionTime}" />
            </TPA_Extensions>
          </OriginDestinationInformation>` : '';
    
        const paxXml = this.getPassengerXml(pData);
    
        return `<OTA_AirLowFareSearchRQ xmlns="http://www.opentravel.org/OTA/2003/05" ResponseType="OTA" ResponseVersion="6.6.0" Target="Production" Version="6.6.0">
          <POS>
            <Source PseudoCityCode="${this.ipcc}">
              <RequestorID Type="1" ID="1">
                <CompanyName Code="TN" />
              </RequestorID>
            </Source>
          </POS>
          ${origin1}
          ${origin2}
          <TravelPreferences ValidInterlineTicket="true">
            ${vendorPref}
            ${stopoverXml}
            <TPA_Extensions>
              <TripType Value="${TripType}" />
              <JumpCabinLogic Disabled="true" />
              <KeepSameCabin Enabled="false" />
              <ExcludeCallDirectCarriers Enabled="true" />
              <DiversityParameters AdditionalNonStopsPercentage="100" />
            </TPA_Extensions>
            <Baggage RequestType="A" Description="false" />
          </TravelPreferences>
          <TravelerInfoSummary>
            <AirTravelerAvail>${paxXml}</AirTravelerAvail>
            <PriceRequestInformation CurrencyCode="KRW" />
          </TravelerInfoSummary>
          <TPA_Extensions>
            <IntelliSellTransaction>
              <RequestType Name="100ITINS" />
            </IntelliSellTransaction>
          </TPA_Extensions>
        </OTA_AirLowFareSearchRQ>`;
      }
}

async function extractSoapBodyNew (xml) {
    const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true });
    const result = await parser.parseStringPromise(xml);

    let body = '';
    body = result['SOAP-ENV:Envelope']?.['SOAP-ENV:Body'];
    if (!body) body = result['soap-env:Envelope']?.['soap-env:Body'];
    if (!body) throw new Error('SOAP Body not found');

    //Body 하위 첫 번째 key 꺼내기
    const mainTagName = Object.keys(body)[0];
    const mainContent = body[mainTagName];
    return mainContent;
}

async function sessionOnAbacus(BOOKING_MODE = '') {
    //const uid = global.uid || '';  // 필요 시 매개변수로 넘기는 것도 가능
    //const bspSiteCode = process.env.BSP_SITE_CODE || 'OY00170';
    //const loginGroup = process.env.LOGIN_GROUP || ''; // 로그인 그룹 추적
  
    const uid         = '';
    const bspSiteCode = 'OY00170';
    const loginGroup  = '';

    if (uid !== '') {
      const query = `IATA Mode : ${bspSiteCode}`;
      await interlineLogSave(uid, query, oye_login_id, BOOKING_MODE);
    }
  
    let service;
    const wsUrl = 'https://webservices.platform.sabre.com/websvc';
  
    if (bspSiteCode === 'OY01299' || loginGroup === 'UNITED') {
      service = new SWSWebService('changys8@naver.com', '720590', 'WS720590', 'QC3L', wsUrl, BOOKING_MODE,"","");
    } else if (bspSiteCode === 'OY00170') {
      service = new SWSWebService('changys8@naver.com', '503427', 'LMH85360', 'C4KL', wsUrl, BOOKING_MODE,"SC58-ClientIDReque","LkbK30R0");
    } else {
      service = new SWSWebService('changys8@naver.com', '537940', 'WS537940', '5EQ8', wsUrl, BOOKING_MODE,"","");
    }
  
    await service.SessionCreate(); // 실제 로그인 호출
    return service;
}

async function uapiSabreSave (result) {
    //const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true, explicitRoot: false });
    //const result = await parser.parseStringPromise(xml);
    const PricedItineraries = result.PricedItineraries;
    const PricedItinerary   = PricedItineraries?.PricedItinerary;

    const Warnings = result.Warnings;
    let TransactionId = '';

    if (Warnings && Warnings.Warning) {
        const warnings = Array.isArray(Warnings.Warning) ? Warnings.Warning : [Warnings.Warning];

        for (const warning of warnings) {
            const { type, Code, MessageClass, ShortText } = warning;
            if (Code === 'TRANSACTIONID') {
                TransactionId = ShortText;
                break;
            }
        }
    }
    
    const aSql = {
        HubFlightSegment: [],
        HubItinTotalFare: [],
        HubFareBasisCode: [],
        HubPassengerFare: [],
        HubBaggageInformation: [],
        HubSeats: []
    };

    let arrSqlTable = [];
    arrSqlTable["HubFlightSegment"]            = `TransactionId,SequenceNumber,minor_num,minor_num1,minor_num2,ElapsedTime,DepartureCountry,ArrivalCountry,DepartureDateTime,ArrivalDateTime,StopQuantity,FlightNumber,ResBookDesigCode,FlightSegmentElapsedTime,DepartureAirportLocationCode,DepartureAirportTerminalID,ArrivalAirportLocationCode,ArrivalAirportTerminalID,OperatingAirlineCode,OperatingAirlineFlightNumber,MarketingAirlineCode,DepartureTimeZoneGMTOffset,ArrivalTimeZoneGMTOffset,eTicketInd,MileageAmount,AirEquipType,NumberOfStops,StopAirportLocationCode`;
    arrSqlTable["HubItinTotalFare"]            = `TransactionId,SequenceNumber,PricingSource,PricingSubSource,FareReturned,BaseFareAmount,BaseFareCurrencyCode,BaseFareDecimalPlaces,FareConstructionAmount,FareConstructionCurrencyCode,FareConstructionDecimalPlaces,EquivFareAmount,EquivFareCurrencyCode,EquivFareDecimalPlaces,TotalFareAmount,TotalFareCurrencyCode,TotalFareDecimalPlaces,TaxesAmount,TaxesCurrencyCode,TaxesDecimalPlaces`;
    arrSqlTable["HubFareBasisCode"]            = `TransactionId,SequenceNumber,minor_num,PassengerTypeQuantityCode,PassengerTypeQuantityQuantity,FareBasisCode,AvailabilityBreak,DepartureAirportCode,ArrivalAirportCode,FareComponentBeginAirport,FareComponentEndAirport,FareComponentDirectionality,FareComponentVendorCode,FareComponentFareTypeBitmap,FareComponentFareType,FareComponentFareTariff,FareComponentFareRule,FareComponentCabinCode,GovCarrier`;
    arrSqlTable["HubPassengerFare"]            = `TransactionId,SequenceNumber,PassengerTypeQuantityCode,PassengerTypeQuantityQuantity,PassengerFareAmount,PassengerFareCurrencyCode,FareConstructionAmount,FareConstructionCurrencyCode,EquivFareAmount,EquivFareCurrencyCode,PassengerFareTotalFareAmount,PassengerFareTotalFareCurrencyCode,PassengerTotalTaxAmount,PassengerTotalTaxCurrencyCode,PassengerTotalTaxDecimalPlaces`;
    arrSqlTable["HubBaggageInformation"]       = `TransactionId,SequenceNumber,minor_num,PassengerTypeQuantityCode,BaggageInformationProvisionType,BaggageInformationAirlineCode,AllowanceWeight,AllowanceUnit,AllowancePieces`;
    arrSqlTable["HubSeats"]                    = `TransactionId,SequenceNumber,minor_num,FareReference,SeatsRemainingNumber,SeatsRemainingBelowMin,Cabin,Meal`;
    if(TransactionId){
      const len = PricedItineraries.PricedItinerary.length;
        let itineraries = PricedItineraries?.PricedItinerary || [];
        if (!Array.isArray(itineraries)) {
            itineraries = [itineraries];  // 단일 객체를 배열로 변환
        }
        
        let ix = 0 ;
        for (const PricedItinerary of itineraries) {
        
            //PricedItinerary = itineraries[ix];
            SequenceNumber	= PricedItinerary["SequenceNumber"];
            
            let option = PricedItinerary.AirItinerary.OriginDestinationOptions.OriginDestinationOption;
            if (!Array.isArray(option)) {
              option = [option]; // 1개일 경우 배열로 변환
            }
            let minor_num  = 0;
            let minor_num1 = 0;
            for (const OriginDestinationOption of option) {
                minor_num ++;
                const ElapsedTime			      = OriginDestinationOption.ElapsedTime; //비행시간
				        const DepartureCountry	    = OriginDestinationOption.DepartureCountry; //출발국가
				        const ArrivalCountry		    = OriginDestinationOption.ArrivalCountry; //도착국가
                
                let Flight                  = OriginDestinationOption.FlightSegment;
                if (!Array.isArray(Flight)) {
                    Flight = [Flight]; // 1개일 경우 배열로 변환
                  }
                  let minor_num2 = 0;
                  for (const FlightSegment of Flight) {
                    minor_num1 ++; 
                    minor_num2 ++; 
                    const DepartureDateTime						= FlightSegment.DepartureDateTime; //출발시간
                    const ArrivalDateTime						  = FlightSegment.ArrivalDateTime; //도착시간
                    const StopQuantity							  = FlightSegment.StopQuantity; // 경유수?
                    const FlightNumber							  = FlightSegment.FlightNumber; // 편수
                    const ResBookDesigCode						= FlightSegment.ResBookDesigCode; // 클래스
                    const FlightSegmentElapsedTime		= FlightSegment.ElapsedTime; // 비행시간
                    
                    const DepartureAirport						  = FlightSegment.DepartureAirport;
                    const DepartureAirportLocationCode	= DepartureAirport.LocationCode; //츨빌지
                    const DepartureAirportTerminalID		= DepartureAirport?.TerminalID || ''; //출발 터미널

                    const ArrivalAirport 						    = FlightSegment.ArrivalAirport ;
                    const ArrivalAirportLocationCode		= ArrivalAirport.LocationCode; //도착지
                    const ArrivalAirportTerminalID			= ArrivalAirport?.TerminalID || ''; //도착 터미널
                    
                    const OperatingAirline						  = FlightSegment.OperatingAirline;
                    const OperatingAirlineCode					= OperatingAirline.Code; //운항사
                    const OperatingAirlineFlightNumber	= OperatingAirline.FlightNumber; //편수

                    const AirEquipType							    = FlightSegment.Equipment.AirEquipType;
                    const MarketingAirlineCode					= FlightSegment.MarketingAirline.Code; //판매사
                    const MarriageGrp							      = FlightSegment.MarriageGrp;
                    const DepartureTimeZoneGMTOffset		= FlightSegment.DepartureTimeZone.GMTOffset; // 출발GMT
                    const ArrivalTimeZoneGMTOffset      = FlightSegment.ArrivalTimeZone.GMTOffset; // 출발GMT
                    
                    let NumberOfStops = '';
                    let StopAirportLocationCode = '';
                    if (FlightSegment.StopAirports) {
                        airport = FlightSegment.StopAirports.StopAirport;
                        if (!Array.isArray(airport)) {
                            airport = [airport];
                          }
                          //console.log(airport)
                          //for (const StopAirport of airport) {
                            StopAirportLocationCode	   = airport[0].LocationCode;
							              NumberOfStops  = 1;
                        //}
                      }
                    const eTicketInd							= FlightSegment.TPA_Extensions.eTicket.Ind;
					          const MileageAmount							= FlightSegment.TPA_Extensions.Mileage.Amount;
                    
                    aSql.HubFlightSegment.push(`('${TransactionId}','${SequenceNumber}','${minor_num}','${minor_num1}','${minor_num2}','${ElapsedTime}','${DepartureCountry}','${ArrivalCountry}','${DepartureDateTime}','${ArrivalDateTime}','${StopQuantity}','${FlightNumber}','${ResBookDesigCode}','${FlightSegmentElapsedTime}','${DepartureAirportLocationCode}','${DepartureAirportTerminalID}','${ArrivalAirportLocationCode}','${ArrivalAirportTerminalID}','${OperatingAirlineCode}','${OperatingAirlineFlightNumber}','${MarketingAirlineCode}','${DepartureTimeZoneGMTOffset}','${ArrivalTimeZoneGMTOffset}','${eTicketInd}','${MileageAmount}','${AirEquipType}','${NumberOfStops}','${StopAirportLocationCode}')`);
                  }
                }
                
                const AirItineraryPricingInfo					= PricedItinerary.AirItineraryPricingInfo ;
                const PricingSource								    = AirItineraryPricingInfo.PricingSource;
                const PricingSubSource							  = AirItineraryPricingInfo.PricingSubSource;
			      const FareReturned								    = AirItineraryPricingInfo.FareReturned;

            const ItinTotalFare                   = AirItineraryPricingInfo.ItinTotalFare;

            let   BaseFare									      = ItinTotalFare.BaseFare;
            const BaseFareAmount							    = BaseFare.Amount; //요금
            const BaseFareCurrencyCode						= BaseFare.CurrencyCode; // 환
            const BaseFareDecimalPlaces						= BaseFare.DecimalPlaces; //
            
            let   FareConstruction							  = ItinTotalFare.FareConstruction;
            const FareConstructionAmount					= FareConstruction.Amount; //현지요금
            const FareConstructionCurrencyCode		= FareConstruction.CurrencyCode; //현지요금
            const FareConstructionDecimalPlaces		= FareConstruction.DecimalPlaces; //소수자리

            let   EquivFare									      = ItinTotalFare.EquivFare;
            const EquivFareAmount							    = EquivFare.Amount; //현지요금
            const EquivFareCurrencyCode						= EquivFare.CurrencyCode; //현지요금
            const EquivFareDecimalPlaces					= EquivFare.DecimalPlaces; //소수자리
            
            const TaxesAmount   							    = ItinTotalFare.Taxes.Tax.Amount;
            const TaxesCurrencyCode               = ItinTotalFare.Taxes.Tax.CurrencyCode;
            const TaxesDecimalPlaces              = ItinTotalFare.Taxes.Tax.DecimalPlaces;
            // if (!Array.isArray(tax)) {
            //     tax = [tax]; // 1개일 경우 배열로 변환
            // }
            // let TaxesAmount = 0;
            // for (const Tax of tax) {
            //     TaxesAmount += Tax.Amount;
            // }
            let   TotalFare									      = ItinTotalFare.TotalFare ;
            const TotalFareAmount							    = TotalFare.Amount; //현지요금
            const TotalFareCurrencyCode						= TotalFare.CurrencyCode; //현지요금
            const TotalFareDecimalPlaces					= TotalFare.DecimalPlaces; //소수자리

            aSql.HubItinTotalFare.push(`('${TransactionId}','${SequenceNumber}','${PricingSource}','${PricingSubSource}','${FareReturned}','${BaseFareAmount}','${BaseFareCurrencyCode}','${BaseFareDecimalPlaces}','${FareConstructionAmount}','${FareConstructionCurrencyCode}','${FareConstructionDecimalPlaces}','${EquivFareAmount}','${EquivFareCurrencyCode}','${EquivFareDecimalPlaces}','${TotalFareAmount}','${TotalFareCurrencyCode}','${TotalFareDecimalPlaces}','${TaxesAmount}','${TaxesCurrencyCode}','${TaxesDecimalPlaces}')`);
            
            let fareDown = AirItineraryPricingInfo.PTC_FareBreakdowns.PTC_FareBreakdown;
            if (!Array.isArray(fareDown)) {
              fareDown = [fareDown];
            }
            
            for (const PTC_FareBreakdown of fareDown) {
                let   PassengerTypeQuantityCode         = PTC_FareBreakdown.PassengerTypeQuantity.Code;
                const PassengerTypeQuantityQuantity     = PTC_FareBreakdown.PassengerTypeQuantity.Quantity;
                
                if (PassengerTypeQuantityCode == "C10")      PassengerTypeQuantityCode = "CNN";
				        else if (PassengerTypeQuantityCode == "C05") PassengerTypeQuantityCode = "KID";
                
                let fareCode					= PTC_FareBreakdown.FareBasisCodes.FareBasisCode;
                if (!Array.isArray(fareCode)) {
                  fareCode = [fareCode];
                }
                let idx = 0 ;
                for (const FareBasisCode of fareCode) {
                    idx ++;
                    const FareBasis                                     = FareBasisCode._;
					          const BookingCode								      = FareBasisCode.BookingCode; 
                    const AvailabilityBreak								= FareBasisCode?.AvailabilityBreak ?? ''; 
                    const DepartureAirportCode						= FareBasisCode.DepartureAirportCode; 
                    const ArrivalAirportCode							= FareBasisCode.ArrivalAirportCode; 
                    const FareComponentBeginAirport				= FareBasisCode?.FareComponentBeginAirport ?? ''; 
                    const FareComponentEndAirport					= FareBasisCode?.FareComponentEndAirport ?? ''; 
                    const FareComponentDirectionality			= FareBasisCode?.FareComponentDirectionality ?? ''; 
                    const FareComponentVendorCode					= FareBasisCode?.FareComponentVendorCode ?? ''; 
                    const FareComponentFareTypeBitmap			= FareBasisCode?.FareComponentFareTypeBitmap ?? ''; 
                    const FareComponentFareType						= FareBasisCode?.FareComponentFareType ?? ''; 
                    const FareComponentFareTariff					= FareBasisCode?.FareComponentFareTariff ?? ''; 
                    const FareComponentFareRule						= FareBasisCode?.FareComponentFareRule ?? ''; 
                    const FareComponentCabinCode					= FareBasisCode?.FareComponentCabinCode ?? ''; 
                    const GovCarrier								      = FareBasisCode.GovCarrier; 
                    
                    aSql.HubFareBasisCode.push(`('${TransactionId}','${SequenceNumber}','${idx}','${PassengerTypeQuantityCode}','${PassengerTypeQuantityQuantity}','${FareBasis}','${AvailabilityBreak}','${DepartureAirportCode}','${ArrivalAirportCode}','${FareComponentBeginAirport}','${FareComponentEndAirport}','${FareComponentDirectionality}','${FareComponentVendorCode}','${FareComponentFareTypeBitmap}','${FareComponentFareType}','${FareComponentFareTariff}','${FareComponentFareRule}','${FareComponentCabinCode}','${GovCarrier}')`);
                  }

                let  PassengerFare												        = PTC_FareBreakdown.PassengerFare;

                const PassengerFareAmount										      = PassengerFare.BaseFare.Amount;
                const PassengerFareCurrencyCode									  = PassengerFare.BaseFare.CurrencyCode;
                const FareConstructionAmount									    = PassengerFare.FareConstruction.Amount;
                const FareConstructionCurrencyCode								= PassengerFare.FareConstruction.CurrencyCode;
                const EquivFareAmount											        = PassengerFare.EquivFare.Amount;
                const EquivFareCurrencyCode										    = PassengerFare.EquivFare.CurrencyCode;
                const PassengerFareTotalFareAmount								= PassengerFare.TotalFare.Amount;
                const PassengerFareTotalFareCurrencyCode					= PassengerFare.TotalFare.CurrencyCode;
                const PassengerTotalTaxAmount									    = PassengerFare.Taxes?.TotalTax?.Amount || '';
                const PassengerTotalTaxCurrencyCode								= PassengerFare.Taxes?.TotalTax?.CurrencyCode || '';
                const PassengerTotalTaxDecimalPlaces							= PassengerFare.Taxes?.TotalTax?.DecimalPlaces || '';
                
                aSql.HubPassengerFare.push(`('${TransactionId}','${SequenceNumber}','${PassengerTypeQuantityCode}','${PassengerTypeQuantityQuantity}','${PassengerFareAmount}','${PassengerFareCurrencyCode}','${FareConstructionAmount}','${FareConstructionCurrencyCode}','${EquivFareAmount}','${EquivFareCurrencyCode}','${PassengerFareTotalFareAmount}','${PassengerFareTotalFareCurrencyCode}','${PassengerTotalTaxAmount}','${PassengerTotalTaxCurrencyCode}','${PassengerTotalTaxDecimalPlaces}')`);
                
                let BaggageArray		= PassengerFare.TPA_Extensions.BaggageInformationList.BaggageInformation;
                if (!Array.isArray(BaggageArray)) {
                  BaggageArray = [BaggageArray];
                }
                idx = 0;
                for (const BaggageInformationList of BaggageArray ) {
                  idx ++;
                    const BaggageInformationProvisionType   = BaggageInformationList.ProvisionType || '';
                    const BaggageInformationAirlineCode     = BaggageInformationList.AirlineCode || '';
                    const SegmentId                         = BaggageInformationList.Segment.id;
                    
                    const AllowanceWeight					          = BaggageInformationList.Allowance.Weight || '';
                    const AllowanceUnit						          = BaggageInformationList.Allowance.Unit || '';
                    const AllowancePieces					          = BaggageInformationList.Allowance.Pieces || '';
                    
                    aSql.HubBaggageInformation.push(`('${TransactionId}','${SequenceNumber}','${idx}','${PassengerTypeQuantityCode}','${BaggageInformationProvisionType}','${BaggageInformationAirlineCode}','${AllowanceWeight}','${AllowanceUnit}','${AllowancePieces}')`);
                    
                }
                
                //const NonRefundableIndicator = PTC_FareBreakdown.Endorsements.NonRefundableIndicator;
                //const FareCalcLineInfo = PTC_FareBreakdown.TPA_Extensions.FareCalcLine.Info;

                let fares = PTC_FareBreakdown.FareInfos.FareInfo;
                      
                if (!Array.isArray(fares)) {
                  fares = [fares];
              }
              idx = 0;
              for(const FareInfo of fares){
                idx++;
                const FareReference								= FareInfo.FareReference;
                // 	const FareInfoTPA_Extensions					= FareInfo.TPA_Extensions;
                // 	const SeatsRemaining							= FareInfo.TPA_Extensions.SeatsRemaining;
                const SeatsRemainingNumber						= FareInfo.TPA_Extensions.SeatsRemaining.Number;
                const SeatsRemainingBelowMin					= FareInfo.TPA_Extensions.SeatsRemaining.BelowMin;
                
                const Cabin										= FareInfo.TPA_Extensions.Cabin.Cabin || '';
                const Meal										= FareInfo.TPA_Extensions.Meal?.Code || '';
                
                if(PassengerTypeQuantityCode == "ADT") aSql.HubSeats.push(`('${TransactionId}','${SequenceNumber}','${idx}','${FareReference}','${SeatsRemainingNumber}','${SeatsRemainingBelowMin}','${Cabin}','${Meal}')`);
              }
            }
            
            ix ++;
          }
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
                    const fullQuery = `INSERT INTO hubSabre.dbo.${tableName} (${arrSqlTable[tableName]}) VALUES \n${query};`;
                    try {
                        await pool.request().query(fullQuery);

                        //console.log(`✅ ${tableName} - ${i + 1} ~ ${i + chunk.length} insert 성공`);
                    } catch (err) {
                        console.error(`❌ ${tableName} insert 실패 (${i + 1} ~ ${i + chunk.length}):`, err);
                        console.log(fullQuery)
                    // 필요 시 중단 또는 계속 진행
                    // break; 또는 continue;
                    }
                }
            }
        }
    }

    return [TransactionId , ''];
}

async function uapiSabreSearch(pData,service="") {
    let sess = '';
    if (!service) {
      service = await sessionOnAbacus();
      sess    = "Y";
    }
    let   logData = '';
    const xmlBody = service.buildSearchXml(pData);
    SabreLogSave (xmlBody);
    try {
        const xml     = service.buildEnvelope('BargainFinderMaxRQ', xmlBody, 'OTA', 'Production');
        const xml2    = await service.sendSoap(xml);
        const abaXml  = await extractSoapBodyNew(xml2);
        const rData   = await uapiSabreSave (abaXml);
        SabreLogSave (xml2);
        return { success: true, data: [rData[0],'abcd'] };
    } catch (err) {
        if (err.response?.data) {
          const errText = err.response.data.toString('utf-8');
          console.error('[❌ 서버 응답 에러]');
          console.error(errText);
        } else {
          console.error('SOAP Request Error:', err.message);
        }
    }
    if (sess === 'Y') await service.SessionClose();
};

function sabreBuildOneData(aAbaTotalSeg, passengerFareData, arraySabreAir, oneData = {}) {
  if (!aAbaTotalSeg || !passengerFareData) return oneData;

  const sabreAir = arraySabreAir.join('|');
  const sabreRegex = new RegExp(`(${sabreAir})`, 'i');

  for (const [tId, value0] of Object.entries(aAbaTotalSeg)) {
    for (const [sequenceNumber, value] of Object.entries(value0)) {
      for (const [minor_num1, val2] of Object.entries(value)) {
        // val2 == PHP의 $val2 (row 객체)
        const row = val2;
        // PHP: foreach ($val2 as $key3 => $val3) $$key3 = trim($val3);
        // → JS에서는 필요한 필드만 꺼내서 trim

        let OperatingAirlineCode        = (row.OperatingAirlineCode || '').trim();
        let MarketingAirlineCode        = (row.MarketingAirlineCode || '').trim();
        let FlightNumber                = (row.FlightNumber || '').trim();
        let ResBookDesigCode            = (row.ResBookDesigCode || '').trim();
        let SeatsRemainingNumber        = row.SeatsRemainingNumber;
        let Cabin                       = (row.Cabin || '').trim();
        let DepartureTimeZoneGMTOffset  = row.DepartureTimeZoneGMTOffset;
        let DepartureDateTime           = (row.DepartureDateTime || '').trim();
        let ArrivalTimeZoneGMTOffset    = row.ArrivalTimeZoneGMTOffset;
        let ArrivalDateTime             = (row.ArrivalDateTime || '').trim();
        let DepartureAirportLocationCode= (row.DepartureAirportLocationCode || '').trim();
        let ArrivalAirportLocationCode  = (row.ArrivalAirportLocationCode || '').trim();
        let AllowancePieces             = row.AllowancePieces;
        let AllowanceWeight             = row.AllowanceWeight;
        let minor_num2                  = row.minor_num2;
        let segCount                    = row.segCount;

        // Sabre 항공사 필터
        if (!sabreRegex.test(OperatingAirlineCode)) {
          continue;
        }

        let main = '';
        let date = '';

        // seg의 첫 구간(minor_num2 == 1)에서 main / 날짜 / 요금 세팅
        if (Number(minor_num2) === 1) {
          const fareRow =
            passengerFareData?.[tId]?.[sequenceNumber]?.['ADT'];

          if (!fareRow) {
            // 요금 데이터 없으면 스킵
            continue;
          }

          const ApproximateBasePrice = fareRow.EquivFareAmount;
          const ApproximateTaxes     = fareRow.PassengerTotalTaxAmount;

          const Carrier        = MarketingAirlineCode;
          const BookingCode    = ResBookDesigCode;
          const BookingCount   = SeatsRemainingNumber;
          const NumberOfPieces = AllowancePieces;
          const MaxWeight      = AllowanceWeight;

          // 출/도착 시간 포맷
          let cal = '';
          if (DepartureTimeZoneGMTOffset > 0) cal = '+';
          const DepartureTime =
            `${DepartureDateTime}.000${cal}${DepartureTimeZoneGMTOffset}`;

          cal = '';
          if (ArrivalTimeZoneGMTOffset > 0) cal = '+';
          const ArrivalTime =
            `${ArrivalDateTime}.000${cal}${ArrivalTimeZoneGMTOffset}`;

          const Origin      = DepartureAirportLocationCode;
          const Destination = ArrivalAirportLocationCode;

          date = deps.StrClear(DepartureDateTime).slice(0, 8);

          main =
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
          // PHP의 $main = "//$ApproximateBasePrice//...//$MaxWeight"
        }

        if (!main || !date) {
          // minor_num2 != 1 인 경우 main/date 안 잡혀있으면 스킵
          continue;
        }

        // segCount 기준 직항 / 경유 처리
        let sub = '';
        let share = '';

        if (Number(segCount) === 1) {
          sub = '';
          share = '직항';
        } else {
          // 경유일 때 sub 구간 구성
          const Carrier        = MarketingAirlineCode;
          const BookingCode    = ResBookDesigCode;
          const BookingCount   = SeatsRemainingNumber;
          const NumberOfPieces = AllowancePieces;
          const MaxWeight      = AllowanceWeight;

          let cal2 = '';
          if (DepartureTimeZoneGMTOffset > 0) cal2 = '+';
          const DepartureTime2 =
            `${DepartureDateTime}.000${cal2}${DepartureTimeZoneGMTOffset}`;

          cal2 = '';
          if (ArrivalTimeZoneGMTOffset > 0) cal2 = '+';
          const ArrivalTime2 =
            `${ArrivalDateTime}.000${cal2}${ArrivalTimeZoneGMTOffset}`;

          const Origin2      = DepartureAirportLocationCode;
          const Destination2 = ArrivalAirportLocationCode;

          sub =
            `||${Carrier}` +
            `//${FlightNumber}` +
            `//${BookingCode}` +
            `//${BookingCount}` +
            `//${DepartureTime2}` +
            `//${ArrivalTime2}` +
            `//${Origin2}` +
            `//${Destination2}` +
            `//${NumberOfPieces}` +
            `//${MaxWeight}`;

          share = '경유';
        }

        if (!oneData[date]) oneData[date] = [];
        oneData[date].push(share + main + sub);
      }
    }
  }

  return oneData;
}

function SabreLogSave (logdata,type='') {
  const nows    = deps.getNow().NOWS;
  const nowStr  = deps.getNow().NOWSTIME;
  const logFile = `../admin/Logs/${nows}_Sabre.txt`;
  const logData = `[${nowStr}]\r\n${logdata}\r\n\r\n`;
  fs.appendFileSync(logFile, logData);
}

module.exports = {
    uapiSabreSearch,
    sabreBuildOneData
};