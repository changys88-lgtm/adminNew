const { Parser } = require('xml2js');
const deps = require('../../src/common/dependencies');
const { interSearchLogSave , mainInterQuery } = require('../../src/utils/database');
const { uapiGalEndToken , uapiGalGetToken , uapiGalTerminal , uapiGalParse } = require('../../src/utils/functionGalileo');
const {} = require('../../src/utils/functionSabre');

module.exports = async (req, res) => {
    const uid  = req.body.uid  || '';
    const mode = req.body.mode || '';
    pool = await deps.getPool();    

    let mainRow   =  await mainInterQuery (uid);
    let errorMsg  = '';
    let re        = "ok";
    const atr_yes = mainRow.atr_yes.trim();
    let pData = mainRow;
    pData.BRANCH = 'P7144368' ;
    pData.pool   = pool;
    if (mainRow.TL < deps.getNow().NOWSTIME.slice(0,12) && mainRow.TL) {
        errorMsg = "TL이 초과 되어 요금 재확인 작업이 중단 됩니다.";
    }
    
    if (!errorMsg) {

        let adt = mainRow.adult_member;
        let chd = mainRow.child_member;
        let inf = mainRow.infanf_member;
        let issueComm = mainRow.issueComm / (adt + chd);
        let adtVFR  = '';
        let chdVFN  = '';
        let infVFR  = '';
        let addAccountCode = '';
        let sqlText = '';
        let result  = '';
        const sql   = deps.sql;
        if (mainRow.searchGrade === "VFR") {
            adtVFR = "*VFR";
            chdVFN = "**V10/ACCVFR-KRE1/CVN";
            infVFR = "**VFF/ACCVFR-KRE1/CVN";
        } else if (mainRow.searchGrade === "LBR") {
            adtVFR = "*LBR";
            chdVFN = "**V10/ACCLBR-KRE1/CVN";
            infVFR = "**VFF/ACCLBR-KRE1/CVN";
        } else {
            chdVFN = "**C10"; // ** 강제성을 띄운다 2023-08-31
            infVFR = "*INF";
        }
        if (mainRow.AccountCode) {
            addAccountCode = `-${mainRow.AccountCode}`;
        }
        const aBrand = [];
        let comm;
        const addQuote = [];
        sqlText = `select minor_num , BrandTier from interline_routing where uid_minor = @uid order by minor_num asc `;
        result  = await pool.request()
                    .input('uid', sql.Int , uid )
                    .query(sqlText);
        for (const row of  result.recordset) {
            const {minor_num , BrandTier } = row;
            if (BrandTier) {
                minor_num === 1 ? comm = `/S${minor_num}*:BF${BrandTier}` : comm = `${minor_num}*:BF${BrandTier}` ;
                aBrand.push(comm);
            }
        }
        let BrandComm = aBrand.join(".");
        if (adt > 1) {
            addQuote.push(`P1-${adt}${adtVFR}${addAccountCode}`);
        } else {
            addQuote.push(`P1${adtVFR}${addAccountCode}`);
        }
        if (chd > 0) {
            const chd1 = adt + inf + 1;
            const chd2 = adt + chd + inf;
            if (chd2 > chd1) {
              addQuote.push(`P${chd1}-${chd2}${chdVFN}${addAccountCode}`);
            } else {
              addQuote.push(`P${chd1}${chdVFN}${addAccountCode}`);
            }
        }
        if (inf > 0) {
            const inf1 = adt + 1;
            const inf2 = adt + inf;
            if (inf1 > inf2) {
              addQuote.push(`P${inf1}-${inf2}${infVFR}${addAccountCode}`);
            } else {
              addQuote.push(`P${inf2}${infVFR}${addAccountCode}`);
            }
        }

        const airCode = mainRow.FirstAir.slice(0,2);
        

        let response = '';
        let data     = '';
        if (atr_yes === "G") {
            let Token     = await uapiGalGetToken (pData);
            pData.Token   = Token;
            pData.Command = `*${mainRow.RecLoc}`;
            xml           = await uapiGalTerminal (pData);
            response      = await uapiGalParse (xml);
            faultstring   = response.Envelope?.Body?.Fault?.faultstring;
            if (faultstring) {
                errorMsg = faultstring;
                re = "no";
            }
            pData.Command = "FXALL";
            xml           = await uapiGalTerminal(pData);
            response      = await uapiGalParse (xml);
            Obj           = response.Envelope?.Body?.TerminalRsp?.TerminalCommandResponse.Text;
            data          = '';
            Array.isArray(Obj) ? Obj : [Obj];
            for (const row of Obj) {
                data += row + " ";
            }
            if (/(DOES NOT EXIST)/i.test(String(data))) {
                re = 'no';
                errorMsg = data;
            }
            if (re === "ok") {
                pData.Command = "R.P+ER";
                xml           = await uapiGalTerminal(pData);
                response      = await uapiGalParse (xml);
                Obj           = response.Envelope?.Body?.TerminalRsp?.TerminalCommandResponse.Text;
                Array.isArray(Obj) ? Obj : [Obj];
                data = '';
                for (const row of Obj) {
                    data += row + " ";
                }
                if (/(CONFIRM SEGMENT|CHECK CONTINUITY SEGMENT)/i.test(String(data))) {
                    pData.Command = "ER";
                    xml           = await uapiGalTerminal(pData);
                }
                
                for (const quote of addQuote) {
                    pData.Command = `FQ${quote}${BrandComm}`;
                    xml           = await uapiGalTerminal(pData);
                    pData.Command = "R.P+ER";
                    xml           = await uapiGalTerminal(pData);
                }
                response      = await uapiGalParse (xml);
                Obj           = response.Envelope?.Body?.TerminalRsp?.TerminalCommandResponse.Text;
                Array.isArray(Obj) ? Obj : [Obj];
                for (const row of Obj) {
                    data += row + " ";
                }
                if (/(CONFIRM SEGMENT|CHECK CONTINUITY SEGMENT)/i.test(String(data))) {
                    pData.Command = "ER";
                    xml           = await uapiGalTerminal(pData);
                }
            }
            await uapiGalEndToken (pData);
        } else if (atr_yes === "A") {

        }
    } else {
        re = "no";
    }
    //console.log(pData.Token)
    res.json ({success:re,msg:errorMsg});
    
}