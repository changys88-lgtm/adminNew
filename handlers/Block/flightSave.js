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
    const mainTable       = 'airflight_master';

    let   html            = '';
    let   s               = '';
    let   modes           = '';
    let   row             = {};
    let   buttonName      = '신규입력';
    if (mode === "view") {
            
        
    } else if (mode === "input" || mode === "modify") {
        if (mode === "input") {
            buttonName = '신규입력';
            titleData  = `<i class="fas fa-edit search-title-text"> 항공편타임테이블 등록</i>`;
        } else {
            buttonName = '수정입력';
            titleData  = `<i class="fas fa-edit search-title-text"> 항공편타임테이블 수정 <span class='font13'>(${uid || ''}) </span></i>`;
            sqlText   = ` select a.*  from ${mainTable} as a  where a.uid = @uid `;
            sqlResult = await pool.request().input('uid',sql.Int,uid).query(sqlText);
            row       = sqlResult.recordset?.[0];
        }
        modes      = mode;
        const weekObj = deps.arrWeekName('A');
        const aWeeksData = Object.entries(weekObj)
            .map(([key, val]) =>
                `<label>
                <input type="checkbox" name="aWeek[]" value="${key}" ${row.use_week?.includes(key) ? 'checked' : ''}>
                ${val}요일
                </label>&nbsp;`
            )
            .join('');
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
							<th scope="row" class="" >항공편</th>
							<td class="" colspan="3"><input name="air_flight" type="text"  class=" wh100" value="${row.air_flight || ''}"><span>예) OZ123</span></td>
						</tr>
						<tr>
							<th scope="row" class="" >출발</th>
							<td class=""><input name="dep_code"  type="text"  class=" wh100" value="${row.dep_code || ''}" maxlength='3'  placeholder='예) ICN'><span>예) ICN</span></td>
							<th scope="row" class="" >도착</th>
							<td class=""><input name="arr_code"  type="text"  class=" wh100" value="${row.arr_code || ''}"  maxlength='3' placeholder='예) NRT'><span>예) NRT</span></td>
						</tr>
						<tr>
							<th scope="row" class="" >운항일1</th>
							<td class=""><input name="use_date1" type="text"  readonly onClick="datePick('use_date1')" id="use_date1" class=" " value="${deps.cutDate(row.use_date1 || '')}"></td>
							<th scope="row" class="" >운항일2</th>
							<td class=""><input name="use_date2" type="text"  readonly onClick="datePick('use_date2')" id="use_date2" class="" value="${deps.cutDate(row.use_date2 || '')}"></td>
						</tr>
						<tr>
							<th scope="row" class="" >운항요일</th>
							<td class="" colspan="3">
								${aWeeksData}
							</td>
						</tr>
						<tr>
							<th scope="row" class="" >출발시간</th>
							<td class="" style="border-bottom:1px solid #ddd;"><input name="use_time1" type="text"  class=" wh100" value="${deps.cutTime(row.use_time1 || '')}" placeholder='예) 12:00'><span>예) 12:00</span></td>
							<th scope="row" class="" >도착시간</th>
							<td class="" style="border-bottom:1px solid #ddd;"><input name="use_time2" type="text"  class=" wh100" value="${deps.cutTime(row.use_time2 || '')}" placeholder='예) 12:00'><span>예) 12:00</span></td>
						</tr>
						<tr>
							<th scope="row" class="" >운항시간</th>
							<td colspan="3" class=" " style="border-bottom:1px solid #ddd;"><input name="flight_time" type="number"  class=" wh100" value="${row.flight_time || ''}"> 120분</td>
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
        const use_week = data.aWeek.join('');
        if (orgMode === "input" && !uid) {
            sqlText = `select count(*) from airflight_master where air_flight = @air_flight and use_date1 = @use_date1  and use_date2 = @use_date2 and use_week = @use_week  `;
	        sqlResult = await pool.request()
                        .input('air_flight',sql.NVarChar,data.air_flight)
                        .input('use_date1',sql.NVarChar,deps.StrClear(data.use_date1))
                        .input('use_date2',sql.NVarChar,deps.StrClear(data.use_date2))
                        .input('use_week',sql.NVarChar,use_week)
                        .query(sqlText);
            rsCount = sqlResult.recordset?.[0]?.cnt || 0;
            if (rsCount > 0) {
                msg = "이미 등록된 항공편입니다.";
            } else {
                uid = await uidNext(`${mainTable}`, pool );
                sqlText = `insert into ${mainTable} (uid,up_date) values (@uid,@NOWSTIME) `;
                sqlResult = await pool.request().input('uid',sql.Int,uid).input('NOWSTIME',sql.Int,NOWSTIME).query(sqlText);
            }
        }
        if (!msg) {
            try {             
                sqlText = `
                    update ${mainTable} set
                        dep_code		= @dep_code,
                        arr_code		= @arr_code,
                        use_date1		= @use_date1,
                        use_date2		= @use_date2,
                        use_week		= @use_week,
                        use_time1		= @use_time1,
                        use_time2		= @use_time2,
                        air_code		= @air_code,
                        air_flight		= @air_flight,
                        flight_time		= @flight_time
                    where uid = @uid
                `;
                sqlResult = await pool.request()
                    .input('uid',sql.Int,uid)
                    .input('dep_code',sql.NVarChar,data.dep_code)
                    .input('arr_code',sql.NVarChar,data.arr_code)
                    .input('use_date1',sql.NVarChar,deps.StrClear(data.use_date1))
                    .input('use_date2',sql.NVarChar,deps.StrClear(data.use_date2))
                    .input('use_week',sql.NVarChar,use_week)
                    .input('use_time1',sql.NVarChar,deps.StrClear(data.use_time1))
                    .input('use_time2',sql.NVarChar,deps.StrClear(data.use_time2))
                    .input('air_code',sql.NVarChar,data.air_code)
                    .input('air_flight',sql.NVarChar,data.air_flight)
                    .input('flight_time',sql.NVarChar,data.flight_time)
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