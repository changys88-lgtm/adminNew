const deps = require('../../src/common/dependencies');
const { arrGdsData } = require('../../src/utils/airConst'); 
const { uidNext } = require('../../src/utils/idxFunction')

module.exports = async (req, res) => {
    const data        = req.body;
    const AviaLoginId = req.cookies?.AviaLoginId || '';
    const b2bMASTER   = req.cookies?.b2bMASTER || '';
    const b2bSiteCode = req.cookies?.b2bSiteCode || '';
    const orgMode     = (data.orgMode || '').trim();   
    const pool        = await deps.getPool();
    let   mode        = (data.mode || '').trim();   
    let   uid         = data.uid  || '';
    let   ticket_num  = data.ticket_num  || '';
    let   minor       = data.minor  || '';
    let   cYear       = data.cYear  || '';
    let   gubun1      = data.gubun1 || '';
    let   aView       = data.aView  || '';
    let   msg         = '';
    let   sqlText     = '';
    let   sqlResult   = '';
    let   rsCount     = '';
    let   titleData   = '';
    let   htmlData    = '';
    let   contents    = '';
    let   content     = data.content || '';
    let   subject     = data.subject || '';
    let   username    = data.username || '';
    const sql             = deps.sql;
    const aes128Encrypt   = deps.aes128Encrypt;
    const aes128Decrypt   = deps.aes128Decrypt;
    const aviaSecurityKey = deps.getNow().aviaSecurityKey;
    const NOWSTIME        = deps.getNow().NOWSTIME;
    const NOWS            = deps.getNow().NOWS;
    const mainTable       = 'airClass_list';

    let   html            = '';
    let   s               = '';
    let   modes           = '';
    let   row             = {};
    let   buttonName      = '신규입력';
    if (mode === "view") {
            
        
    } else if (mode === "input" || mode === "modify") {
        if (mode === "input") {
            buttonName = '신규입력';
            titleData  = `<i class="fas fa-edit search-title-text"> 캐빈클래스 등록</i>`;
        } else {
            buttonName = '수정입력';
            titleData  = `<i class="fas fa-edit search-title-text"> 캐빈클래스 수정 <span class='font13'>(${uid || ''}) </span></i>`;
            sqlText   = ` select a.*  from ${mainTable} as a  where a.uid = @uid `;
            sqlResult = await pool.request().input('uid',sql.Int,uid).query(sqlText);
            row       = sqlResult.recordset?.[0];
        }
        modes      = mode;
        
        htmlData   = `
            <form name="frmDetail" id="frmDetail" method="post" enctype="multipart/form-data">
                <input type="hidden" name="mode"		value="save">
                <input type="hidden" name="uid"			value="${uid}">
                <input type="hidden" name="orgMode"		value="${mode}">
                <div class="border regis-box shadow-sm menuArea" >
                <div class="row w-90 p-3">
                    <div class="col">
                    <table class="search-view-table">
                        <tr>
							<th scope="row" class=" " style="line-height:30px;">항공편</th>
							<td class="" colspan="3"><input name="airCode" type="text"  class="search_action_input wh100" maxlength='2' value="${row.airCode || ''}"> KE/OZ</td>
						</tr>
						<tr>
							<th scope="row" class=" wh100" style="line-height:30px;">해당일 시작</th>
							<td class=""><input name="start_term1"  type="text" readonly onClick="datePick('start_term1')" id="start_term1" class="search_action_input" value="${deps.cutDate(row.start_term1 || '')}" ></td>
							<th scope="row" class=" wh100" style="line-height:30px;">해당일 마감</th>
							<td class=""><input name="start_term2"  type="text" readonly onClick="datePick('start_term2')" id="start_term2" class="search_action_input" value="${deps.cutDate(row.start_term2 || '')}" ></td>
						</tr>
						<tr>
							<th scope="row" class="" style="line-height:30px;">출발도시</th>
							<td class="  "><input name="dep_city" type="text"   class="search_action_input wh100" value="${row.dep_city || ''}"> ICN or GMP</td>
							<th scope="row" class="" style="line-height:30px;">도착도시</th>
							<td class="  " ><input name="arr_city" type="text"  class="search_action_input wh100" value="${row.arr_city || ''}"> CJU / CJJ</td>
						</tr>
						<tr>
							<th scope="row" class=" " style="line-height:30px;">퍼스트</th>
							<td class="" colspan="3"><input name="first" type="text"  class="search_action_input wh400" value="${row.first || ''}"> F </td>
						</tr>
						<tr>
							<th scope="row" class=" " style="line-height:30px;">비지니스</th>
							<td class="" colspan="3"><input name="business" type="text"  class="search_action_input wh400" value="${row.business || ''}"> C,D</td>
						</tr>
						<tr>
							<th scope="row" class=" " style="line-height:30px;">이코노미</th>
							<td class=" borderBottom" colspan="3"><input name="economy" type="text"  class="search_action_input wh400" value="${row.economy || ''}"> Y,E,Q</td>
						</tr>
                        
                    </table>
                    </div>
                </div>
                <div class="regis-btn ">
                    <div class="ac">
                        <span type="button" class="btn btn-yellow " onCLick="return inputCheck()" style="width:50%;font-size:19px !important;padding-top:10px;padding-bottom:13px;">${buttonName}</span>
                    </div>
                </div>
                </div>
            </form>
        `;
    } else if (mode === "save") {
        if (orgMode === "input" && !uid) {
            
            uid       = await uidNext(`${mainTable}`, pool );
            sqlText   = `insert into ${mainTable} (uid,up_date) values (@uid,@NOWSTIME) `;
            sqlResult = await pool.request().input('uid',sql.Int,uid).input('NOWSTIME',sql.NVarChar,NOWSTIME).query(sqlText);
        
        }
        if (!msg) {
            try {             
                sqlText = `
                    update ${mainTable} set
                        airCode		= @airCode,
                        first		= @first,
                        business	= @business,
                        economy		= @economy,
                        dep_city	= @dep_city,
                        arr_city	= @arr_city,
                        start_term1	= @start_term1,
                        start_term2	= @start_term2
                    where uid = @uid
                `;
                sqlResult = await pool.request()
                    .input('uid',sql.Int,uid)
                    .input('airCode',sql.NVarChar,data.airCode)
                    .input('first',sql.NVarChar,data.first)
                    .input('business',sql.NVarChar,data.business)
                    .input('economy',sql.NVarChar,data.economy)
                    .input('dep_city',sql.NVarChar,data.dep_city)
                    .input('arr_city',sql.NVarChar,data.arr_city)
                    .input('start_term1',sql.NVarChar,deps.StrClear(data.start_term1))
                    .input('start_term2',sql.NVarChar,deps.StrClear(data.start_term2))
                    .query(sqlText);
            } catch (err) {
                msg = err;
                console.log(err.stack);
            }
            
        }
    } else if (mode === "delete") {
        try {
            sqlText = `delete from ${mainTable} where uid = @uid `;
            sqlResult = await pool.request().input('uid',sql.Int,uid).query(sqlText);
        } catch (err) {
            msg = err;
            console.log(err.stack);
        }
    }
    if (msg) rs = 'no'; else rs = 'ok';
    res.json ({success: rs, errorMsg: msg , title: titleData , html: htmlData , uid: uid  });
}