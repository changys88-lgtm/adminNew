const deps = require('../../src/common/dependencies');
const { multiCurl } = require('../../src/utils/multiNetwork');
const { interSearchLogSave } = require('../../src/utils/database');
const { galBuildOneData }    = require('../../src/utils/functionGalileo');
const { sabreBuildOneData }  = require('../../src/utils/functionSabre');

module.exports = async (req, res) => {
    //console.log(req.body);
    const data = req.body;
    const AviaLoginId = req.cookies.AviaLoginId;
    data.AviaLoginId  = AviaLoginId;
    const bspSiteCode = 'OY00170';
    const NOWS        = deps.getNow().NOWS;
    const NOWSTIME    = deps.getNow().NOWSTIME;
    const ip =
        req.headers['x-forwarded-for']?.split(',')[0] || // 프록시 있을 경우
        req.socket?.remoteAddress ||                     // 일반적인 경우
        req.connection?.remoteAddress || 
        null;
    data.ip = ip;
    pool = await deps.getPool();
    let { ticket_type , departure , departure_date , arrive  } = data;
    let { grade , adt , chd , inf , stopover} = data;
    let addQry    = '';
    let sqlText   = '';
    let sqlResult = '';
    let daily     = '';
    let listData  = '';

    data.ticket_type = 'M';
    departure_date = deps.StrClear(departure_date);
    const logUid = await interSearchLogSave (data,pool); // 검색 로그 저장
    const limit  = deps.timeToAgo (60);
    addQry = ` and up_date >= '${limit}' `;
    const date   = departure_date.slice(0,6);
    const fYear  = departure_date.slice(0,4);
    const fMonth = departure_date.slice(4,6);

    sqlText = `  select search_date from ${deps.hubGds}monthCache  where search_date like '${date}%' and src = '${departure}' and dest = '${arrive}'  ${addQry}  `;
    const { recordset: notset } = await pool.request().query(sqlText);
    const notData  =  Array.isArray(notset) ? notset.map(r => r.search_date) : [];
    const lastDate = new Date(fYear, fMonth, 0).getDate(); 
    //console.log(sqlText);
    const searchReqDate = [];
    for (let i = 1; i <= lastDate; i++) {
        const dayStr = String(i).padStart(2, '0');     // 01, 02, 03 …
        const curData = `${fYear}${fMonth}${dayStr}`;  // YYYYMMDD
        
        if (!notData.includes(curData) && curData > NOWS) {
            searchReqDate.push(curData);
        }
    }
    
    stopover = 'Y';
    const pData = {
        departure: data.departure,
        arrive: data.arrive,
        RouteCount: '1',
        adt: adt,
        chd: chd,
        inf: inf,
        grade: grade,
        stopover: stopover,
        ticket_type: ticket_type
      
    };
    
    const getData = new URLSearchParams(pData).toString();
    const checkAirports = /SIN|DPS|MLE|HKG|MAA/i;
    if ((checkAirports.test(arrive) || checkAirports.test(departure)) && stopover === "Y") SQSEARCHON = "Y"; else SQSEARCHON = 'N';
    const requests = [];
    let ix = 0 ; 
    for (const day of searchReqDate) {
        const link1 = `${deps.searchUrl}/gdsSearch/uapiGalileo?SQSEARCHON=${SQSEARCHON}&bspSiteCode=${bspSiteCode}&${getData}&departure_date=${day}`;
        const link2 = `${deps.searchUrl}/gdsSearch/uapiSabre?SQSEARCHON=${SQSEARCHON}&bspSiteCode=${bspSiteCode}&${getData}&departure_date=${day}`;
        requests.push({url: link1 , method: 'get'});
        requests.push({url: link2 , method: 'get'});
        ix ++;
        //if (ix > 1)break;
    }

    //console.log(requests)
    let TID = '' , TraceId = '' , TransactionId_abacus = '' , GDS = '' ,  depDate = '' , BSP = '' ;
    const results = await multiCurl(requests);
    const searchData = [];
    for (const [idx, res] of results.entries()) {
        if (res.success) {
            //console.log(`✅ ${idx + 1}번 요청 성공`, res.data.received);
            
            searchData.push(res.data.received);
        } else {
            console.log(`❌ ${idx + 1}번 요청 실패`, res.error);
        }
    }
    const group = {};
    for (const r of searchData) {
        if (!group[r.DEP_DATE]) group[r.DEP_DATE] = [];
        group[r.DEP_DATE].push(r);
    }
    //console.log(searchReqDate)
    //console.log(searchData)
    //console.log(group)
    for (const depDate in group) {
        const rows = group[depDate];
        
        let TransactionId = '' , TraceId = '' , TransactionId_abacus = '' , BSP = '';
        for (const put of rows) {
            let {GDS , TID , TRID , BSP } = put;
            //console.log(put)
            if (GDS === "G") {
                TransactionId        = TID;
                TraceId              = TRID;
            } else {
                TransactionId_abacus = TID;
            }
            BSP = BSP;
        }
        sqlText = `insert into ${deps.hubGds}HubGalileoCache (
            grade, src,dest , dep_date, ticket_type,up_date ,TransactionId,TraceId , adt , chd , inf , stopover , TransactionId_abacus , bspSiteCode   ) 
            OUTPUT inserted.uid
            values 
            ('${grade}','${departure}','${arrive}', '${depDate}','${ticket_type}','${NOWSTIME}' ,'${TransactionId}','${TraceId}','${adt}','${chd}','${inf}','${stopover}' , '${TransactionId_abacus}' ,'${BSP}' )
        `;
        //console.log(sqlText)
        const result = await pool.request().query(sqlText);
        const uid = result.recordset?.[0]?.uid;

        sqlText  = `insert into ${deps.hubGds}monthCache (up_date,src,dest,search_date,cache_uid) 
                values ('${NOWSTIME}','${departure}','${arrive}','${depDate}','${uid}') `;
        await pool.request().query(sqlText);
    }

    sqlText = `  select cache_uid from ${deps.hubGds}monthCache  where search_date like '${date}%' and src = '${departure}' and dest = '${arrive}'  ${addQry}  `;
    const {recordset: cuid} = await pool.request().query(sqlText);
    const aUid = cuid.map(r => r.cache_uid);
    //console.log(aUid)
    if (Array.isArray(aUid)) {
        sqlText = ` select TransactionId , TransactionId_bxx , TransactionId_abacus from ${deps.hubGds}HubGalileoCache where uid in (${aUid.join(',')}) `;
        sqlResult = await pool.request().query(sqlText);
        const gQry = [] , aQry = [];
        for (const put of sqlResult.recordset) {
            let {TransactionId , TransactionId_bxx , TransactionId_abacus} = put;
            gQry.push(TransactionId);
            aQry.push(TransactionId_abacus);
        }
        const aTotalSeg = {};
        const aAbaTotalSeg = {};
        const passengerFareData = {};
        if (Array.isArray(gQry)) {
            const stopQry = " shareCnt = '1' and [Group] = '0' and  ";
            const fieldQry = `
                a.Price_Key, a.ApproximateTotalPrice, a.ApproximateBasePrice, a.ApproximateTaxes,b.PassengerType, c.Detail_Key, c.minor_num3, c.shareCnt, c.BookingCode, c.BookingCount, f.NumberOfPieces, f.MaxWeight
            `;
            sqlText = `
                SELECT
                    ${fieldQry}, d.Carrier,  d.FlightNumber, d.[Group], d.DepartureTime, d.ArrivalTime, d.Origin, d.Destination
                    FROM ${deps.hubGds}HubGalileoPrice AS a
                    LEFT OUTER JOIN ${deps.hubGds}HubGalileoPriceInfo AS b ON a.Price_Key   = b.Price_Key  AND a.TransactionId = b.TransactionId
                    LEFT OUTER JOIN ${deps.hubGds}HubGalileoPriceInfo_Option_detail AS c ON b.PriceInfo_Key = c.PriceInfo_Key  AND a.TransactionId = c.TransactionId
                    LEFT OUTER JOIN ${deps.hubGds}HubGalileoSegment AS d ON c.SegmentRef    = d.Segment_key AND a.TransactionId = d.TransactionId
                    LEFT OUTER JOIN hubGalileo.dbo.HubGalileoFare AS f ON c.FareInfoRef     = f.FareInfoRef AND a.TransactionId = f.TransactionId
                WHERE ${stopQry} a.TransactionId IN ('${gQry.join("','")}')
                ORDER BY d.DepartureTime, c.minor_num, c.minor_num2, c.minor_num3;
            `;
            sqlResult = await pool.request().query(sqlText);
            for (const row of sqlResult.recordset) {
                const PassengerType = (row.PassengerType || '').trim();
                if (PassengerType !== 'ADT') continue; // PHP 조건 동일
            
                const Price_Key = (row.Price_Key || '').toString().trim();
                const Group = (row.Group || '').toString().trim();       // d.[Group]
                const Detail_Key = (row.Detail_Key || '').toString().trim();
            
                if (!aTotalSeg[PassengerType]) aTotalSeg[PassengerType] = {};
                if (!aTotalSeg[PassengerType][Price_Key]) aTotalSeg[PassengerType][Price_Key] = {};
                if (!aTotalSeg[PassengerType][Price_Key][Group]) aTotalSeg[PassengerType][Price_Key][Group] = {};
                if (!aTotalSeg[PassengerType][Price_Key][Group][Detail_Key]) {
                    aTotalSeg[PassengerType][Price_Key][Group][Detail_Key] = [];
                }
            
                // PHP의 $put 전체를 그대로 push → row 전체를 넣어줌
                aTotalSeg[PassengerType][Price_Key][Group][Detail_Key].push(row);
            }
            if (Array.isArray(aQry)) {
                sqlText = `
                    SELECT 
                    a.*, c.FareReference, c.SeatsRemainingNumber, c.SeatsRemainingBelowMin, c.Cabin, c.Meal, d.AllowanceWeight, d.AllowancePieces,
                    ( SELECT COUNT(*) FROM ${deps.hubSabre}HubFlightSegment WITH (NOLOCK) WHERE TransactionId = a.TransactionId AND SequenceNumber = a.SequenceNumber AND minor_num      = a.minor_num ) AS segCount
                    FROM ${deps.hubSabre}HubFlightSegment AS a WITH (NOLOCK) 
                    LEFT OUTER JOIN ${deps.hubSabre}HubSeats AS c WITH (NOLOCK)  ON a.TransactionId = c.TransactionId AND a.SequenceNumber = c.SequenceNumber AND a.minor_num1     = c.minor_num
                    LEFT OUTER JOIN ${deps.hubSabre}HubBaggageInformation AS d WITH (NOLOCK)  ON a.TransactionId = d.TransactionId AND a.SequenceNumber = d.SequenceNumber AND a.minor_num1     = d.minor_num
                    WHERE a.TransactionId IN ('${aQry.join("','")}')
                `;
                sqlResult = await pool.request().query(sqlText);
                for (const row of sqlResult.recordset) {
                    const TransactionId   = row.TransactionId.trim();
                    const SequenceNumber  = row.SequenceNumber;
                    const minor_num1      = row.minor_num1;

                    if (!aAbaTotalSeg[TransactionId]) aAbaTotalSeg[TransactionId] = {};
                    if (!aAbaTotalSeg[TransactionId][SequenceNumber]) {
                        aAbaTotalSeg[TransactionId][SequenceNumber] = {};
                    }

                    aAbaTotalSeg[TransactionId][SequenceNumber][minor_num1] = row; // PHP: $put
                }
                sqlText = `
                    SELECT * FROM ${deps.hubSabre}HubPassengerFare AS a WITH (NOLOCK) 
                    WHERE a.TransactionId IN ('${aQry.join("','")}') AND a.PassengerTypeQuantityCode = 'ADT'
                `;
                sqlResult = await pool.request().query(sqlText);
                for (const row of sqlResult.recordset) {
                    const TransactionId             = row.TransactionId.trim();
                    const SequenceNumber            = row.SequenceNumber;
                    const PassengerTypeQuantityCode = row.PassengerTypeQuantityCode.trim(); // ADT

                    if (!passengerFareData[TransactionId]) {
                        passengerFareData[TransactionId] = {};
                    }
                    if (!passengerFareData[TransactionId][SequenceNumber]) {
                        passengerFareData[TransactionId][SequenceNumber] = {};
                    }

                    passengerFareData[TransactionId][SequenceNumber][PassengerTypeQuantityCode] = row;
                }
            }
            //console.log(aTotalSeg)
            //console.log(aAbaTotalSeg)
            //console.log(passengerFareData)
        }
        const arraySabreAir = ['OZ','RS','BX'];
        let oneData = galBuildOneData (aTotalSeg);
        oneData = sabreBuildOneData (aAbaTotalSeg, passengerFareData, arraySabreAir, oneData);
        //console.log(oneData)

        let   lastdays   = new Date(Date.UTC(fYear, fMonth, 0)).getUTCDate();
        let   firstWeeks = new Date(Date.UTC(fYear, Number(fMonth)  - 1, 1)).getUTCDay();

        const weeks = [];
        let   w     = [];
        for (let i = 0; i < Number(firstWeeks); i++) w.push('');
        for (let d = 1; d <= Number(lastdays); d++) {
            w.push(d);
            if (w.length === 7) { weeks.push(w); w = []; }
        }
        if (w.length > 0) weeks.push(w);
        const dayClass = { 0: 'cored', 6: 'coblue' };
        let link = "";
        let not = "";
        let nop = "";
    
        let aDaily = {};
        let arrayPrice = [];
        for (let ix = 0 ; ix < weeks.length ; ix ++) {
            listData += '<tr>';
            for (let ii = 0 ; ii < 7 ; ii ++) {
                wCls    = dayClass[ii] || '';
                day     = weeks[ix][ii] || '';
                if (day) curData = fYear+String(fMonth).padStart(2,0)+String(weeks[ix][ii]).padStart(2,0);
                else curData = '';
                const dayList = oneData[curData] || [];
                //console.log(dayList)
                let aPrice = {};
                for (const data of dayList) {
                    const aData  = data.split("||");
                    const aData1 = aData[0].split("//");
                    const aData2 = aData[1] ? aData[1].split("//") : [];
            
                    const air = (aData1[2] || "") + (aData1[3] || "");
                    const BasePrice = aData1[1] || "";
            
                    //let fee = BookingFee(aData1[2], curData, departure, arrive); // PHP: BookingFee ($aData1[2],"$curData","$departure","$arrive");
                    //if (fee !== 0 && String(fee).length < 3) {
                    //   fee = RoundUp(StrClear(BasePrice) * fee / 100, 2);
                    //}
                    fee = 0;
            
                    const pr = Number(deps.StrClear(BasePrice)) + Number(deps.StrClear(aData1[6] || "")) + fee;
                    const bc = aData1[5] || "";
            
                    const DepartureTime = (aData1[7] || "").substring(11, 16);
                    const ArrivalTime = (aData1[8] || "").substring(11, 16);
                    const src = aData1[9] || "";
                    const dest = aData1[10] || "";
            
                    const bag = aData1[11] || 0;
                    const weight = aData1[12] || 0;
            
                    const src2 = aData2[6] || "";
                    const dest2 = aData2[7] || "";
                    const air2 = (aData2[0] || "") + (aData2[1] || "");
                    const DepartureTime2 = (aData2[4] || "").substring(11, 16);
                    const ArrivalTime2 = (aData2[5] || "").substring(11, 16);
            
                    const airCode = air;
                    const img = `<img src='${deps.bbsImgName}/Airline/Search/${aData1[2]}.png' width='14'>`;
                    //console.log(airCode + ' '  + pr)
                    //if (!aPrice[airCode] || aPrice[airCode] > pr) {
                    if (pr > 0) {
                        aPrice[airCode] = pr;
                
                        const date_ = `${deps.cutDate(curData)}(${deps.getWeek(ii)})`;
                
                        let bagImg = "";
                        if ((bag == 0 && weight > 0) || bag == "1") {
                            bagImg = "<img src='/images/Carrier.png'>";
                        } else if (bag == 2) {
                            bagImg = "<img src='/images/Carrier.png'><img src='../images/Carrier.png'>";
                        }
                
                        aDaily[airCode] = `
                            <div class='daily_piece' onclick="return monthData('${curData}','${air}','${src}','${dest}','${pr}','${bc}','${DepartureTime}','${ArrivalTime}','${air2}','${src2}','${dest2}','${DepartureTime2}','${ArrivalTime2}','${date_}')">
                            <p class='wh30 fl'>${img}</p>
                            <p class='wh50 al fl'> ${air}</p>
                            <p class='wh60 ar fl'>${deps.numberFormat(pr)}</p>
                            <p class='wh30 ac fr'>${bagImg}</p>
                            <p class='wh30 ar fr'>${bc}석</p>
                            </div>
                        `;
                
                        arrayPrice[pr] = airCode;
                    }
                    daily += "a"; // "데이터가 있다" 라는 표시용
                }
                // 가격 정렬
                const sortedAirCodes = Object.entries(aPrice)
                    .sort(([, p1], [, p2]) => p1 - p2) // 가격 오름차순
                    .map(([airCode]) => airCode);
                if (daily === "") {
                    if (notData[curData] !== "1") {
                        notData[curData] = "Y";
                    } else {
                        daily += `
                        <div class='daily_piece'>
                            <p class='wh130 ac'></p>
                        </div>
                        `;
                        not = "calendar-not";
                    }
                } else {
                    daily = "";
                    for (const airCode of sortedAirCodes) {
                        daily += aDaily[airCode];
                    }
                }

                let airDetail = "";
                if (daily !== "") {
                    airDetail = `<small style='cursor:pointer;' onclick="return goDetail('${curData}','${ii}')">상세보기</small>`;
                }
                if (day) {
                    if (!daily) {
                        not = 'calendar-not gray';
                    } else {
                        not = '';
                    }
                    listData += `
                      <td ${link} class='${not} ' valign='top'>
                        <div class='daily_moreview' style='display:none;' id='Detail_${curData}'></div>
                        <div class='flex_row'>
                          <span class='mwa bm20'>${day} ${airDetail}</span>
                          <div class='daily_detail'>
                            ${daily}
                          </div>
                        </div>
                      </td>
                    `;
                } else {
                    listData += `<td class=' calendar-reject  ' valign='top'></td>`;
                }
            }
            listData += '</tr>';
        }

    }

    let pYear = nYear = fYear;

    let pMonth = fMonth - 1;
    if (pMonth == 0) {
        pMonth = 12;
        pYear --;
    }
    pMonth  = pMonth.toString().padStart(2,'0');
    const date1 = pYear+pMonth+"01";
    const date1_ = deps.cutDate(date1)+"("+deps.getWeek(deps.getWeekday(date1))+")";;

    let nMonth = Number(fMonth) + 1;
    if (nMonth == 13) {
        nMonth = 1;
        nYear ++;
    }
    nMonth = nMonth.toString().padStart(2,'0');
    const date2  = nYear+nMonth+"01";
    const date2_ = deps.cutDate(date2)+"("+deps.getWeek(deps.getWeekday(date2))+")";

    listData = `
		<div class='month_search'>
			

			<div class='calendar_item'>
				<div class='calnder_box'>
					<div class='calneder_title'>
                        <p>
                            <span onClick="monthNext('${date1}','${date1_}')" class='cursor par15'><img src='/images/pre.png' class='control_icon'></span>
                            <span>${fYear} . ${fMonth}</span>
                            <span onClick="monthNext('${date2}','${date2_}')" class='cursor pal15'><img src='/images/next.png' class='control_icon'></span>
                        </p>
                    </div>
					<table class='calnder_table'>
						<tbody>
							<tr>
								<th width='14.2%'>일</th>
								<th width='14.2%'>월</th>
								<th width='14.2%'>화</th>
								<th width='14.2%'>수</th>
								<th width='14.2%'>목</th>
								<th width='14.2%'>금</th>
								<th width='14.2%'>토</th>
							</tr>
							${listData}
							
						</tbody>
					</table>
				</div>
			</div>


		</div>
	`;

    //console.log(listData)
    
    res.json ({success:'ok',data: listData});


}