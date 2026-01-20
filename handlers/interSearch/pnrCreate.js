const deps = require('../../src/common/dependencies');
const { uapiGalAirPrice } = require('../../src/utils/functionGalileo');
const {} = require('../../src/utils/functionSabre');
const { roundUp } = require('../../src/utils/numberSum');
const { calculateAge , convertDays } = require('../../src/utils/ages');
const { dataPick, mainInterQuery , interlineLogSave } = require('../../src/utils/database');

module.exports = async (req, res) => {
    const data        = req.body;
    const AviaLoginId = req.cookies?.AviaLoginId || '';
    const b2bMASTER   = req.cookies?.b2bMASTER || '';
    const b2bSiteCode = req.cookies?.b2bSiteCode || '';
    let   errorMsg     = '';
    let   datas        = '';
    let   airCode      = '';
    let   sql          = '';
    let   result       = '';
    const uid          = data.uid;
    const RecLoc       = data.RecLoc;
    const in_status    = data.in_status;
    const aviaSecurityKey = deps.getNow().aviaSecurityKey;

    pool = await deps.getPool();
    let mainRow   =  await mainInterQuery (uid);
    const atr_yes = mainRow.atr_yes.trim();
    let pData     = mainRow;
    pData.Branch  = 'P7144368';
    pData.pool    = pool;
    pData.AGTTEL  = '01026949511';
    pData.AGTNAME = 'AVIANEXT';
    let aApisData = [];
    let eApisData = [];
    let resData   = [];
	if (RecLoc) {
		await interlineLogSave(pool , {uid, query: "PNR 이 이미 생성 되어 있습니다"});
		errorMsg += `PNR 이 이미 생성 되어 있습니다.\n`;
	}

    if (mainRow.in_status === "2") {
        await interlineLogSave(pool , {uid,query: "현재 PNR 생성중입니다. 잠시후 재검색 하시기 바랍니다."});
		errorMsg += `P현재 PNR 생성중입니다. 잠시후 재검색 하시기 바랍니다.\n`;
    } else {
        sql = `update interline set in_status = '2' where uid = @uid`;
        await pool.request().input('uid',deps.sql.Int, uid).query(sql);
    }
    if (!errorMsg) {
        let exceedMsg = '';
        sql = `
            SELECT LTRIM(RTRIM(a.eng_name1)) AS eng_name1, LTRIM(RTRIM(a.eng_name2)) AS eng_name2, b.in_date, b.air_code, b.citycode
            FROM interline_pax AS a
            LEFT JOIN interline_routing AS b ON a.uid_minor = b.uid_minor
            WHERE a.uid_minor = @uid
            ORDER BY a.minor_num 
        `;
        result = await pool.request().input('uid', deps.sql.Int , uid).query(sql);
        for (const row of result.recordset) {
            const { eng_name1, eng_name2, in_date, air_code, citycode } = row;
            sql = `SELECT COUNT(*) AS cnt 
                    FROM interline AS a
                    LEFT JOIN interline_pax     AS b ON a.uid = b.uid_minor
                    LEFT JOIN interline_routing AS c ON a.uid = c.uid_minor
                    WHERE LTRIM(RTRIM(b.eng_name1)) = @eng_name1
                    AND LTRIM(RTRIM(b.eng_name2)) = @eng_name2
                    AND c.in_date  = @in_date
                    AND c.air_code = @air_code
                    AND a.RecLoc <> '' 
            `;
            result = await pool.request()
                .input('eng_name1', deps.sql.NVarChar, eng_name1)
                .input('eng_name2', deps.sql.NVarChar, eng_name2)
                .input('in_date',   deps.sql.NVarChar, in_date)
                .input('air_code',  deps.sql.NVarChar, air_code)
                .query(sql);
            const cnt = result.recordset[0]?.cnt || 0;
            if (cnt > 3) {
                exceedMsg += `${eng_name1}/${eng_name2} 님의 중복 예약이 3건이 초과되었습니다.(${in_date} ${air_code} ${citycode}) <br> `;
            }
        }
        if (exceedMsg) {
            await interlineLogSave(pool, {uid,query: exceedMsg});
		    errorMsg += exceedMsg;
        }
    }
    if (!errorMsg) {

        await interlineLogSave (pool , {uid , query:'PNR 생성중',id:AviaLoginId});

        airCode = mainRow.FirstAir.slice(0,2);
        pData.Email = (pData?.Email ?? '')
                .replace(/@/g, '//')
                .replace(/-/g, './')
                .replace(/_/g, '..');

        if (!pData.dep_tel) pData.dep_tel = '820269523455';
        else pData.dep_tel = deps.aes128Decrypt(aviaSecurityKey  ,pData.dep_tel);

        sql    = ` SELECT COUNT(*) AS cnt FROM interline_quote WHERE uid_minor = @uid `;
        result = await pool.request().input('uid',deps.sql.Int, uid).query(sql);
        pData.QuoteCount = result.recordset[0]?.cnt || 0;

        pData.pcc           = "C4KL";
        pData.agctel        = "02-6953-6698";

        if (pData.foreign_addr){
            const clean = (v) => String(v ?? '').replace(/[\/\-,.]/g, '');
            const raw   = pData.foreign_addr;
            const parts = raw.split('_/');
            const t0    = clean(parts[0]); // addr line1
            const t1    = clean(parts[1]); // addr line2
            const t2    = clean(parts[2]); // city
            const t3    = clean(parts[3]); // state (예상)
            pData.Foreign  = `D/USA/${t3}/${t2}/${t1}/${t0}`;
            aApisData.push(`3DOCA/R/KR`);
            aApisData.push(`3DOCA/${pData.Foreign}`);
        }
        mainRow.qCharge = mainRow.qCharge ? mainRow.qCharge : 0;
        pData.APR = parseInt(mainRow.air_amount) - parseInt(mainRow.issueCommAdt);
        if (mainRow.child_member  > 0) {
            pData.CPR   = parseInt(mainRow.child_amount) - parseInt(mainRow.issueCommChd) ;
            pData.CPR2  = parseInt(mainRow.child_amount) - roundUp(parseInt(mainRow.issueCommChd) * 0.75,2) ;
        }
        if (mainRow.infant_member > 0) {
            pData.IPR   = mainRow.infant_amount;
            pData.IPR2  = parseInt(mainRow.infant_amount) - roundUp(parseInt(mainRow.issueCommInf) * 0.1,2);
        }

        const members = pData.adult_member + pData.child_member;

        sql = `select a.* from interline_routing as a where a.uid_minor = @uid order by a.minor_num `;
        result = await pool.request()
                .input('uid',deps.sql.Int , uid )
                .query(sql);
        let aGood     = [];
        let aCls      = [];
        let Status    = 'NN';
        for (const row of result.recordset) {
            const {
                GoodCode , air_code , air_class , citycode , in_date , out_date , DepartureTime , ArriveTime , start_time1 , start_time2  
                , air_equip , airSeg , Flt_time , FareBasisCode , BrandTier , Distance , OperatingAirline , Groups
            } = row;
            aGood.push(GoodCode);
            aCls.push(air_class);
            
            const fltNumRaw = String(air_code).slice(2, 6);
            const FltNum    = fltNumRaw.padStart(4, '0'); 

            deps.arrPush(pData, 'Departure'         , citycode.slice(0, 3)); // 출발 도시
            deps.arrPush(pData, 'Arrive'            , citycode.slice(3, 6));    // 도착 도시
            deps.arrPush(pData, 'DepartureTime'     , DepartureTime);
            deps.arrPush(pData, 'ArriveTime'        , ArriveTime);
            deps.arrPush(pData, 'Departure_date'    , in_date);
            deps.arrPush(pData, 'Arrive_date'       , out_date);
            deps.arrPush(pData, 'Departure_Time'    , deps.cutTime(start_time1));
            deps.arrPush(pData, 'Arrive_Time'       , deps.cutTime(start_time2));
            deps.arrPush(pData, 'Departure_cls'     , air_class);
            deps.arrPush(pData, 'AirCode'           , air_code.slice(0, 2));
            deps.arrPush(pData, 'AirFltNum'         , air_code.slice(2, 6));
            deps.arrPush(pData, 'AirCls'            , air_class);
            deps.arrPush(pData, 'EQUIP'             , air_equip);
            deps.arrPush(pData, 'AirSeg'            , airSeg);
            deps.arrPush(pData, 'FltTime'           , Flt_time);
            deps.arrPush(pData, 'Farebasis'         , FareBasisCode);
            deps.arrPush(pData, 'BrandTier'         , BrandTier);
            deps.arrPush(pData, 'Distance'          , Distance.trim());
            deps.arrPush(pData, 'Operating'         , OperatingAirline.trim());
            deps.arrPush(pData, 'Group'             , Number(Groups)-1);
        }
        const lastDate = pData.Departure_date[pData.Departure_date.length - 1];

        let name      = '';
        let gubun1    = '';
        let gubun_bx  = '';
        let gubun_gal = '';
        let gender    = '';
        sql = `select a.* from interline_pax as a where a.uid_minor = @uid order by a.minor_num `;
        result = await pool.request()
        .input('uid',deps.sql.Int , uid )
        .query(sql);
        for (const row of result.recordset) {
            let { minor_num , eng_name1 , eng_name2 , sex , birthday , country , passport , expire } = row;
            
            sex  = sex.trim();
            if (birthday.length > 20) birthday = deps.aes128Decrypt(aviaSecurityKey, birthday);
            if (passport.length > 20) passport = deps.aes128Decrypt(aviaSecurityKey, passport);
            if (expire.length   > 20) expire   = deps.aes128Decrypt(aviaSecurityKey, expire);

            if (sex === "M")	   name = "MR";
			else if (sex === "F")  name = "MS";
			else if (sex === "MC") name = "MSTR";
			else if (sex === "FC") name = "MISS";
			else if (sex === "MI") name = "MSTR";
			else if (sex === "FI") name = "MISS";

            if (sex === "M" || sex === "F")			gubun1    = "ADT";
			else if (sex === "MC" || sex === "FC")	gubun1    = "C10";
			else if (sex === "MI" || sex === "FI")	gubun1    = "I18";

			if (sex === "M" || sex === "F")			gubun_bx  = "AD";
			else if (sex === "MC" || sex === "FC")	gubun_bx  = "CH";
			else if (sex === "MI" || sex === "FI")	gubun_bx  = "IN";

			if (sex === "M" || sex === "F")			gubun_gal = "ADT";
			else if (sex === "MC" || sex === "FC")	gubun_gal = "CNN";
			else if (sex === "MI" || sex === "FI")	gubun_gal = "INF";

            gender = sex.slice(0,2) === "M" ? 'Male' : 'Female';

            deps.arrPush(pData, "PAX"       , `${eng_name1}/${eng_name2}`);
            deps.arrPush(pData, "PLAST"     , eng_name1);
            deps.arrPush(pData, "PFIRST"    , eng_name2);
            deps.arrPush(pData, "TITLE"     , name);
            deps.arrPush(pData, "GUBUN"     , gubun1);
            deps.arrPush(pData, "GUBUNBX"   , gubun_bx);
            deps.arrPush(pData, "GUBUNGAL"  , gubun_gal);
            deps.arrPush(pData, "BIRTH"     , convertDays(birthday,'B'));
            deps.arrPush(pData, "COUNTRY"   , country);
            deps.arrPush(pData, "PASSPORT"  , passport);
            deps.arrPush(pData, "EXPIRE"    , convertDays(expire,'B'));
            deps.arrPush(pData, "SEX"       , sex);
            deps.arrPush(pData, "GENDER"    , gender);
            deps.arrPush(pData, "BIRTH2"    , convertDays(birthday,'A'));
            deps.arrPush(pData, "EXPIRE2"   , convertDays(expire,'A'));

            const age = calculateAge(birthday,lastDate);
            deps.arrPush(pData, "AGE", age);

            if (gubun_gal === "CNN") deps.arrPush(pData, "CHDAGE", age);
            if (gubun_gal === "INF") deps.arrPush(pData, "INFAGE", age);

            let sex2 = sex;
            if (sex === "FC") sex = "F";
            else if (sex === "MC") sex = "M";

            eApisData.push(`P-${country}-${passport}-${country}-${convertDays(birthday,'B')}-${sex2}-${convertDays(expire,'B')}-${eng_name1}-${eng_name2}-${minor_num}`);

            let apis_data = "";
            if (passport !== "") {
                apis_data = `P/${country}/${passport}/${country}/${birthday}/${sex}/${expire}/${eng_name1}/${eng_name2}`;
            }
            deps.arrPush(pData, "APIS", apis_data);

            // gubun1 체크
            if (gubun1 === "I18") {
                deps.arrPush(pData, "IPAX"      , `${eng_name1}/${eng_name2}`);
                deps.arrPush(pData, "ITITLE"    , name);
                deps.arrPush(pData, "IGUBUN"    , gubun1);
                deps.arrPush(pData, "IBIRTH"    , birthday);
                deps.arrPush(pData, "ICOUNTRY"  , country);
                deps.arrPush(pData, "IPASSPORT" , passport);
                deps.arrPush(pData, "IEXPIRE"   , expire);
                deps.arrPush(pData, "ISEX"      , sex);
            }
            name = eng_name2;
            //age  = String(age).padStart(2, '0');
        }

        deps.arrPush(pData, "TICKETTYPE", mainRow.ticket_type);        
        deps.arrPush(pData, "OPEN", mainRow.open_ticket);    

        deps.arrPush(pData, "DEP", pData.Departure[0].substring(0, 3));
        deps.arrPush(pData, "ARR", pData.Departure[0].substring(3, 6));

        deps.arrPush(pData, "DEP2", pData.Departure[1]?.substring(0, 3) || '');                    
        deps.arrPush(pData, "ARR2", pData.Departure[1]?.substring(3, 6) || '');                    

        deps.arrPush(pData, "DEP_DATE", pData.Departure_date[0]);            
        deps.arrPush(pData, "ARR_DATE", pData.Arrive_date[0]);            

        deps.arrPush(pData, "DEP_TIME", pData.Departure_Time[0]);            
        deps.arrPush(pData, "ARR_TIME", pData.Arrive_Time[0]);            

        deps.arrPush(pData, "DEP_TIME2", pData.Departure_Time[1]);
        deps.arrPush(pData, "ARR_TIME2", pData.Arrive_Time[1]);

        deps.arrPush(pData, "AIR", pData.AirCode[0]);                      
        deps.arrPush(pData, "AIR2", pData.AirCode?.[1] || '');                    
        deps.arrPush(pData, "DEP_AIR", pData.AirFltNum[0]);              
        deps.arrPush(pData, "ARR_AIR", pData.AirFltNum?.[1]  || '');              

        deps.arrPush(pData, "DEP_CLS", pData.AirCls[0]);                 
        deps.arrPush(pData, "ARR_CLS", pData.AirCls?.[1] || '');                 

        deps.arrPush(pData, "MEMBER", members);                    

        deps.arrPush(pData, "ADTMEM", pData.adult_member);
        deps.arrPush(pData, "CHDMEM", pData.child_member);
        deps.arrPush(pData, "INFMEMBER", pData.infant_member);

        deps.arrPush(pData, "rMembers1", pData.adult_member);
        deps.arrPush(pData, "rMembers2", pData.child_member);
        deps.arrPush(pData, "rMembers3", pData.infant_member);

        //deps.arrPush(pData, "FAREPERSON", fare_person);

        // 전체 금액 (Number 변환 필수!)
        deps.arrPush(pData, "AdultFare",  Number(pData.air_amount)    + Number(pData.adult_tax));
        deps.arrPush(pData, "ChildFare",  Number(pData.child_amount)  + Number(pData.child_tax));
        deps.arrPush(pData, "InfantFare", Number(pData.infant_amount) + Number(pData.infant_tax));

        // 통화 및 기본 운임
        deps.arrPush(pData, "AdultCurrency", "KRW");
        deps.arrPush(pData, "AdultBaseFare",  pData.air_amount);
        deps.arrPush(pData, "ChildBaseFare",  pData.child_amount);
        deps.arrPush(pData, "InfantBaseFare", pData.infant_amount);
        
        let dep_tel = '';
        let AIR = pData.AIR[0];
        if (AIR === "KE") dep_tel = pData.CityCode.substring(3,6) + ' ' + pData.dep_tel;
        else dep_tel = pData.dep_tel;

        pData.DEPTEL = dep_tel;

        let conNameMap = {
            CA: "CTCT ",
            CZ: "CTCM ",
            MU: "CTCT ",
            AI: "LCTCF ",
            CI: "CTCM ",
            CX: "CTCM ",
            DL: "CTC ",
            ET: "LCTC ",
            EY: "LTCT ",
            GA: "LCTC ",
            GE: "CTCM ",
            JL: "CTCT ",
            KA: "CTCM ",
            KE: "CTCM SEL",
            KQ: "CTCM ",
            MH: "CTCM " + (pData.Departure[0] || "") + " ",
            MK: "MRU ",
            PR: "YVR CTC ",
            SQ: "CTCM ",
            TG: "LCTC ",
            "7C": "CTCM SEL ",
            LJ: "CTCM ",
            MF: "CTCM ",
            SC: "CTCT ",
        };
        const conName = conNameMap[AIR] || "";

        pData.CTCM		= conName + '82' + pData.dep_tel.substring(1,pData.dep_tel.length-1);
        pData.ISSUECOMM = pData.issueComm;
        pData.REMARK 	= pData.site_code;
        if (atr_yes === "A") {
            
        } else if (atr_yes === "G") {
            resData = await uapiGalAirPrice (pData);
        }
        // PNR update 
        if (resData[0]) {
            sql = `update interline set RecLoc = @pnr , in_status = @status  where uid = @uid`;
            await pool.request()
                    .input('pnr',    deps.sql.NVarChar , resData[0])
                    .input('status', deps.sql.NVarChar , '1')
                    .input('uid',    deps.sql.Int      , uid)
                    .query(sql);
            sql = `update interline_minor set QuoteDate = @NOWS where uid_minor = @uid `;            
            await pool.request()
                    .input('NOWS',   deps.sql.NVarChar , deps.getNow().NOWS)
                    .input('uid',    deps.sql.Int      , uid)
                    .query(sql);
        }
    }
    if (errorMsg) resData = ['',errorMsg];
    //console.log(resData)
    res.json ({success: 'ok', pnr:resData[0] , errorMsg: resData[1] });
}