//const { NVarChar } = require('mssql');
const deps = require('../../src/common/dependencies');
const { uidNext } = require('../../src/utils/idxFunction');
const { minorNext } = require('../../src/utils/database');

module.exports = async (req, res) => {
    const data        = req.body;
    const AviaLoginId = req.cookies?.AviaLoginId || '';
    const b2bMASTER   = req.cookies?.b2bMASTER || '';
    const b2bSiteCode = req.cookies?.b2bSiteCode || '';
    const mode        = data.mode.trim();;    
    const pool        = await deps.getPool();
    let   msg         = '';
    let   sqlText     = '';
    let   sqlResult   = '';
    let   rsCount     = '';
    let   uid         = '';
    let   titleData   = '';
    let   htmlData    = '';
    let   passSql     = '';
    const table       = '';
    const sql         = deps.sql;
    const aes128Encrypt   = deps.aes128Encrypt;
    const aes128Decrypt   = deps.aes128Decrypt;
    const aviaSecurityKey = deps.getNow().aviaSecurityKey;
    const NOWSTIME        = deps.getNow().NOWSTIME;
    const order_num       = data.order_num;

    if (mode === "contain") {
        sqlText   = `select count(*) as cnt from orderSheet_content where order_num = @order_num`;
        sqlResult = await pool.request().input('order_num',sql.NVarChar,order_num).query(sqlText);
        rsCount   = sqlResult.recordset?.[0]?.cnt || 0;
        if (rsCount === 0) {
            sqlText = `insert into orderSheet_content (order_num) values (@order_num)`;
            sqlResult = await pool.request().input('order_num',sql.NVarChar,order_num).query(sqlText);
        }
        try {
            sqlText = `
                update orderSheet_content set
                    contain      = @contain      ,
                    uncontain    = @uncontain    ,
                    notice       = @notice       ,
                    cancelRefund = @cancelRefund
                where order_num  = @order_num
            `;
            sqlResult = await pool.request()
                            .input('contain',sql.NVarChar , data.contain)
                            .input('uncontain',sql.NVarChar , data.uncontain)
                            .input('notice',sql.NVarChar , data.notice)
                            .input('cancelRefund',sql.NVarChar , data.cancelRefund)
                            .input('order_num',sql.NVarChar , order_num)
                            .query(sqlText);
        } catch (err) {
            console.log(err);
            msg = err;
        }
        
    } else if (mode === "paxdata") {
        const len = data.eng_name1.length;
        for (let ix = 0 ; ix < len ; ix ++) {
            const minor = ix + 1;
            const kor_name   = data.kor_name[ix];
            const eng_name1  = data.eng_name1[ix];
            const eng_name2  = data.eng_name2[ix];
            const country    = data.country[ix];
            const passport   = data.passport[ix]   ? aes128Encrypt(aviaSecurityKey,data.passport[ix]) : '';
            const expire     = data.expire[ix]     ? aes128Encrypt(aviaSecurityKey,data.expire[ix]) : '';
            const sex        = data.sex[ix];
            const birthdays  = data.birthdays[ix]  ? aes128Encrypt(aviaSecurityKey,data.birthdays[ix]) : '';
            const birthdays2 = data.birthdays2[ix] ? aes128Encrypt(aviaSecurityKey,data.birthdays2[ix]) : '';
            sqlText   = `select count(*) as cnt from orderSheet_pax where order_num = @order_num and minor_num = @minor`;
            sqlResult = await pool.request().input('order_num',sql.NVarChar,order_num).input('minor',sql.Int,minor).query(sqlText);
            rsCount   = sqlResult.recordset?.[0]?.cnt || 0;
            if (rsCount === 0) {
                sqlText = `insert into orderSheet_pax (order_num,minor_num) values (@order_num,@minor)`;
                await pool.request().input('order_num',sql.NVarChar,order_num).input('minor',sql.Int,minor).query(sqlText);
            }
            try {
                sqlText = `
                    update orderSheet_pax set 
                        kor_name   = @kor_name ,
                        eng_name1  = @eng_name1 , 
                        eng_name2  = @eng_name2 ,
                        country    = @country ,
                        passport   = @passport,
                        expire     = @expire,
                        sex        = @sex,
                        birthdays  = @birthdays,
                        birthdays2 = @birthdays2
                    where order_num = @order_num and minor_num = @minor
                `;
                await pool.request()
                    .input('kor_name'  ,sql.NVarChar , kor_name)
                    .input('eng_name1' ,sql.NVarChar , eng_name1)
                    .input('eng_name2' ,sql.NVarChar , eng_name2)
                    .input('country'   ,sql.NVarChar , country)
                    .input('passport'  ,sql.NVarChar , passport)
                    .input('expire'    ,sql.NVarChar , expire)
                    .input('sex'       ,sql.NVarChar , sex)
                    .input('birthdays' ,sql.NVarChar , birthdays)
                    .input('birthdays2',sql.NVarChar , birthdays2)
                    .input('order_num' ,sql.NVarChar , order_num)
                    .input('minor'     ,sql.Int      , minor)
                    .query(sqlText);
            } catch (err) {
                msg = err;
                console.log(err);
            }
        }
    } else if (mode === "outSettle") {
        sqlText   = `select count(*) as cnt from orderSheet_outsite where order_num = @order_num and minor_num = @num `;
	    sqlResult = await pool.request().input('order_num',sql.NVarChar,order_num).input('num',sql.Int,data.current).query(sqlText);
        rsCount   = sqlResult.recordset?.[0]?.cnt || 0;
        if (rsCount === 0) {
            sqlText = `insert into orderSheet_outsite (order_num,minor_num) values (@order_num , @num)`;
            await pool.request().input('order_num',sql.NVarChar,order_num).input('num',sql.Int,data.current).query(sqlText);
        }
        try {
            sqlText = `update  orderSheet_outsite set 
                            names       = @pro,
                            quantity    = @qun,
                            unit_price  = @uni,
                            total_price = @pri,
                            auth_number = @auh,
                            out_date    = @dat,
                            etc         = @not,
                            site_code   = @site
                        where order_num = @order_num and minor_num = @num
            `;
            await pool.request()
                .input('pro',sql.NVarChar,data[`outPro_${data.current}`])
                .input('qun',sql.NVarChar,data[`outQun_${data.current}`])
                .input('uni',sql.Int,deps.StrClear(data[`outUni_${data.current}`]))
                .input('pri',sql.Int,deps.StrClear(data[`outPri_${data.current}`]))
                .input('auh',sql.NVarChar,data[`outAuh_${data.current}`])
                .input('dat',sql.NVarChar,data[`outDat_${data.current}`])
                .input('not',sql.NVarChar,data[`outNot_${data.current}`])
                .input('site',sql.NVarChar,data[`outSit_${data.current}`])
                .input('order_num',sql.NVarChar,order_num).input('num',sql.Int,data.current)
                .query(sqlText);
        } catch (err) {
            msg = err;
            console.log(err);
        }
    } else if (mode === "outSettleDel") {
        sqlText = `select ticket_num from orderSheet_outsite where order_num = @order_num and minor_num = @num `;
	    sqlResult = await pool.request().input('order_num',sql.NVarChar,order_num).input('num',sql.Int,data.current).query(sqlText);
        if (sqlResult.recordset?.[0]?.ticket_num) {
            msg = ` 이미 전표가 생성 되어 있습니다. `;
        } else {
            try {
                sqlText = `delete from orderSheet_outsite where order_num = @order_num and minor_num = @num `;
                sqlResult = await pool.request().input('order_num',sql.NVarChar,order_num).input('num',sql.Int,data.current).query(sqlText);
            } catch (err) {
                msg = err;
                console.log(err);
            }
        }
    } else if (mode === "saveConfirmed" || mode === "saveEstimate")  {
        let code = aes128Encrypt (aviaSecurityKey,order_num);

        if (mode === "saveEstimate") { // 견적서
            fileName = "estimate.html";
            invGubun = '1';
        }else  if (mode === "saveConfirmed"){ // 확정서
            fileName = "confirmed.html";
            invGubun = '2';
        }
        code = `https://www.oye.co.kr/OAAS_estimate/${fileName}?code=${code}`;
	    const minor_num = await minorNext(pool,{table: "orderSheet_inv", uid:'',minor_num:'',query:` order_num = '${order_num}' and gubun = '${invGubun}' `});
        try {
            sqlText   = `insert into orderSheet_inv (order_num,minor_num,gubun,up_date,file_name,operator,receiver) values (@order_num,@minor_num,@invGubun,@NOWSTIME,@code,@id,'') `;
            sqlResult = await pool.request()
                            .input('order_num',sql.NVarChar,order_num)
                            .input('minor_num',sql.Int,minor_num)
                            .input('invGubun',sql.NVarChar,invGubun)
                            .input('NOWSTIME',sql.NVarChar,NOWSTIME)
                            .input('code',sql.NVarChar,code)
                            .input('id',sql.NVarChar,AviaLoginId)
                            .query(sqlText);
        } catch (err) {
            console.log(err);
            msg = err;
        }
    } else if (mode === "attDel") {
        let gubun = data.gubun;
        if (gubun === "Confirm") gubun = "2";
        sqlText = "select a.* from orderSheet_inv as a where order_num = @order_num  and minor_num = @minor_num and gubun = @gubun ";
        sqlResult = await pool.request()
                        .input('order_num',sql.NVarChar,order_num)
                        .input('minor_num',sql.Int,data.minor_num)
                        .input('gubun',sql.NVarChar,gubun)
                        .query(sqlText);
        let file_name = sqlResult.recordset?.[0]?.file_name;
        if (file_name) {
            //$ImagesSaveDir .= "/TripDoc/".$aNum[0]."/".$row[file_name];
            //$ImagesSaveDir = str_replace("/","\\",$ImagesSaveDir);
            //unlink("$ImagesSaveDir");
        }
        try {
            sqlText = "delete from orderSheet_inv where order_num = @order_num  and  minor_num = @minor_num and gubun = @gubun ";
            sqlResult = await pool.request()
                            .input('order_num',sql.NVarChar,order_num)
                            .input('minor_num',sql.Int,data.minor_num)
                            .input('gubun',sql.NVarChar,gubun)
                            .query(sqlText);
        } catch (err) {
            console.log(err);
            msg = err;
        }
    }
    if (msg) rs = 'no'; else rs = 'ok';
    
    res.json ({success: rs, errorMsg: msg , title: titleData , html: htmlData });
}