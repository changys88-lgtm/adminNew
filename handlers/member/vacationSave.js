const deps = require('../../src/common/dependencies');
const { getPagination } = require('../../src/utils/paging'); 
const { arrVacationGubun } = require('../../src/utils/airConst'); 
const { nextDocNumber } = require('../../src/utils/idxFunction'); 

module.exports = async (req, res) => {
    const GU1             = req.body.GU1 || '';
    const GU2             = req.body.GU2 || '';
    const GU3             = req.body.GU3 || '';
    const GU4             = req.body.GU4 || '';
    let   page            = req.body.page || '1';
    const cancel          = req.body.cancel || '1';
    const listCount       = req.body.listCount || 1;
    const sWord           = (req.body.sWord || '').trim();
    const sFrom           = req.body.sFrom || '';
    let   mode            = req.body.mode  || '';
    let   doc_number      = req.body.doc_number  || '';
    let   uid             = req.body.uid  || '';
    const AviaLoginId     = req.cookies?.AviaLoginId || '';
    const AviaLoginName   = req.cookies?.AviaLoginName || '';
    const b2bMASTER       = req.cookies?.b2bMASTER || '';
    const b2bSiteCode     = req.cookies?.b2bSiteCode || '';
    const aes128Encrypt   = deps.aes128Encrypt;
    const aes128Decrypt   = deps.aes128Decrypt;
    const aviaSecurityKey = deps.getNow().aviaSecurityKey;
    const NOWS            = deps.getNow().NOWS;
    const NOWSTIME        = deps.getNow().NOWSTIME;
    const pool            = await deps.getPool();
    const sql             = deps.sql;
    const data            = req.body;
    let   msg             = '';
    let   sqlText         = '';
    let   sqlResult       = '';
    let   titleData       = '';
    
    let addQry        = ` 1=1 and doc_number like 'a%'  `;

    if (sWord )  {
        addQry += ` and ${sFrom} like '%${sWord}%' `;
    }

    if (mode === "List") {
        try {
            const totQuery = `
                    select count(*) as total from  vacation as a (nolock)  
                    where
                    ${addQry}
                `;
            const result2 = await pool.request().query(totQuery);
            const totalRowCount = result2.recordset[0].total;
            if (totalRowCount < listCount) page = 1;
            const { startRow, endRow, pageHTML } = getPagination({
                tot_row: totalRowCount,
                page: page ,
                listCount: listCount
            });
         
            const sqlText = `
                select 
                    a.* , c.finish
                    from (
                    select * from
                        (select a.doc_number , ROW_NUMBER() OVER (order by a.doc_number desc ) as RowNum
                            from 
                            vacation as a (nolock)  
                            where   
                            ${addQry}
                            
                        ) as db1
                    where RowNum BETWEEN ${startRow} AND ${endRow}
                    ) as main
                    left outer join vacation as a (nolock) on main.doc_number = a.doc_number
                    left outer join approval as c on a.accept_req = c.uid
                    order by RowNum asc
                `;
            //console.log(sqlText)
            const result = await pool.request().query(sqlText);
            let   list = ``;
            for (let row of result.recordset) {
                let { doc_date , doc_number, app_name , gubun , etc , term , finish } = row;            
                
                font    = '';

                list += `
                    <tr height="29" onmouseover="this.style.backgroundColor='#f3f3f3'" onmouseout="this.style.backgroundColor=''">
                        <td  ><span class='btn_slim btn_yellow cursor'  onClick="return newReg('${doc_number}')">${doc_number}</span></td>
                        <td  >${deps.cutDate(doc_date)}</td>
                        <td  >${app_name}</td>
                        <td  >${arrVacationGubun[gubun]}</td>
                        <td class='al'>${etc}</td>
                        <td  >${term}</td>			
                        <td  ><span class='btn_basic btn_mint' onClick="return print1('${doc_number}')">미리보기</span></td>
                        <td  >${finish || ''}</td>
                        <td  ><span class='btn_slim btn_red' href=javascript:// onClick="return regDel('${doc_number}')">삭제</span></td>
                    </tr>
                `;
            };
            if (!list) list = `<tr><td colspan='20' class='ac hh50'>데이터가 없습니다.</td></tr>`;

            const listHTML = `
                <table class='search-table' id='dtBasic'>
                    <tr>
                        <th>문서번호</th>
                        <th>신청일</th>
                        <th>신청자</th>
                        <th>형태</th>
                        <th>내용</th>
                        <th>기간</th>					
                        <th>출력</th>
                        <th>결제</th>
                        <th>삭제</th>
                    </tr>
                    ${list}
                </table>
            `;
            res.json({ success: 'ok', listData: listHTML , pageData: pageHTML, totalCount: totalRowCount  });
        } catch (err) {
            console.error('에러:'+err);
            res.status(500).send('Database error');
        }
    } else if (mode === "Vacation") {
        let modes       = '';
        let gubunData   = '';
        let haifDisplay = '';
        let usedData    = '';
        if (uid && !doc_number) doc_number = uid;
        if (doc_number) {
            sqlText    = `select * from vacation where doc_number = @code `;
            sqlResult  = await pool.request().input('code',sql.NVarChar , doc_number).query(sqlText);
            row        = sqlResult.recordset?.[0] || '';
            buttonName = '수정';
            modes      = 'modify';
        } else {
            doc_number  = `AviaVaca-${String(deps.getNow().YY).slice(-2)}`;
            modes       = 'input';
            haifDisplay = 'nonoe';
            buttonName  = '입력';
            row         = {};
            row.app_name = AviaLoginName;
        }
        for (const [v,t] of Object.entries(arrVacationGubun)) {
            s = ((row.gubun || '').trim() === v) ? s = 'selected': '' ;
            gubunData += `<option value='${v}' ${s}> ${t} </option>`;
        }
        for (let ix = 0.5 ; ix < 15 ; ix = ix + 0.5 ) {
            s = ((row.used || '').trim() === ix) ? 'selected' : (ix === 1) ? 'selected' : '';
            usedData += `<option value='${ix}' ${s}> ${ix} </option>`;
        }
        titleData = `<i class="fas fa-edit search-title-text" > 휴가원 내역 등록</i>`;
        htmlData  = `
                <form name="frmForm" id="frmForm" method="post" autocomplete="off">
                    <input type="hidden" name="mode"		value="${modes}">
                    <input type="hidden" name="uid"			value="">
                    <div class="border regis-box shadow-sm menuArea"  ID="Info1">
                    <div class="row w-90 p-3">
                        <div class="col">
                        <table class="ntourTable">
                            <tr>
                                <th >신청 넘버</td>
                                <td  colspan=3><input type=text class='form-smooth' size=30 style="background-color:#dcdcdc" name=doc_number readonly value="${doc_number}"> </td>
                            </tr>
                            <tr>
                                <th class="wh100" >신청자</td>
                                <td ><input type=text class='form-smooth' size=30 name=app_name value="${row.app_name || ''}" readonly> </td>
                                <th >휴가형태</td>
                                <td >
                                    <select name='gubun' class="form-smooth wh120">
                                        ${gubunData}
                                    </select>
                                </td>
                            </tr>
                            <tr>
                                <th >연차기간</td>
                                <td  colspan=3>
                                    <table border="0" cellpadding="0" cellspacing="0" class="tableNone">
                                        <tr>
                                            <td class="">
                                            <input name="vacation_day" type="text"  readonly onClick="datePick('vacation_day')" id="vacation_day" class="form-smooth rm5 wh100"  value="${deps.cutDate(row.vacation_day || '')}"></td>
                                            <td class="proboard_body" style="padding:0 2 2 6">
                                            <select name="used" class="form-smooth wh60" onChange="halfSelect(this.value)">
                                                ${usedData}
                                            </select>
                                            </td>
                                            <td>일간</td>
                                            <td style='padding:0 0 0 20'> ※ 0.5 는 반차임</td>
                                            <td class="proboard_body" style="display:${haifDisplay};" id="haif">
                                                <select name="haif" class="form-smooth wh100" id="haifSelect">
                                                    <option value="">오전/오후반차 선택</option>
                                                    <option value="AM" ${((row.half || '').trim() === 'AM') ? 'selected' : '' }>오전반차</option>
                                                    <option value="PM" ${((row.half || '').trim() === 'PM') ? 'selected' : '' }>오후반차</option>
                                                </select>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <th >연차내용</td>
                                <td  colspan=3>
                                    <input type=text class='form-smooth wh300' name=etc value="${row.etc || ''}"> 예) 휴가 / 병가 / 기타등등
                                </td>
                            </tr>

                            <tr>
                                <th >내용</td>
                                <td  colspan=3><textarea name=content  class='form-smooth whp100 hh200'>${row.content || ''}</textarea></td>
                            </tr>
                            <tr><td colspan="4" class="ac hh50">
                                <span  class='btn_basic btn_blue' onClick="InputCheck()">${buttonName} </span> &nbsp; 
                            </td></tr>
                        </table>
                        </div>
                    </div>
                </form>
        `;
        if (msg) rs = 'no'; else rs = 'ok';
        res.json ({success: rs, errorMsg: msg , title: titleData , html: htmlData });
    } else if (mode === "input") {
        doc_number = await nextDocNumber (pool , sql , 'vacation', 'doc_number' , doc_number);
        sqlText = ` insert into vacation (doc_number,doc_date,up_date,member_code) values (@doc_number,@doc_date,@up_date,@id) `;   
        await pool.request().input('doc_number',sql.NVarChar,doc_number)
                .input('doc_date',sql.NVarChar,NOWS)
                .input('up_date',sql.NVarChar,NOWSTIME)     
                .input('id',sql.NVarChar,AviaLoginId)     
                .query(sqlText);
        mode = 'modify';
    }

    if (mode === "modify") {
        const vacation_day = String(deps.StrClear(data.vacation_day || ''));
        const year  = vacation_day.slice(0,4);
        const month = vacation_day.slice(4,6);
        const day   = vacation_day.slice(6,8);
        const term  = `${year}년 ${month}월 ${day}일 부터 ${data.used}일 간 `;
        try {
            sqlText = `
                update vacation set
                    etc 			= '${data.etc || ''}',
                    term			= '${term}',
                    app_name 	    = '${data.app_name || ''}',
                    vacation_day	= '${vacation_day}',
                    vacation_day2	= '${deps.StrClear(data.vacation_day2 || '')}',
                    haif			= '${data.haif || ''}',
                    used            = '${data.used || ''}',
                    gubun 			= '${data.gubun || ''}',
                    content			= '${data.content || ''}'
                where doc_number = @doc_number
            `;
            await pool.request().input('doc_number',sql.NVarChar,doc_number)
                    .query(sqlText);
        } catch (err) {
            msg = err;
            console.log(err)
        }
        if (msg) rs = 'no'; else rs = 'ok';
        res.json ({success: rs, errorMsg: msg });
    } else if (mode === "VacationDel") {
        try {
            sqlText = `delete from vacation where doc_number = @doc`;
            sqlResult = await pool.request().input('doc',sql.NVarChar , data.uid).query(sqlText);
        } catch (err) {
            msg = err;
            console.log(err);
        }
        if (msg) rs = 'no'; else rs = 'ok';
        res.json ({success: rs, errorMsg: msg });
    }
	
};

