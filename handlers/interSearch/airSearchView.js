const deps = require('../../src/common/dependencies');
const { multiCurl } = require('../../src/utils/multiNetwork');
const { arrCabinType } = require('../../src/utils/airConst');
const dayjs = require('dayjs');

module.exports = async (req, res) => {
   
    const data = req.body;
    const maxUid = data.maxUid || '';
    const adt    = data.adt || '';
    const chd    = data.chd || '';
    const inf    = data.inf || '';
    //console.log(data)
    let { ticket_type , RouteCount , departure , arrive } = data;
    let link1   = '';
    let link2   = '';
    let link3   = '';
    let link4   = '';
    let gdsData = '';
    let monthFirstClick = '';
    link1 = `${deps.searchUrl}/gdsSearch/uapiGalileoSelect?maxUid=${maxUid}&adt=${adt}&chd=${chd}&inf=${inf}`;
    link2 = `${deps.searchUrl}/gdsSearch/uapiSabreSelect?maxUid=${maxUid}&adt=${adt}&chd=${chd}&inf=${inf}`;

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
                //console.log(`✅ ${idx + 1}번 요청 성공`, res.data.result);
                gdsData += gdsData ? '^::^' + res.data.datas : res.data.datas;
            } else {
                console.log(`❌ ${idx + 1}번 요청 실패`, res.error);
            }
        });
    })();

    //console.log(gdsData);
    if (gdsData) {
        let aData  = [];
        let aData2 = [];
        let aData3 = [];
        let aData4 = [];
        let air   = '';
        const airData = gdsData.split('^::^');
        for (const lineData of airData) {
            const tmp  = lineData.split('^:^');
            const code = tmp[1]?.split('/_/')[0] || '';
            //const ord  = code.charCodeAt(0);  
          
            const key1 = tmp[0].substring(0, 3);
            const key2 = tmp[0].substring(3);
          
            air  = key2.substring(0, 2);
          
            if (key2 !== '') {
                switch (key1) {
                    case '111':
                        aData[key2] = tmp[1];
                        break;
                    case '222':
                        aData2[key2] = tmp[1];
                        break;
                    case '333':
                        aData3[key2] = tmp[1];
                        break;
                    case '444':
                        aData4[key2] = tmp[1];
                        break;
                }
            }
        }

        const dimArray = ['aData', 'aData2', 'aData3', 'aData4'];

        // 동적으로 aData, aData2... 참조하는 저장소
        const aData_ = {};
        const aData2_ = {};
        const aData3_ = {};
        const aData4_ = {};
        const store = {
            aData,
            aData2,
            aData3,
            aData4,
            aData_: aData_,
            aData2_: aData2_,
            aData3_: aData3_,
            aData4_: aData4_
          };
        for (const name of dimArray) {
            const dataset = store[name];
            
            for (const [key, data] of Object.entries(dataset || {})) {
                const airTmp   = data.split('||');
                const schTmp   = airTmp[0].split('/_/');
                const seatTmp  = airTmp[1]?.split('/_/') || [];
                const priceTmp = airTmp[2]?.split('/_/') || [];
                const aShare1  = airTmp[3]?.split('/_/') || [];
                //const aShare2  = airTmp[4]?.split('/_/') || [];
            
                const aCode = schTmp[0].split(':');
                const new_key = aCode[0].trim() + (seatTmp[0] || '').trim();
                const new_key_sub = aCode[1] ? aCode[1] + (aShare1[10] || '').trim() : '0';
                const target = store[`${name}_`];
                
                if (!target[new_key]) target[new_key] = {};
                
                if (!target[new_key][new_key_sub]) {
                    target[new_key][new_key_sub] = data;
                } else {
                    const prevAirTmp   = target[new_key][new_key_sub].split('||');
                    const prevPriceTmp = prevAirTmp[2]?.split('/_/') || [];
            
                    prevPriceTmp[16] = `${prevPriceTmp[16]}-v-${priceTmp[16] || ''}`;
                    
                    let merged = `${prevAirTmp[0]}||${prevAirTmp[1]}||${prevPriceTmp.join('/_/')}`;
                    if (prevAirTmp[3]) merged += `||${prevAirTmp[3]}`;
                    if (prevAirTmp[4]) merged += `||${prevAirTmp[4]}`;
                    
                    target[new_key][new_key_sub] = merged;
                }
            }
        }
        const tmpJoinData = {};
        const segData = {};

        const dimStore = { aData2, aData3, aData4 };

        for (const [key, data] of Object.entries(aData)) {
            const airTmp = data.split('||');
            const schTmp = airTmp[0].split('/_/');
            const seatTmp = airTmp[1].split('/_/');
            const priceTmp = airTmp[2].split('/_/');
            const aShare1 = airTmp[3]?.split('/_/') || [];
            const aShare2 = airTmp[4]?.split('/_/') || [];

            const aCode = schTmp[0].split(':');
            let new_key = aCode[0].trim() + (seatTmp[0]?.trim() || '');
            if (aCode[1]) new_key += ':' + aCode[1] + (aShare1[10]?.trim() || '');

            const seg_key = priceTmp[16];
            const fare_key = priceTmp[0];

            tmpJoinData[seg_key] ??= {};
            tmpJoinData[seg_key][1] ??= [];
            tmpJoinData[seg_key][1].push(`${new_key}//${priceTmp[2]}//${priceTmp[3]}//${priceTmp[4]}//${priceTmp[5]}//${priceTmp[6]}//${priceTmp[7]}//${fare_key}//${schTmp[15]}`);

            for (let ix = 2; ix < 5; ix++) {
                const key = `aData${ix}`;
                const dim = dimStore[key];
                for (const [key2, data2] of Object.entries(dim || {})) {
                    const airTmp_ = data2.split('||');
                    const schTmp_ = airTmp_[0].split('/_/');
                    const seatTmp_ = airTmp_[1].split('/_/');
                    const priceTmp_ = airTmp_[2].split('/_/');
                    const aShare1_ = airTmp_[3]?.split('/_/') || [];
                    const aShare2_ = airTmp_[4]?.split('/_/') || [];

                    const aCode_ = schTmp_[0].split(':');
                    let new_key_ = aCode_[0].trim() + (seatTmp_[0]?.trim() || '');
                    if (aCode_[1]) new_key_ += ':' + aCode_[1].trim() + (aShare1_[10]?.trim() || '');

                    if (priceTmp[16] === priceTmp_[16] && new_key_) {
                        segData[new_key] ??= { KEY: {}, SEG: {}, RULE: {} };
                        segData[new_key]["KEY"][ix] ??= [];
                        segData[new_key]["SEG"][ix] ??= [];
                        segData[new_key]["RULE"][ix] ??= [];

                        segData[new_key]["KEY"][ix].push(new_key_);
                        segData[new_key]["SEG"][ix].push(priceTmp_[16]);
                        segData[new_key]["RULE"][ix].push(priceTmp_[0]);

                        tmpJoinData[seg_key][ix] ??= [];
                        tmpJoinData[seg_key][ix].push(`${new_key_}//${priceTmp[2]}//${priceTmp[3]}//${priceTmp[4]}//${priceTmp[5]}//${priceTmp[6]}//${priceTmp[7]}//${priceTmp_[0]}//${schTmp_[15]}`);
                    }

                    rCount = ix;
                }
            }
        }
        const joinData = {};
//console.log(tmpJoinData)
        for (const [key, datas] of Object.entries(tmpJoinData || {})) {
            const len1 = (datas[1] || []).length;
            const len2 = (datas[2] || []).length;
            const len3 = (datas[3] || []).length;
            const len4 = (datas[4] || []).length;

            for (let ix1 = 0; ix1 < len1; ix1++) {
                const lineData1 = datas[1][ix1].split('//');

                if (len2 > 0) {
                    for (let ix2 = 0; ix2 < len2; ix2++) {
                        const lineData2 = datas[2][ix2].split('//');

                        if (len3 > 0) {
                            for (let ix3 = 0; ix3 < len3; ix3++) {
                                const lineData3 = datas[3][ix3].split('//');

                                if (len4 > 0) {
                                    for (let ix4 = 0; ix4 < len4; ix4++) {
                                        const lineData4 = datas[4][ix4].split('//');
                                        const code = `${lineData1[0]}_${lineData2[0]}_${lineData3[0]}_${lineData4[0]}`;

                                        if (!joinData[code]) {
                                            joinData[code] = `${lineData1[8]}-v-${lineData2[8]}-v-${lineData3[8]}-v-${lineData4[8]}//${lineData1[1]}//${lineData1[2]}//${lineData1[3]}//${lineData1[4]}//${lineData1[5]}//${lineData1[6]}//${lineData1[7]}-v-${lineData2[7]}-v-${lineData3[7]}-v-${lineData4[7]}//${key}`;
                                        }
                                    }
                                } else {
                                    const code = `${lineData1[0]}_${lineData2[0]}_${lineData3[0]}`;

                                    if (!joinData[code]) {
                                        joinData[code] = `${lineData1[8]}-v-${lineData2[8]}-v-${lineData3[8]}//${lineData1[1]}//${lineData1[2]}//${lineData1[3]}//${lineData1[4]}//${lineData1[5]}//${lineData1[6]}//${lineData1[7]}-v-${lineData2[7]}-v-${lineData3[7]}//${key}`;
                                    }
                                }
                            }
                        } else {
                            const code = `${lineData1[0]}_${lineData2[0]}`;

                            if (!joinData[code]) {
                                joinData[code] = `${lineData1[8]}-v-${lineData2[8]}//${lineData1[1]}//${lineData1[2]}//${lineData1[3]}//${lineData1[4]}//${lineData1[5]}//${lineData1[6]}//${lineData1[7]}-v-${lineData2[7]}//${key}`;
                            }
                        }
                    }
                } else {
                    const code = `${lineData1[0]}`;
                    if (!joinData[code]) {
                        joinData[code] = `${lineData1[8]}//${lineData1[1]}//${lineData1[2]}//${lineData1[3]}//${lineData1[4]}//${lineData1[5]}//${lineData1[6]}//${lineData1[7]}//${key}`;
                    }
                }
            }
        }
        let aSearchData = {
            CLS: [],
            SEAT: [],
            PRICE: [],
            SPRICE: [],
            EXPIRE: [],
            TAX: [],
            RULE: [],
            ATR: [],
            BUTTON: [],
            STATUS: [],
            PRE_ISSUE: [],
            ISSUE_TERM: [],
            ANO_CLS: [],
            ANO_FLT: [],
            TRANS_CITY: [],
            NORMALPRICE: [],
            ISSUEPRICE: []
        };

        const aName = {};

        const query = `SELECT code_2, name, eng_name FROM airLine_code where code_2 is not null `;
        const result = await pool.request().query(query);
        result.recordset.forEach(row => {
            const code = row.code_2.trim();
            aName[code] = row.name.trim();
        });

        let aBag       = '';
        let listCnt    = 0;
        let realAir    = '';
        let beforeAir  = data.beforeAir || '';
        let beforeAir2 = data.beforeAir2 || '';
        let aSearchAir = {};
        let aDep       = [];
        let startAir   = [];
        const segStore = [aData_, aData2_, aData3_, aData4_];
        for (let routeCnt = 0; routeCnt < RouteCount; routeCnt++) {
            const segData = segStore[routeCnt] || aData_;
            //console.log(routeCnt)
            //console.log(segData)
            let depCnt = 0;
            let Minor = routeCnt + 1;
            let aPort = [];
            for (const [key, vals] of Object.entries(segData || {})) {
                let val;
              
                let valData = [];
                if (!vals[0]) {
                    valData = Object.values(vals);
                    val = valData[0];
                } else {
                    val = vals[0];
                }
              
                const code = key.substring(0, 2);

                const airTmp   = val.split('||');
                const schTmp   = (airTmp[0] || '').split('/_/');
                const seatTmp  = (airTmp[1] || '').split('/_/');
                const priceTmp = (airTmp[2] || '').split('/_/');
                const aShare1  = (airTmp[3] || '').split('/_/');
                const aShare2  = (airTmp[4] || '').split('/_/');

                // StrClear: 숫자만 추출하는 유틸 함수 (미리 정의해둬야 함)
                const price1 = Math.round(deps.StrClear(priceTmp[2]));
                const price2 = Math.round(deps.StrClear(priceTmp[3]));
                const price3 = Math.round(deps.StrClear(priceTmp[4]));

                let   arriveCity = schTmp[7];
                let   arriveTime = schTmp[2];
                const aTime      = (schTmp[9] || '').split('|');

                let shareName = '';
                let shareTime = '';

                let aShare = [];

                if ((aShare2[0] || '') !== '') {
                    aShare = aShare2;
                    shareName = '경유2회';
                } else if ((aShare1[0] || '') !== '') {
                    aShare = aShare1;
                    shareName = `${aShare[3]} 경유`;
                } else {
                    aShare = [];
                }

                if ((aShare[0] || '') !== '') {
                    arriveCity = aShare[4];
                    arriveTime = (aShare[6] || '').substring(11, 16); // HH:MM
                  
                    const dDate = dayjs(deps.StrClear(schTmp[9]).substring(0, 8), 'YYYYMMDD');
                    const aDate = dayjs(deps.StrClear(aShare[6]).substring(0, 8), 'YYYYMMDD');
                    //console.log(dDate)
                    if (dDate.isBefore(aDate)) {
                        const intervalDay = aDate.diff(dDate, 'day');
                        arriveTime += `+${intervalDay}`;
                    }
                  
                    const time1 = (aShare1[5] || '').substring(0, 16);
                    const time2 = deps.StrClear(schTmp[4]).substring(0, 16);
                  
                    shareTime = deps.timeTermCheck(time1, time2) + `|${aShare[5]}|${aShare[6]}`;
                } else {
                    const dDate = dayjs(deps.StrClear(schTmp[9]).substring(0, 8), 'YYYYMMDD');
                    const aDate = dayjs(deps.StrClear(schTmp[4]).substring(0, 8), 'YYYYMMDD');
                  
                    const intervalDay = aDate.diff(dDate, 'day');
                    if (intervalDay > 0) {
                        arriveTime += `+${intervalDay}`;
                    }
                }
                const airCode = (schTmp[0] || '').split(':')[0];
                const add1 = `|${aTime[1] || ''}`;
                const add2 = `|${aTime[2] || ''}`;
                aBag = (aShare1[14] || '').split('|');

                const idCode = priceTmp[16]; // 조인 코드

                let Button = `${Minor}^${airCode}|${aShare1[1] || ''}${aShare1[2] || ''}^${seatTmp[0] || ''}|${aShare[10] || ''}^` +
                    `${schTmp[1] || ''}${add1}^${arriveTime}${add2}^${schTmp[3] || ''}|${aShare1[7] || ''}^` +
                    `${schTmp[8] || ''}|${aShare[13] || ''}^${price1}|${price2}|${price3}^${schTmp[14] || ''}^` +
                    `${priceTmp[0] || ''}|${schTmp[15] || ''}|${aShare1[0] || ''}|${aShare1[1] || ''}|${shareTime}^ | ^` +
                    `${schTmp[6] || ''}|${aShare[3] || ''}|${schTmp[12] || ''}|${aShare1[8] || ''}^` +
                    `${schTmp[7] || ''}|${arriveCity || ''}|${schTmp[13] || ''}|${aShare1[9] || ''}^` +
                    `${priceTmp[9] || ''}^    ^${seatTmp[1] || ''}^${idCode}^  ^  ^` +
                    `${priceTmp[5] || ''}|${priceTmp[6] || ''}|${priceTmp[7] || ''}|${priceTmp[19] || ''}|${priceTmp[17] || ''}|${aBag[5] || ''}^  ^  ^` +
                    `${listCnt}^${priceTmp[10] || ''} ,AccountCode|${realAir || ''} |OTHERINFO^${depCnt}`;

                aSearchData["CLS"].push(seatTmp[0]);
                aSearchData["SEAT"].push(seatTmp[1]);
                
                aSearchData["PRICE"].push(price1);
                aSearchData["SPRICE"].push(price1); 
                
                aSearchData["EXPIRE"].push(priceTmp[1]);
                //aSearchData["TAX"].push(tax);
                aSearchData["RULE"].push(priceTmp[3]);
                aSearchData["ATR"].push(priceTmp[5]);
                aSearchData["BUTTON"].push(Button);
                //aSearchData["STATUS"].push(bView);
                aSearchData["PRE_ISSUE"].push(priceTmp[7]);
                aSearchData["ISSUE_TERM"].push(priceTmp[9]);
                aSearchData["ANO_CLS"].push(priceTmp[16]);
                //aSearchData["ANO_FLT"].push(aFltNum);
                //aSearchData["TRANS_CITY"].push(rTmp[2]);
                
                aSearchData["NORMALPRICE"].push(priceTmp[11]);
                aSearchData["ISSUEPRICE"].push(priceTmp[17]);
                
                let diff = '';
                if (departure !== schTmp[6] || arrive !== schTmp[7]) {
                    diff = `<br><span style='font-size:10px;color:#fd4031'>${schTmp[6]} → ${schTmp[7]}</span>`;
                }    
                
                let codeShare = '';
                if (schTmp[14] && schTmp[14] !== '') {
                    codeShare = `<br><span style='font-size:10px;color:#fd4031'>${schTmp[14]} 운항</span>`;
                }

                air = airCode.substring(0, 2);

                const sCity = [];
                if (!aPort[schTmp[6]]) sCity.push(schTmp[6]);
                if (!aPort[schTmp[7]]) sCity.push(schTmp[7]);
                if (aShare1[3] && !aPort[aShare1[3]]) sCity.push(aShare1[3]);
                if (aShare1[4] && !aPort[aShare1[4]]) sCity.push(aShare1[4]);
                if (aShare2[3] && !aPort[aShare2[3]]) sCity.push(aShare2[3]);
                if (aShare2[4] && !aPort[aShare2[4]]) sCity.push(aShare2[4]);
                
                if (sCity.length > 0) {
                    const placeholders = sCity.map(city => `'${city}'`).join(',');
                    const sql = `
                        SELECT portCode, portName, cityName, portName_en, cityName_en 
                        FROM OYE2021.DBO.airPort_code 
                        WHERE portCode IN (${placeholders})
                    `;
                  
                    const result = await pool.request().query(sql); // pool은 MSSQL connection
                  
                    result.recordset.forEach(row => {
                        let { portCode, portName, cityName, portName_en, cityName_en } = row;
                    
                        portName = portName?.trim() || '';
                        cityName = cityName?.trim() || '';
                        portName_en = portName_en?.trim() || '';
                        cityName_en = cityName_en?.trim() || '';
                    
                        if (portName === '') portName = cityName;
                    
                        aPort[portCode.trim()] = portName;
                    });
                }

                const arrayAir = schTmp[0].split(':');

                if (schTmp[8].startsWith('3')) {
                    schTmp[8] = `에어버스 ${schTmp[8]}`;
                } else {
                    schTmp[8] = `보잉 ${schTmp[8]}`;
                }
                
                let sharePortName = '';
				let addSchedule   = '';
				let shareTime2    = '';
				let sharePrice    = '';
				let shareCabin    = '';

                if (aShare1[0]) {
                    // 경유
                    let subCnt = 1;
                    for (const sdata of valData) {
                        const airTmp_   = sdata.split('||');
                        const schTmp    = airTmp_[0].split('/_/');
                        const priceTmp_ = airTmp_[2].split('/_/');
                        const aShare1   = airTmp_[3]?.split('/_/');
                        const aShare2   = airTmp_[4]?.split('/_/');

                        const sDate     = aShare1[5].substring(0, 10);
                        const eDate     = aShare1[6].substring(0, 10);
                        const sTime     = aShare1[5].substring(11, 16);
                        const eTime     = aShare1[6].substring(11, 16);
                        const sYear     = sDate.substring(0, 4);
                        const eYear     = eDate.substring(0, 4);

                        let addTime     = '';

                        if (sDate < eDate) {
                            const dDate = new Date(sDate);
                            const aDate = new Date(eDate);
                            const diffTime = Math.abs(aDate - dDate);
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            addTime = `+${diffDays}`;
                        }

                        let baggage = '';
                        let hiddenName = '';
                        let hiddenPort = '';

                        aBag = priceTmp[13].split('|');
                        if (parseInt(aBag[0]) > 0) baggage = `${aBag[0]}pc`;
                        if (parseInt(aBag[1]?.trim()) > 0) baggage += `${aBag[1]}kg`;

                        let baggage2 = '';
                        aBag = aShare1[14].split('|');
                        if (parseInt(aBag[0]) > 0) baggage2 = `${aBag[0]}pc`;
                        if (parseInt(aBag[1]?.trim()) > 0) baggage2 += `${aBag[1]}kg`;

                        seatTmp[2] = seatTmp[2]?.trim() || '';

                        shareTime = deps.timeTermCheck(
                            deps.StrClear(aShare1[5]).substring(0, 16),
                            deps.StrClear(schTmp[4]).substring(0, 16)
                        );
                        // cabin2 = arrayCabinType[seatTmp[2]]; // ← 이전 방식
                        const cabin2 = aShare1[12]; // 2024-12-17 수정
                        const sharePrice = Number(priceTmp_[2]) + Number(priceTmp_[5]);
                        
                        // if (sharePrice > 0 && StrClear(pr) < sharePrice) sharePrice = `<br>~${numberFormat(sharePrice)}`;
                        // else sharePrice = "";
                        
                        const idCode = priceTmp_[16];

                        if (!shareCabin) {
                            shareCabin = `,${cabin2},${baggage2},${aShare1[11]}`;
                        }
                        
                        const aButton = [
                            `${Minor}^${airCode}|${aShare1[1]}${aShare1[2]}`,
                            `^${seatTmp[0]}|${aShare1[10]}`,
                            `^${schTmp[1]}${add1}^${arriveTime}${add2}`,
                            `^${schTmp[3]}|${aShare1[7]}`,
                            `^${schTmp[8]}|${aShare1[13]}`,
                            `^${price1}|${price2}|${price3}`,
                            `^${schTmp[14]}^${priceTmp[0]}`,
                            `|${schTmp[15]}|${aShare1[0]}|${aShare1[1]}`,
                            `|${shareTime} |${aShare1[5]}| ${aShare1[6]}`,
                            `^ | ^${schTmp[6]}|${aShare1[3]}|${schTmp[12]}|${aShare1[8]}`,
                            `^${schTmp[7]}|${arriveCity}|${schTmp[13]}|${aShare1[9]}`,
                            `^${priceTmp[9]}^    ^${seatTmp[1]}^${idCode}^  ^  `,
                            `^${priceTmp[5]}|${priceTmp[6]}|${priceTmp[7]} | | | `,
                            `^  ^  ^${listCnt}^${priceTmp[10]}|${realAir}`,
                            `|${seatTmp[2]},${baggage},${seatTmp[1]},${cabin2},${baggage2},${aShare1[11]}`,
                            `,${deps.FltTmCheck(shareTime)},${deps.FltTmCheck(String(Number(schTmp[3]) + Number(aShare1[7]) + Number(shareTime)))},${String(aBag[3]).trim()}`,
                            `^${depCnt}`
                        ].join('');
                        const interShareName = (air.toUpperCase() === "KE" && aShare1[1].toUpperCase() === "OZ")
                        ? "<span class=' btn_slim btn_red'> 국제선 아시아나 운항</span>"
                        : "";
                        
                        
                        addSchedule += `
                        <div class='item-in item-innn item-innn_${Minor} ${airCode}${seatTmp[0].trim()}__${aShare1[1].trim()}${aShare1[2].trim()}${aShare1[10].trim()}' id='DepBoxOutline_${Minor}_${depCnt}_${subCnt}'>
                            <div class='item-in-some' onClick="secondChoice('${Minor}','${depCnt}','${subCnt}','${aButton}')" id='DepBoxSub_${Minor}_${depCnt}_${subCnt}'>
                                <div class='radiostyle'></div>
                                <p class='date-tit date-titn'>
                                    ${sYear}
                                    <span class='date-wee'>${deps.getWeekday(sDate)}</span><br>
                                    <span class='date-big'>${deps.cutDate(sDate)}</span>
                                </p>
                                <p class='date-tit date-tite'>
                                    <span class='date-tite-span'>대기시간 ( ${deps.FltTmCheck(shareTime)} )</span>
                                    ${deps.cutTime(sTime)} - ${deps.cutTime(eTime)}${addTime}
                                </p>
                                <div class='flex-route'>
                                    <div class='route-t'>
                                        <span class='route-t-1'><img src='${deps.bbsImgName}/Airline/Search/${aShare1[1].toUpperCase()}.png' class='air-logo' alt=''>${aName[aShare1[1].toUpperCase()]}</span>
                                    </div>
                                    <div class='info-1'>
                                        <span class='info-t-2'>${aShare1[1]}${aShare1[2]} <span class='cored'>${aShare1[10]}</span></span>
                                        <span class='info-t-3'>${schTmp[8]}</span>
                                        <span class='info-t-4'>${cabin2}</span>
                                        <span class='info-t-4 cored'>${baggage}</span>
                                        <span class='info-t-4'>${aShare1[11]} 석</span>
                                        ${interShareName}
                                    </div>
                                </div>
                            </div>
                            <div class='item-in-price'>
                                <div class='price' id='DepBoxPrice_${Minor}_${depCnt}_${subCnt}'>${deps.numberFormat(sharePrice)}원</div>
                            </div>
                            <input type='hidden' value='${aButton}' name='depButton${Minor}' id='depValue${Minor}_${depCnt}_${subCnt}'>
                        </div>
                        `;
                        
                        subCnt++;
                        //console.log(aButton)
                    }
                    schTmp[3] = parseInt(schTmp[3]) + parseInt(aShare1[7]) + parseInt(shareTime);
                    
                    let sharePortName = `
                        <div class='txt_info'>
                        ${aPort[schTmp[7]]}에서 환승 
                        →
                        ${aShare1[4]} ${aPort[aShare1[4]]} T${aShare1[9]}
                        </div>
                    `;

                    shareTime2 = `(<span id='DelayTime_${Minor}_${depCnt}'>${deps.FltTmCheck(shareTime)}</span>)`;

                }

                const sDate   = deps.StrClear(schTmp[9]).substring(0, 8);
                const schDate = deps.StrClear(schTmp[4]).substring(0, 8);

                const addTime = (aTime[0] < schDate) ? "+1" : "";

                const priceTmp10Parts = priceTmp[10].split(",");
                const additionalPrice = adt !== 0 ? parseFloat(priceTmp10Parts[1]) / adt : 0;
                let pr = deps.numberFormat(parseInt(price1) + parseInt(priceTmp[5]) + additionalPrice) + "원";
                //console.log(priceTmp[10])
                let SortClass = "SortClass";

                if (Minor > 1) {
                    pr = "+0원";
                    SortClass = "";
                }

                let baggage = "";
                let hiddenName = "";
                let hiddenPort = "";

                aBag = priceTmp[13].split("|");
                const AccountCode = aBag[2]?.split("^")[2] || "";

                if (parseInt(aBag[0]) > 0) baggage = `${aBag[0]}pc`;
                if (parseInt(aBag[1]) > 0) baggage += `${aBag[1]}kg`;

                if (String(aBag[2]).startsWith("1")) {
                    const hiddenCode = aBag[2].substring(2, 5);
                    hiddenName = `<span class='orange font12px'>${hiddenCode} 숨은경유지</span>`;
                }

                let fitTimStr = "";
                fitTimStr = `<span id='ShareTime_${Minor}_${depCnt}'>${deps.FltTmCheck(schTmp[3])}</span> 소요`;

                let start = "";
                let end = "";

                if (ticket_type === "1") {
                    start = (departure === schTmp[6]) ? "" : "cored";
                    end   = (arrive === arriveCity) ? "" : "cored";
                } else if (ticket_type === "2") {
                    if (Minor === 1) {
                        start = (departure === schTmp[6]) ? "" : "cored";
                        end   = (arrive === arriveCity) ? "" : "cored";
                    } else {
                        start = (arrive === schTmp[6]) ? "" : "cored";
                        end   = (departure === arriveCity) ? "" : "cored";
                    }
                }
                
                seatTmp[2] = String(seatTmp[2]).trim();
                let cabin = seatTmp[2].length === 1 ? arrCabinType[seatTmp[2]] : seatTmp[2];
                
                if (beforeAir === airCode.toUpperCase() && !monthFirstClick && ticket_type === "1") {
                    monthFirstClick = `Departure${Minor}_${depCnt}`;
                }

                tmp = `${seatTmp[2]},${baggage},${seatTmp[1]} ${shareCabin}`;
                Button = Button.replace(/OTHERINFO/g, tmp);
                Button = Button.replace(/AccountCode/g, AccountCode);
                if (sharePrice > 0 && Number(deps.StrClear(pr)) < sharePrice) {
                    sharePrice = "<br>~" + numberFormat(sharePrice);
                } else {
                    sharePrice = "";
                }
                let codeShareClass = codeShare !== "" ? "CodeShareArea" : "";
                if (!baggage) baggage = "짐없음";
                let show = "";

                if (air.toUpperCase() === "H1") {
                    show = "N";
                } else if (addSchedule === "" && air.toUpperCase() === "KE" && priceTmp[9] === "A") {
                    show = "N";
                } else if (addSchedule !== "" && air.toUpperCase() === "KE" && aShare1[1].toUpperCase() === "KE" && priceTmp[9] === "A") {
                    show = "N";
                }

                if (show === "") {
                    aSearchAir[air] = 1;
                    startAir[Minor] = (startAir[Minor] || "") + `
                        <div class='${codeShareClass}' style='border:0px solid red'>
                            <div class='${SortClass} depBox depBox-item DepartureBox${Minor} ${codeShareClass}' data-time='${schTmp[1]}' data-sort='${deps.StrClear(pr)}' id='DepartureBox${Minor}_${depCnt}'>
                                <div class='a-list-item a-list-item-v2' onclick="return airChoice('${Button}')" id='Departure${Minor}_${depCnt}'>
                                    <ul>
                                        <li class='arrowthing'>
                                            <i class='fas fa-chevron-down' style='font-size: 18px;opacity: 0.4'></i>
                                        </li>
                                        <li class='rad1'>
                                            <div class='radiostyle'></div>
                                        </li>
                                        <li class='n1'>
                                            <span>
                                                <img src='${deps.bbsImgName}/Airline/Search/${air.toUpperCase()}.png' class='air-logo'> 
                                                ${airCode.toUpperCase()}
                                            </span> 
                                            ${aName[air.toUpperCase()]} ${codeShare}
                                        </li>
                                        <li class='t1 virtual'>
                                            <span class='${start}'>${schTmp[6]}</span>
                                            <span class='bold'>${deps.cutTime(schTmp[1])}</span>
                                        </li>
                                        <li class='t1' style='width: 1%;'><span class='via'></span></li>
                                        <li class='t1'>
                                            <span class='${end}'>${arriveCity}</span>
                                            <span class='bold'>${deps.cutTime(arriveTime)}</span>
                                        </li>
                                        <li class='t2' style='width:30%;'>
                                            <span>${fitTimStr}</span>
                                            <span class='baggage-t'> ${shareName} ${shareTime2}</span>${hiddenName}
                                        </li>
                                        <li class='t2 wh40'><span>${seatTmp[1]} 석</span></li>
                                        <li class='p1'>
                                            <span class='price' id='SegSum${Minor}_${depCnt}'></span>
                                            <span class='price2' id='Seg${Minor}_${depCnt}'>${pr} ${sharePrice}</span>
                                        </li>
                                        <input type='hidden' value='${Button}' name='depButton' id='depValue${Minor}_${depCnt}'>
                                    </ul>
                                    <div class='d-list-item sub_menu' style='display:none;' id='OpenView${Minor}_${depCnt}'>
                                        <div class='item-in item-in-ins'>
                                            <div class='item-in-some'>
                                            <p class='date-tit date-titn'>
                                                ${sDate.substring(0, 4)}
                                                <span class='date-wee'>${deps.getWeek(deps.getWeekday(sDate))}</span><br>
                                                <span class='date-big'>${deps.cutDate(sDate).substring(5)}</span>
                                            </p>
                                            <p class='date-tit date-tite'>
                                                ${deps.cutTime(schTmp[1])} - ${deps.cutTime(schTmp[2])}${addTime}
                                            </p>
                                            <div class='flex-route'>
                                                <div class='route-t'>
                                                <span class='route-t-1'>
                                                    <img src='${deps.bbsImgName}/Airline/Search/${air.toUpperCase()}.png' class='air-logo' alt=''>
                                                    ${aName[air.toUpperCase()]}
                                                </span>
                                                <span class='route-t-2'>
                                                    ${schTmp[6]} ${aPort[schTmp[6]]} T${schTmp[12]} 
                                                    → ${hiddenPort} ${schTmp[7]} ${aPort[schTmp[7]]} T${schTmp[13]}
                                                </span>
                                                </div>
                                                <div class='info-1'>
                                                <span class='info-t-2'>${arrayAir[0]} <span class='cored'>${seatTmp[0]}</span></span>
                                                <span class='info-t-3'>${schTmp[8]}</span>
                                                <span class='info-t-4'>${cabin}</span>
                                                <span class='info-t-4 cored'>${baggage}</span>
                                                <span class='info-t-4'>${seatTmp[1]} 석</span>
                                                </div>
                                            </div>
                                            </div>
                                            ${sharePortName}
                                        </div>
                                    </div>
                                </div>
                                <div class='d-list-item ds-list-item sub_menu subMenuTab' style='display:none;' id='OpenView${Minor}2_${depCnt}'>
                                    ${addSchedule}
                                </div>
                            </div>
                        </div>
                    `;

                    depCnt++;
                    listCnt++;

                }
            }
            aDep[Minor] = depCnt;
        }

        let name , name2;
        if (!startAir[1] || startAir[1] === "") {
            name  = "검색된 항공편이 없습니다.";
            name2 = "선택하신 조건으로 예약할 수 있는 항공권이 없습니다.<br/>다른조건으로 다시 시도해주세요.";
            startAir[1] = `
              <div id='smallPopup_arti2'>
                <p class='ments'>
                  <span class='ment_title'>
                    ${name}
                  </span>
                  <span class='ment_content'>
                    ${name2}
                  </span>
                </p>
              </div>
            `;
        }
        if (!startAir[2] || startAir[2] === "") {
            if (ticket_type === "2") {
                name  = "검색된 항공편이 없습니다.";
                name2 = "선택하신 조건으로 예약할 수 있는 항공권이 없습니다.<br/>다른조건으로 다시 시도해주세요.";
            } else {
                name  = "편도 항공편을 조회 중입니다.";
                name2 = "편도 조회 시에는 리턴 항공편이 제공되지 않습니다.<br/>다른조건으로 다시 시도해주세요.";
            }
            startAir[2] = `
                <div id='smallPopup_arti2'>
                <p class='ments'>
                    <span class='ment_title'>
                        ${name}
                    </span>
                    <span class='ment_content'>
                        ${name2}
                    </span>
                </p>
                </div>
            `;
        }

        let totalAir = "";
        let airHtml = "";

        for (const airCode in aSearchAir) {
            const air = airCode.toUpperCase();
            if (totalAir !== "") totalAir += "/";
            totalAir += air;

            airHtml += `
                <li>
                <div class="air-c-group custom-checkbox">
                    <input class="custom-control-input" type="checkbox" name="SearchAirData" id="SearchAirData_${air}" onClick="return searchAirChange(this.value)" value="${air}">
                    <label class="custom-control-label" for="SearchAirData_${air}">
                    <img src="${deps.bbsImgName}/Airline/Search/${air}.png" class="air-icon">${aName[air]}
                    </label>
                </div>
                </li>
            `;
        }

        airHtml = `
            <ul>
                <li>
                <div class="air-c-group custom-checkbox">
                    <input class="custom-control-input" type="checkbox" name="SearchAirData" checked id="SearchAirData_ALL" onClick="return searchAirChange(this.value)" value="">
                    <label class="custom-control-label" for="SearchAirData_ALL">전체항공사</label>
                </div>
                </li>
                ${airHtml}
            </ul>
        `;
        
        let arrReturn = {
            cityName: [],
            date: [],
            dateName: [],
            joinScript: [],
            count:    { 1: [], 2: [], 3: [], 4: [] },
            segData:  { 1: [], 2: [], 3: [], 4: [] },
            startAir: { 1: [], 2: [], 3: [], 4: [] }
          };
        for (let ix = 1; ix <= RouteCount; ix++) {
            const depCityName = data[`dep_city${ix}_name`] + ` → `+ data[`arr_city${ix}_name`];
            const date = data[`dep_date${ix}`];
            const departureDateName = `${deps.cutDate(date)} (${deps.getWeekday(date)})`;
            arrReturn["cityName"].push(depCityName);
            arrReturn["date"].push(date);
            arrReturn["dateName"].push(departureDateName);
            arrReturn["count"][ix].push(aDep[ix]);
            arrReturn["startAir"][ix].push(startAir[ix]);
            //addScript2 += `
            //  parent.document.getElementById("airCityName${ix}").innerHTML = "${depCityName}";
            //  parent.document.getElementById("airDateName${ix}").innerHTML = "${departureDateName}";
            //  parent.document.getElementById("airListArea${ix}").innerHTML = \`${startAir[ix]}\`;
            //  parent.document.frmForm.depCount${ix}.value = "${aDep[ix]}";
            //`;
        }
        //console.log(joinData)
        if(ticket_type === "1") arrReturn["startAir"][2].push(startAir[2]);
        for (const [key, data] of Object.entries(joinData)) {
            arrReturn["joinScript"].push(`${key}//${data}`);
        }
        for (const [key, data] of Object.entries(aData)) {
            arrReturn["segData"][1].push(`${key}//${data}`);
        }
        if (typeof aData2 !== 'undefined' && aData2) {
            for (const [key, data] of Object.entries(aData2)) {
                arrReturn["segData"][2].push(`${key}//${data}`);
            }
        }
        if (typeof aData3 !== 'undefined' && aData3) {
            for (const [key, data] of Object.entries(aData3)) {
                arrReturn["segData"][3].push(`${key}//${data}`);
            }
        }
        if (typeof aData4 !== 'undefined' && aData4) {
            for (const [key, data] of Object.entries(aData4)) {
                arrReturn["segData"][4].push(`${key}//${data}`);
            }
        }
        arrReturn["airData"]         = airHtml;
        arrReturn["monthFirstClick"] = monthFirstClick;
        res.json ({success:'ok', datas : arrReturn});
    }
}