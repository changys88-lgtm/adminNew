const fs     = require('fs');
const path   = require('path');
const axios  = require('axios');
const crypto = require('crypto')
const zlib   = require('zlib');
const xml2js = require('xml2js');
const deps   = require('../../src/common/dependencies');
const { uidNext }   = require('../../src/utils/idxFunction');
const https  = require('https');
const http   = require('http');
const dns    = require('dns');
const agent  = new https.Agent({ rejectUnauthorized: false }); // SSL 인증서 검증 안 함
const { resolve } = require('path');
const { reject } = require('promise');

async function createHeader (Token='') {
    const headers = {
        'cache-control': 'no-cache',
        'content-type': 'application/json; charset=utf-8',
        'x-basic-auth': '365-oye-wspQLvbNTTySNyFgs3k4r5m0BmPbBMOos071nBWgLK9Ed6MK1PTKMnG79P/GnHsN'
    };
    if (Token) headers['Authorization'] = `Bearer ${Token}`;
    
    return headers;
}
async function dcjejuSave (Xml) {

}
async function dcjejuCurl(postField='',urls='',method='post',Token='',Logs='') {
    let url = 'https://core.dcjeju.net'+urls;
    const headers = await createHeader(Token);
    dcjejuLogSave (postField);
    try {
        // const response = await axios.post(url, postField, {
        //    headers: header,
        //    timeout: 10000
        // });
        const response = await axios({
            url,
            method,
            data: postField,
            headers,
            timeout: 15000
        });
        let res = response.data;
        if (!Logs) dcjejuLogSave (res);
        return res;
    } catch (err) {
        //const errText = err.response.data.toString('utf-8');
        console.error('[❌ 서버 응답 에러]');
        console.error(err);
    }
}

async function dcjejuAuthLogin() {
    
    let time40 = new Date(Date.now() - 2400 * 1000); // 2400초 전
    time40 = deps.getDateTimeNumber(time40);
    // 최근 토큰 가져오기
    const sqlText = `SELECT TOP 1 * FROM AirDcJeju.dbo.TokenManage WITH (NOLOCK) WHERE Token != '' ORDER BY uid DESC `;
    const result = await pool.request().query(sqlText);
    const row = result.recordset?.[0];

    // up_date 비교
    if (row && row.up_date > time40) {
        return row.Token;
    } else {
        const postData = {
            fName: '장',
            name: '용선',
            mobile: '01026949511'
        };
        let res   = await dcjejuCurl (postData,'/air/auth/login');
        //console.log(res);
        const Token = res.data?.token;
        const uid   = await uidNext('AirDcJeju.dbo.TokenManage',pool);
        await pool.request()
            .input('uid', deps.sql.Int, uid)
            .input('up_date', deps.sql.VarChar, deps.getNow().NOWSTIME)
            .input('Token', deps.sql.NVarChar, Token)
            .query(`
                INSERT INTO AirDcJeju.dbo.TokenManage (uid, up_date, Token)
                VALUES (@uid, @up_date, @Token)
            `);

        return Token;
    }
}

