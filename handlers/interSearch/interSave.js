const deps = require('../../src/common/dependencies');
const { calculateAge } = require('../../src/utils/ages');
const { uidNext } = require('../../src/utils/idxFunction');
const { interlineLogSave } = require('../../src/utils/database');

module.exports = async (req, res) => {
    const data        = req.body;
    const AviaLoginId = req.cookies?.AviaLoginId || '';
    const b2bMASTER   = req.cookies?.b2bMASTER || '';
    const b2bSiteCode = req.cookies?.b2bSiteCode || '';
    let   { ticket_type , RouteCount , departure , arrive , airRule1 , atr_yes , dep_tel , site_code } = data;
    let   { adt , chd , inf , adult_price , child_price, infant_price , issueCommSite } = data;
    let brandType = data.brandType ?? '';
    if (!child_price) child_price = 0 ;
    if (!infant_price) infant_price = 0 ;

    const pool = await deps.getPool();
    let errorMsg            = '';
    let DepartureDate       = '';
    let age                 = '';
    let birthday            = '';
    let bspSiteCode         = 'OY00170';
    let LogData             = '';
    let seatStatus          = 'LL';
    let airRule2_           = '';
    let foreign_addr        = '';
    let orgArrive           = '';
    let ValidatingCarrier   = '';
    let firstDeparture      = '';
    adt = parseInt(adt);
    chd = parseInt(chd);
    inf = parseInt(inf);

    if (!adult_price || !airRule1) {
        errorMsg += `주문이 정상적으로 이루어 지지 않았습니다. 처음부터 다시 시도 하시기 바랍니다.\n`;
    }
    if (chd > 0 && child_price == 0) {
        errorMsg += `소아 주문이 정상적으로 이루어 지지 않았습니다. 검색부터 다시 시도 하시기 바랍니다.\n`;        
    }

    if (issueCommSite < 0) {
        errorMsg += `발권수수료는 0보다 작을수 없습니다.\n`;
    } else {
        issueCommSite = parseInt(issueCommSite); // int 변환
    }

    // 여정 구간 처리
    for (let routeCnt = 1; routeCnt < 9; routeCnt++) {
        const airCode = eval(`data.airCode${routeCnt}`);
        const departureTime = eval(`data.DepartureTime${routeCnt}`);
        
        if (airCode && departureTime) {
            DepartureDate = departureTime.slice(0, 10);
        }
    }

    const eng_name1 = data.tename1_1.trim().toUpperCase();  // 2024-06-21 추가
    const members = adt + chd + inf;
    if (eng_name1 !== "") {
        for (let ix = 1; ix <= members; ix++) {
            const sex = eval(`data.tsex_${ix}`);
            let birthday = eval(`data.tbirth_${ix}`).toUpperCase();
            if (sex === "MC" || sex === "FC") {
                age = calculateAge(birthday, DepartureDate);
                if (age > 12) {
                    errorMsg += `${ix} 번째 소아 나이가 초과 되었습니다. \n`;
                } else if (age < 3) {
                    errorMsg += `${ix} 번째 소아 나이 설정이 잘못 되었습니다. \n`;
                }
            } else if (sex === "MI" || sex === "FI") {
                age = calculateAge(birthday, DepartureDate);
                if (age > 2) {
                    errorMsg += `${ix} 번째 유아 나이가 초과 되었습니다.\n &nbsp; -- 24개월 미만으로 지정 하세요 \n`;
                }
            } else if (birthday) {
                age = calculateAge(birthday, DepartureDate);
                if (age < 13) {
                    errorMsg += `${ix} 번째 성인 나이(${age}) 입력이 잘못 되었습니다.\n &nbsp; -- 13세 이상으로 지정하세요 \n`;
                }
            }
        }
    }

    const table  = "interline";
    const table1 = "interline_pax";
    const table2 = "interline_routing";
    const aSql   = [];
    const uid    = await uidNext(table,pool);
    //uid = 137811;

    let sql        = '';
    let manager_id = '';
    const transaction = new deps.sql.Transaction(pool);
    if (!errorMsg) {
        try {
            await transaction.begin(); // 트랜잭션 시작
        
            
            let airCode = data.airCode1.slice(0,2) ;
            let total_amount = deps.StrClear(data.TotalPrice);

            if (!atr_yes || atr_yes === "UAPI") atr_yes = "G"; // 디폴트 발권 GDS

            dep_tel		= deps.aes128Encrypt(deps.getNow().aviaSecurityKey,deps.StrClear(dep_tel));

            const username1 = data.username1.trim();
            const username2 = data.username2.trim();

            res.cookie("OaasSetCookieEng1" ,username1  , { maxAge: 86400 * 1000 * 30 });
            res.cookie("OaasSetCookieEng2" ,username2  , { maxAge: 86400 * 1000 * 30 });
            res.cookie("OaasSetCookieTel1" ,dep_tel    , { maxAge: 86400 * 1000 * 30 });
            //res.cookie("OaasSetCookieTel2" ,arr_tel   , { maxAge: 86400 * 1000 * 30 });
            res.cookie("OaasSetCookieEmail",data.email , { maxAge: 86400 * 1000 * 30 });
            res.cookie("OaasSetCookieSite" ,site_code  , { maxAge: 86400 * 1000 * 30 });
            res.cookie("OaasSetCookieName" ,data.site_name  , { maxAge: 86400 * 1000 * 30 });

            const issueComm1 = data.issueComm1;
            const issueComm2 = data.issueComm2;
            const issueComm3 = data.issueComm3;

            const order_name = username1+' '+username2;
            if (!manager_id && !site_code) manager_id = AviaLoginId;
            if (!site_code)     site_code = b2bSiteCode;
            if (AviaLoginId)    operator = AviaLoginId;
            if (!operator)      operator = "Auto";

            sql = `
                INSERT INTO ${table} 
                (uid, site_code, manager_id, order_date, ticket_type, adult_member, child_member, infant_member, adult_tax, child_tax, infant_tax, memo, operator, order_name,
                air_amount, child_amount, infant_amount, total_amount, input_amount, status, open_ticket, dep_tel, arr_tel, atr_yes, branch, support_site, block_code, RecLoc, TL, 
                issueComm, issueCommAdt, issueCommChd, issueCommInf, in_status, airPnr, issue_date) 
                VALUES 
                (@uid, @site_code, @manager_id, @order_date, @ticket_type, @adt, @chd, @inf,
                @adult_tax, @child_tax, @infant_tax, @memo, @operator, @order_name,
                @adult_price, @child_price, @infant_price, @total_amount, @total_amount2, '', '', @dep_tel, @arr_tel, @atr_yes, '2', 
                '', '', '', '', @issueComm, @issueCommAdt, @issueCommChd, @issueCommInf, '1', '', '')
            `;
            (!data.child_tax) ? child_tax  = 0 : child_tax  = data.child_tax;
            (!data.child_tax) ? infant_tax = 0 : infant_tax = data.infant_tax;
            
            await transaction.request()
                .input('uid', deps.sql.Decimal(18,2), uid)
                .input('site_code', deps.sql.NVarChar, site_code)
                .input('manager_id', deps.sql.NVarChar, manager_id)
                .input('order_date', deps.sql.NVarChar, deps.getNow().NOWSTIME)
                .input('ticket_type', deps.sql.NVarChar, ticket_type)
                .input('adt', deps.sql.Int, adt)
                .input('chd', deps.sql.Int, chd)
                .input('inf', deps.sql.Int, inf)
                .input('adult_tax', deps.sql.Decimal(18,2), data.adult_tax)
                .input('child_tax', deps.sql.Decimal(18,2), child_tax)
                .input('infant_tax', deps.sql.Decimal(18,2), infant_tax)
                .input('memo', deps.sql.NVarChar, data.memo)
                .input('operator', deps.sql.NVarChar, operator)
                .input('order_name', deps.sql.NVarChar, order_name)
                .input('adult_price', deps.sql.Decimal(18,2), adult_price)
                .input('child_price', deps.sql.Decimal(18,2), child_price)
                .input('infant_price', deps.sql.Decimal(18,2), infant_price)
                .input('total_amount', deps.sql.Decimal(18,2), total_amount)
                .input('total_amount2', deps.sql.Decimal(18,2), total_amount) // input_amount
                .input('dep_tel', deps.sql.NVarChar, dep_tel)
                .input('arr_tel', deps.sql.NVarChar, dep_tel) // 원래도 dep_tel로 넣으셨길래 동일 처리
                .input('atr_yes', deps.sql.NVarChar, atr_yes)
                .input('issueComm', deps.sql.Decimal(18,2), data.issueComm)
                .input('issueCommAdt', deps.sql.Decimal(18,2), issueComm1)
                .input('issueCommChd', deps.sql.Decimal(18,2), issueComm2)
                .input('issueCommInf', deps.sql.Decimal(18,2), issueComm3)
                .query(sql);
            
            const logData = `
                항공료 | 성인: ${adult_price} / 소아: ${child_price} / 유아: ${infant_price} | 총금액: ${total_amount} | ${bspSiteCode} 
                택스 | 성인: ${data.adult_tax} / 소아: ${data.child_tax} / 유아: ${data.infant_tax} / CRS: ${atr_yes}  / IC: ${data.issueComm}, ${issueComm1}, ${issueComm2}, ${issueComm3} ICS: ${issueCommSite} : C: ${data.customPrice} | Adt: ${adt} Chd: ${chd} Inf: ${inf}
                brandType: ${brandType}
            `;

            let aBrand  = [];
            let aAirSeg = [];
            for (let routeCnt = 1; routeCnt < 5; routeCnt++) {
                const BrandTier = eval(`data.BrandTier${routeCnt}`); 
                aBrand.push(BrandTier);  // 배열에 추가
            }
            let minor_num = 1;
            for (let routeCnt = 1; routeCnt < 9; routeCnt++) {
                const airCode       = eval(`data.airCode${routeCnt}`);
                if (airCode) {
                    const depCity       = eval(`data.depCity${routeCnt}`);
                    const arrCity       = eval(`data.arrCity${routeCnt}`); 
                    const airClass      = eval(`data.airClass${routeCnt}`);
                    const DepartureTime = eval(`data.DepartureTime${routeCnt}`);
                    const ArriveTime    = eval(`data.ArriveTime${routeCnt}`);
                    const airPrice      = eval(`data.airPrice${routeCnt}`);
                    const Flt_time      = eval(`data.airFltTm${routeCnt}`);
                    const airEquip      = eval(`data.airEquip${routeCnt}`);
                    const Baggage       = eval(`data.Baggage${routeCnt}`);
                    const Distance      = eval(`data.Distance${routeCnt}`);
                    const Farebasis     = eval(`data.Farebasis${routeCnt}`);
                    const Groups        = eval(`data.Groups${routeCnt}`);
                    const CabinClass    = eval(`data.Cabin${routeCnt}`);
                    const OperatingAir  = eval(`data.OperatingAirline${routeCnt}`);
                    const airSeg        = eval(`data.airSeg${routeCnt}`);
                    const airRule       = eval(`data.airRule${routeCnt}`);
                    if (!firstDeparture) firstDeparture = deps.StrClear(DepartureTime).slice(0,8)
                    
                    depTime             = deps.StrClear(DepartureTime);
                    arrTime             = deps.StrClear(ArriveTime);
                    aAirSeg.push(airSeg);

                    const citycode = depCity + arrCity;
                    if (depCity !== eval(`data.arrCity${routeCnt-1}`) && minor_num > 1) {
                        minor_num ++;
                    }
                    airRule2_ = '';
                    if (atr_yes === "G") {
                        sql    = ` SELECT FareRuleKey FROM ${deps.hubGds}HubGalileoFare WHERE FareInfoRef = '${airRule}' `;
                        result = await pool.request().query(sql);
                        if (result.recordset && result.recordset.length > 0) {
                            airRule2_ = result.recordset[0].FareRuleKey;
                        }
                    }
                    sql = `
                        INSERT INTO ${table2} (uid_minor, minor_num, in_date, out_date, citycode, air_code, air_class, start_time1, start_time2, air_price, Flt_time, air_equip, seat_status, OperatingAirline, GoodCode, airSeg, airRule, CabinClass, DepartureTime, ArriveTime, FarebasisCode, Groups, ex_baggage, Distance, BrandTier)
                        VALUES
                        (${uid}, '${minor_num}', '${depTime.slice(0, 8)}', '${arrTime.slice(0, 8)}', '${citycode}', '${airCode}', '${airClass}', '${depTime.slice(8, 12)}', '${arrTime.slice(8, 12)}', '${airPrice}', '${Flt_time}', '${airEquip}', '${seatStatus}', '${OperatingAir}', '${airRule}', '${airSeg}', '${airRule2_}', '${CabinClass}', '${DepartureTime}', '${ArriveTime}', '${Farebasis}', '${Groups}', '${Baggage}', '${Distance}', '${aBrand[Groups - 1]}')
                    `;
                    await transaction.request().query(sql);
                    minor_num ++;
                }
            }

            if (data.foreign_addr1 && data.foreign_addr1.trim() !== '') {
                let foreign_addr = `${data.foreign_addr1.trim()}_/${data.foreign_addr2.trim()}_/${data.foreign_addr3.trim()}_/${data.foreign_addr4.trim()}`;
                foreign_addr = foreign_addr.replace(/['&?]/g, '');
            }
            if (ticket_type === "3") orgArrive = data.arr_city1; else orgArrive = arrive;
            
            // 안전 체크
            if (atr_yes === "A") {
                const tmp = String(data.airSeg1 ?? '').split("_");
                const TransactionId = tmp[0];
                const SequenceNumber = tmp[1];
                sql = `
                    SELECT ValidatingCarrier
                    FROM ${deps.hubSabre}HubTPA_extensions
                    WHERE TransactionId = '${TransactionId}'
                    AND SequenceNumber = '${SequenceNumber}'
                `;
                result = await pool.request().query(sql);
                if (result.recordset && result.recordset.length > 0) {
                    ValidatingCarrier = result.recordset[0].ValidatingCarrier;
                }
            }
            brand = String(brandType ?? '').trim().split(/\s+/).pop();
            sql = `
                INSERT INTO interline_minor
                (uid_minor, email, first_departure, add_baggage, AdtTicket, AdtClass, TaxInfo, air_price1,
                TraceId, foreign_addr, bspSiteCode, Price_Key, searchGrade, issueCommSite, orgArrive,
                AccountCode, customPrice, bookingKey, main_air, brandType)
                VALUES
                (@uid,  @email, @firstDeparture, @add_baggage, @AdtTicket, @AdtClass, @TaxInfo,  @airPrice1,
                @TraceId, @foreign_addr, @bspSiteCode, @Price_Key, @grade, @issueCommSite, @orgArrive,
                @AccountCode, @customPrice, @bookingKey, @main_air, @brand);
            `;
            await transaction.request()
                .input('uid', deps.sql.Decimal(18,2), uid)
                .input('email', deps.sql.NVarChar, data.email)
                .input('firstDeparture', deps.sql.NVarChar, firstDeparture) // YYYYMMDD 형식이면 NVarChar로 저장
                .input('add_baggage', deps.sql.NVarChar, data.add_baggage)
                .input('AdtTicket', deps.sql.NVarChar, data.AdtTicket)
                .input('AdtClass', deps.sql.NVarChar, data.AdtClass)
                .input('TaxInfo', deps.sql.NVarChar, data.TaxInfo)
                .input('airPrice1', deps.sql.Decimal(18,2), data.airPrice1)
                .input('TraceId', deps.sql.NVarChar, data.TraceId)
                .input('foreign_addr', deps.sql.NVarChar, foreign_addr)
                .input('bspSiteCode', deps.sql.NVarChar, bspSiteCode)
                .input('Price_Key', deps.sql.NVarChar, data.Price_Key)
                .input('grade', deps.sql.NVarChar, data.grade)
                .input('issueCommSite', deps.sql.Decimal(18,2), data.issueCommSite)
                .input('orgArrive', deps.sql.NVarChar, orgArrive)
                .input('AccountCode', deps.sql.NVarChar, data.AccountCode)
                .input('customPrice', deps.sql.Decimal(18,2), data.customPrice)
                .input('bookingKey', deps.sql.NVarChar, '')               // PHP에서 '' 고정
                .input('main_air', deps.sql.NVarChar, ValidatingCarrier)  // PHP: $ValidatingCarrier
                .input('brand', deps.sql.NVarChar, brand)
                .query(sql);
        

            // 모든 쿼리가 성공적으로 실행되었으면 COMMIT
            await interlineLogSave (pool, {uid, query:logData });
            
            for (let ix = 1; ix <= members; ix++) {
                let eng_name1 = String(eval(`data.tename1_${ix} || ''`)).trim().toUpperCase();
                let eng_name2 = String(eval(`data.tename2_${ix} || ''`)).trim().toUpperCase();
                let country   = eval(`data.tcountry_${ix} || ''`);
                let passport  = String(eval(`data.tpassport_${ix} || ''`)).toUpperCase();
                let expire    = String(eval(`data.texpire_${ix} || ''`)).toUpperCase();
                let sex       = eval(`data.tsex_${ix} || ''`);
                let birthday  = String(eval(`data.tbirth_${ix} || ''`)).toUpperCase();
                let org_name  = eval(`data.org_name_${ix} || ''`);
                let tdc_code  = eval(`data.tdc_code_${ix} || ''`);

                let tel1      = eval(`data.ttel1_${ix} || ''`);
                let tel2      = eval(`data.ttel2_${ix} || ''`);
                
                if (passport !== '') passport = deps.aes128Encrypt(deps.getNow().aviaSecurityKey, passport);
                if (birthday !== '') birthday = deps.aes128Encrypt(deps.getNow().aviaSecurityKey, birthday);
                if (expire   !== '') expire   = deps.aes128Encrypt(deps.getNow().aviaSecurityKey, expire);
                if (tel1     !== '') tel1     = deps.aes128Encrypt(deps.getNow().aviaSecurityKey, tel1);
                if (tel2     !== '') tel2     = deps.aes128Encrypt(deps.getNow().aviaSecurityKey, tel2);
                
                if (tdc_code !== '') {
                    const tmp = tdc_code.split('_/');
                    tdc_code = `${tmp[5]}_/${tmp[1]}_/${tmp[4]}`;
                }
                // 띄워쓰기 제거
                if (/7C|ZE/i.test(airCode)) {
                    eng_name1 = eng_name1.replace(/ /g, '');
                    eng_name2 = eng_name2.replace(/ /g, '');
                }
                sql = `
                INSERT INTO interline_pax (
                    uid_minor, minor_num, eng_name1, eng_name2, country, passport, expire, sex, birthday,
                    ticket_number, fare_send, tmu_send, org_name, dc_code, tel_number, tel_number2, method_type
                    ) VALUES (
                        @uid_minor, @minor_num, @eng_name1, @eng_name2, @country, @passport, @expire, @sex, @birthday,
                        @ticket_number, 'N', 'N', @org_name, @dc_code, @tel_number, @tel_number2, '1'
                        )
                        `;
                await transaction.request()
                    .input('uid_minor',    deps.sql.Int, uid)                // uid 타입에 맞춰서 Int 또는 NVarChar
                    .input('minor_num',    deps.sql.Int, ix)
                    .input('eng_name1',    deps.sql.NVarChar, eng_name1)
                    .input('eng_name2',    deps.sql.NVarChar, eng_name2)
                    .input('country',      deps.sql.NVarChar, country)
                    .input('passport',     deps.sql.NVarChar, passport)
                    .input('expire',       deps.sql.NVarChar, expire)
                    .input('sex',          deps.sql.NVarChar, sex)
                    .input('birthday',     deps.sql.NVarChar, birthday)
                    .input('ticket_number',deps.sql.NVarChar, '')
                    .input('org_name',     deps.sql.NVarChar, org_name)
                    .input('dc_code',      deps.sql.NVarChar, tdc_code)
                    .input('tel_number',   deps.sql.NVarChar, tel1)
                    .input('tel_number2',  deps.sql.NVarChar, tel2)
                    .query(sql);                
                }
                //await transaction.rollback();
                await transaction.commit();
                //console.log("Success");
        } catch (error) {
            // 오류 발생 시 롤백
            console.log("Error"+error);
            await transaction.rollback();
        }
    }
    const html = '';
    if (errorMsg) rs = errorMsg; else rs = 'ok';
    res.json ({success: rs, uid: uid });
}