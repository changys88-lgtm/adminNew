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
    let msg           = '';
    let sqlText       = '';
    let sqlResult     = '';
    let rsCount       = '';
    let uid           = data.uid || '';
    let date          = '';
    let titleData     = '';
    let htmlData      = '';
    const table       = 'businessCenter';
    const sql         = deps.sql;
    const aes128Encrypt = deps.aes128Encrypt;
    const aes128Decrypt = deps.aes128Decrypt;
    const aviaSecurityKey = deps.getNow().aviaSecurityKey;
    let   NOWS            = deps.getNow().NOWS;
    if (typeof uid === 'string') {
        const [id, dt] = uid.split('__', 2); // 최대 2조각
        if (dt !== undefined) { uid = id; date = dt; }
    } 
    

    if (mode === "input") {
        sqlText = `select * from ${table} where uid = @code `;
        result  = await pool.request().input('code',sql.Int , uid).query(sqlText);
        row     = result.recordset?.[0];
        buttonName = '수정';
    }
    if (!msg) {
        if (mode === "input") {
            uid = await uidNext (table, pool);
            sqlText = `insert into ${table} (uid,up_date,operator,auth) values (@uid,@nows,@id,@auth)`;
            await pool.request()
                    .input('uid' , sql.Int      , uid)
                    .input('nows', sql.NVarChar , deps.getNow().NOWSTIME)
                    .input('id'  , sql.NVarChar , AviaLoginId)
                    .input('auth', sql.NVarChar , b2bMASTER)
                    .query(sqlText);
        }

        if (mode === 'input' || mode === 'modify') {
                      
            try {
                sqlText = `
                    update ${table} set 
                        subject				= '${data.subject || ''}',
                        start_date			= '${deps.StrClear(data.start_date || '')}',
                        start_time			= '${deps.StrClear(data.start_time || '')}',
                        end_date			= '${deps.StrClear(data.end_date || '')}',
                        end_time			= '${deps.StrClear(data.end_time || '')}',
                        memo				= '${data.memo || ''}',
                        relationDev			= '${data.relationDev || ''}',
                        place				= '${data.place || ''}',
                        attendent			= '${data.attendent || ''}',
                        cycle				= '${data.cycle || ''}',
                        cycle_month			= '${data.cycle_month || ''}',
                        cycle_day			= '${data.cycle_day || ''}',
                        cycle_week_order	= '${data.cycle_week_order || ''}',
                        cycle_week			= '${data.cycle_week || ''}',
                        cycleType			= '${data.cycleType || ''}'
                    where uid = @uid
                `;
                await pool.request().input('uid',sql.Int , uid).query(sqlText);
            } catch (error) {
                msg = error;
                console.log(msg);
            }
        } else if (mode === "Clear") {
            try {
                sqlText = `delete from ${table} where uid = @uid `;
                await pool.request().input('uid',sql.Int , uid).query(sqlText);
            } catch (error) {
                msg = error;
            }
        } else if (mode === "Business"){
            let modes = '';
            let buttonName  = '입력';
            let read1       = '';
            let none1       = '';
            if (uid) {
                sqlText = `select * from ${table} where uid = @uid `;
                result  = await pool.request().input('uid',sql.Int , uid).query(sqlText);
                row     = result.recordset?.[0];
                
                modes      = 'modify';
                read1      = '';
                buttonName = '수정';
                if (row.cycle.trim() !== "Y") noneMonth = "none";
            } else {
                noneMonth  = '';
                none1      = 'none';
                modes      = 'input';
                row        = {};
                if (date) row.start_date = row.end_date = date;
            }
            titleData = `<i class="fas fa-edit search-title-text" > 새로운 일정 등록및 수정</i>`;
            let monthData = '';
            let dayData   = '';
            let weekData  = '';
            let weekData2 = '';
            let startTime = '';
            let endTime   = '';
            for (let ix = 1 ; ix < 13 ; ix ++) {
                s = (row.cycle_month === ix) ? 'selected' : '';
                monthData += `<option value='${ix}' ${s}> ${ix} 월 </option>`;
            }
            for (let ix = 1 ; ix < 32 ; ix ++) {
                s = (row.cycle_day === ix) ? 'selected' : '';
                dayData += `<option value='${ix}' ${s}> ${ix} 일 </option>`;
            }
            for (let ix = 1 ; ix < 5 ; ix ++) {
                s = (row.cycle_week_order === ix) ? 'selected' : '';
                weekData += `<option value='${ix}' ${s}> ${ix} 번째 </option>`;
            }
            for (let ix = 0 ; ix < 7 ; ix ++) {
                s = (row.cycle_week === ix) ? 'selected' : '';
                weekData2 += `<option value='${ix}' ${s}> ${deps.arrWeekName(ix)} 요일 </option>`;
            }
            for (let ix = 600 ; ix < 2101 ; ix = ix + 100) {
                s1 = (row.start_time == ix) ? 'selected' : '';
                s2 = (row.end_time   == ix) ? 'selected' : '';
                startTime += `<option value='${ix}' ${s1}> ${deps.cutTime(ix)} </option>`;
                endTime   += `<option value='${ix}' ${s2}> ${deps.cutTime(ix)} </option>`;
                ii = ix + 30;
                s1 = (row.start_time == ii) ? 'selected' : '';
                s2 = (row.end_time   == ii) ? 'selected' : '';
                startTime += `<option value='${ii}' ${s1}> ${deps.cutTime(ii)} </option>`;
                endTime   += `<option value='${ii}' ${s2}> ${deps.cutTime(ii)} </option>`;
            }

            
            htmlData  = `
                <form name="frmForm" id="frmForm" method="post" autocomplete="off">
                    <input type="hidden" name="mode"		value="${modes}">
                    <input type="hidden" name="uid"			value="${uid}">
                    <div class="border regis-box shadow-sm menuArea"  ID="Info1">
                    <div class="row w-90 p-3">
                        <div class="col">
                        <table class="search-view-table">
                            <tr>
                                <th scope="row" class="" >제목</th>
                                <td class="" colspan="3"><input name="subject" ${read1} type="text"  class="search_action_search_input whp100" value="${row.subject || ''}"></td>
                            </tr>
                            <tr>
                                <th scope="row" class="" >반복</th>
                                <td class="" colspan="3">
                                    <select name='cycle' class=" search_action_select" onChange="cycleChange()">
                                        <option value="">없음
                                        <option value="Y" ${((row.cycle || '').trim() === "Y") ? 'selected' : '' }>매년
                                        <option value="M" ${((row.cycle || '').trim() === "M") ? 'selected' : '' }>매월
                                        <option value="W" ${((row.cycle || '').trim() === "W") ? 'selected' : '' }>매주
                                    </select>
                                </td>
                            </tr>
                            <tr id="cycleStart" class="${none1}">
                                <th scope="row" class="" >주기</th>
                                <td class="" colspan="3">
                                    <span class="${noneMonth}" ID="cycleMonth">
                                        반복 월
                                        <select name='cycle_month' class=" search_action_select">
                                            ${monthData}
                                        </select>
                                    </span>
                                    
                                    <span class="lm20 " ID="cycleDay">
                                        <input type="radio" name="cycleType" value="M" ${((row.cycleType || '').trim() === "M") ? 'checked' : '' } > 
                                        일:
                                        <select name='cycle_day' class=" search_action_select">
                                            ${dayData}
                                        </select>
                                    </span>

                                    <span class="lm20 " ID="cycleWeekOrder">
                                        <input type="radio" name="cycleType" value="W" ${((row.cycleType || '').trim() === "W") ? 'checked' : '' } > 
                                        요일:
                                        <select name='cycle_week_order' class=" search_action_select">
                                            ${weekData}    
                                        </select>
                                    </span>

                                    <span class="<?=$noneWeek?>" ID="cycleWeek">
                                        <select name='cycle_week' class=" search_action_select">
                                            ${weekData2}
                                        </select>
                                    </span>
                                </td>
                            </tr>
                            <tr id="cycleNone" class="<?=$none2?>">
                                <th scope="row" class="" >시작</th>
                                <td class=" ar">
                                    <input name="start_date" id="start_date" type="text" onClick="datePick('start_date')" class=" search_action_search_input wh100" value="${deps.cutDate(row.start_date || NOWS)}">
                                    <select name="start_time" class=" search_action_select" onchange="frmForm.end_time.selectedIndex = frmForm.start_time.selectedIndex; ">
                                        ${startTime}
                                    </select>
                                </td>
                                <th scope="row" class="" >종료</th>
                                <td class=" ar">
                                    <input name="end_date" id="end_date" type="text" onClick="datePick('end_date')" class=" search_action_search_input wh100" value="${deps.cutDate(row.end_date || NOWS)}">
                                    <select name="end_time" class=" search_action_select" >
                                        ${endTime}
                                    </select>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row" class="" >장소</th>
                                <td class="" colspan="3">
                                    <label><input name="place"  type="radio" value="OUT" ${((row.place || '').trim() === "OUT") ? 'checked' : '' }> 외부</label>&nbsp;&nbsp;
                                    <label><input name="place"  type="radio" value="IN"  ${((row.place || '').trim() === "IN")  ? 'checked' : '' }> 회의실</label>&nbsp;&nbsp;
                                    <label class="none"><input name="place"  type="radio" value="ANN" ${((row.place || '').trim() === "ANN") ? 'checked' : '' }> 국가기념일</label>&nbsp;&nbsp;
                                    <label><input name="place"  type="radio" value="BIN" ${((row.place || '').trim() === "BIN") ? 'checked' : '' }> BSP 입금</label>&nbsp;&nbsp;
                                    <label><input name="place"  type="radio" value="BOU" ${((row.place || '').trim() === "BOU") ? 'checked' : '' }> BSP 청구</label>&nbsp;&nbsp;
                                    <label><input name="place"  type="radio" value="MIL" ${((row.place || '').trim() === "MIL") ? 'checked' : '' }> 점심</label>&nbsp;&nbsp;
                                    <label><input name="place"  type="radio" value="ALL" ${((row.place || '').trim() === "ALL") ? 'checked' : '' }> 종일</label>&nbsp;&nbsp;
                                </td>
                            </tr>
                            <tr>
                                <th scope="row" class="" >메모</th>
                                <td class="" colspan="3"><input name="memo" ${read1} type="text"  class="search_action_search_input whp100" value="${row.memo || ''}"></td>
                            </tr>
                            <tr>
                                <th scope="row" class=" " >관련부서</th>
                                <td class=" " colspan="3">
                                    <input type="checkbox" name="aDev[]" value="MA">기획팀 &nbsp; &nbsp; 
                                    <input type="checkbox" name="aDev[]" value="DE">전략사업부
                                </td>
                            </tr>
                            <tr>
                                <th scope="row" class="" >참석자</th>
                                <td class=" " colspan="3"><textarea name="attendent" ${read1} type="text" onfocus="lineCheck(this)"  onkeyup="lineCheck(this)"  class="search_action_search_input whp100">${row.attendent || ''}</textarea></td>
                            </tr>
                        </table>
                        </div>
                        
                    </div>	
                </div>
                <div class="form-actions">
                    <div class="btn_basic btn_red fl ${none1}"   onCLick="return busiDel()">삭제하기</div>
                    <div class="btn_basic btn_blue fr"  onCLick="return inputCheck()">${buttonName}</div>
                </div>
                </form>
            `;
        }
    }
    if (msg) rs = 'no'; else rs = 'ok';
    
    res.json ({success: rs, errorMsg: msg , title: titleData , html: htmlData });
}