async function dcjejuSearch(pData) {
    const {
        depDate, arr_date, src, dest, ticket_type, grade,
      adt, chd, kid, inf
    } = pData;
    
    const NOWSTIME = deps.getNow().NOWSTIME;
    let pastTime = new Date(Date.now() - 7200 * 1000); // 2400초 전
    pastTime = deps.getDateTimeNumber(pastTime);
    const sql = deps.sql;
    const pastQry = ` select top 1 uid from Domestic.dbo.DomGalileoCache where src = '${src}' and dest = '${dest}' and ticket_type = '1' 
        and dep_date = '${depDate}' and air_code = '' and adt = '${adt}' and chd = '${chd}' and inf = '${inf}' and grade = '${grade}' 
        and up_date > '${pastTime}' order by uid desc `;
    const pastResult = await pool.request().query(pastQry);
    let   uid = pastResult.recordset?.[0]?.uid || '';
    let   sqlText = '';
    let   sqlResult = '';
    if (!uid) {
        const Token = await dcjejuAuthLogin ();
        const postData = {
            depCity     :src,
            arrCity     :dest,
            depDate     :deps.cutDate(depDate),
            adultCnt    :adt,
            childCnt    :chd,
            infantCnt   :inf
        };
        const res = await dcjejuCurl (postData,'/air/schedule','post',Token,'N');
        let aCnt = 0;
        const aSql = [];
        for (const r of res) {
            
            const totalRecord	= r.totalRecord;
            const availPoint	= r.availPoint;
            const carrierCode	= r.carrierCode;
            const carrierNm		= r.carrierNm;
            const fail		    = r.fail;
            const succ		    = r.succ;
            const result		= r.result;
            const errorCode		= r.errorCode;
            const errorMsg		= r.errorMsg;
            const statusCode	= r.statusCode;
            let   ix = 0;
            for (const airs of r.airLine) {
                const remark		= airs.remark;
                const tasf			= airs.tasf;
                const seatCount		= airs.seatCount;
                const isOpCar		= airs.isOpCar; 
                const opCarrierCd	= airs.opCarrierCd || '';
                const opCarrierNm	= airs.opCarrierNm || '';
                const isReturn		= airs.isReturn;
                const classType		= airs.classType;
                const classTypeNm	= airs.classTypeNm;
                const isAvailable	= airs.isAvailable;
                const resrvToken	= airs.resrvToken;
                const q				= airs.q;
                const flight		= airs.flight;
                const flightNumber	= airs.flightNumber;
                const fareType		= airs.fareType;
                const bookingClass	= airs.bookingClass;
                const depCity		= airs.depCity;
                const arrCity		= airs.arrCity;
                const depCityNm		= airs.depCityNm;
                const arrCityNm		= airs.arrCityNm;
                const depDate		= airs.depDate;
                const arrDate		= airs.arrDate;
                const depUDate		= airs.depUDate;
                const arrUDate		= airs.arrUDate;
                let ii = 0;
                for (const fares of airs.fareInfo) {
                    const paxType	= fares.paxType;
                    const amount	= fares.amount;
                    const agFare	= fares.agFare;
                    const tax		= fares.tax;
                    const fuel		= fares.fuel;
                    const total		= fares.total;
                    sqlText = ` ('[UID]','${aCnt}','${ix}','${ii}','${paxType}','${amount}','${agFare}','${tax}','${fuel}','${total}') `;
                    deps.arrPush(aSql,'DomDcJejuSegment_fare',sqlText);
                    ii ++;
                }
                sqlText = ` ('[UID]','${aCnt}','${ix}','${remark}','${tasf}','${seatCount}','${isOpCar}','${opCarrierCd}','${opCarrierNm}','${isReturn}','${classType}','${classTypeNm}','${isAvailable}','${resrvToken}' `;
                sqlText += ` ,'${q}','${flight}','${flightNumber}','${fareType}','${bookingClass}','${depCity}','${arrCity}','${depCityNm}','${arrCityNm}','${depDate}','${arrDate}','${depUDate}','${arrUDate}' )`;
                deps.arrPush(aSql,'DomDcJejuSegment',sqlText);
                ix ++;
            }
            aCnt ++;
        }
        if (aCnt > 0) {
            sqlText = `
                INSERT INTO Domestic.dbo.DomGalileoCache 
                (src, dest, dep_date, ticket_type, up_date, air_code, adt, chd, inf, grade)
                OUTPUT INSERTED.uid
                VALUES (@src, @dest, @depDate, '1', @NOWSTIME, '', @adt, @chd, @inf, @grade)
            `;

            sqlResult = await pool.request()
                .input('src', sql.NVarChar, src)
                .input('dest', sql.NVarChar, dest)
                .input('depDate', sql.NVarChar, depDate)
                .input('NOWSTIME', sql.NVarChar, NOWSTIME)
                .input('adt', sql.Int, adt)
                .input('chd', sql.Int, chd)
                .input('inf', sql.Int, inf)
                .input('grade', sql.NVarChar, grade)
                .query(sqlText);

            //sqlText  = `select uid from Domestic.dbo.DomGalileoCache where src = '${src}' and dest = '${dest}' and ticket_type = '1' and dep_date = '${depDate}' `;
            //sqlText += `and air_code = '' and adt = '${adt}' and chd = '${chd}' and inf = '${inf}' and up_date = '${NOWSTIME}'`;
            //sqlResult = await pool.request.query(sqlText);
            uid = sqlResult.recordset?.[0]?.uid;
                        
            sqlText = `insert into AirDcJeju.dbo.DomDcJejuSegment (uid,airCnt,fCnt,remark,tasf,seatCount,isOpCar,opCarrierCd,opCarrierNm,isReturn,classType,classTypeNm,isAvailable,resrvToken `;
            sqlText += ` ,q,flight,flightNumber,fareType,bookingClass,depCity,arrCity,depCityNm,arrCityNm,depDate,arrDate,depUDate,arrUDate) `;
            sqlText += ` values ${aSql["DomDcJejuSegment"].join(',')} `;
            sqlText = sqlText.replace(/\[UID\]/g, uid);
            await pool.request().query(sqlText);

            sqlText = `insert into AirDcJeju.dbo.DomDcJejuSegment_fare (uid_minor,airCnt,fCnt,minor_num,paxType,amount,agFare,tax,fuel,total) `;
            sqlText += ` values ${aSql["DomDcJejuSegment_fare"].join(',')} `;
            sqlText = sqlText.replace(/\[UID\]/g, uid);
            await pool.request().query(sqlText);
        }
        //console.log(aSql)
    }
    return { success: true, data: uid };
}


function dcjejuLogSave (logdata,type='') {
    const nows    = deps.getNow().NOWS;
    const nowStr  = deps.getNow().NOWSTIME;
    const logFile = `../admin/Logs/${nows}_DcjejuRqRs.txt`;
    if ( typeof logdata  === "object") logdata = JSON.stringify(logdata, null, 2);
    const logData = `[${nowStr}]\r\n${logdata}\r\n\r\n`;
    fs.appendFileSync(logFile, logData);
}

module.exports = {
    dcjejuSearch
};