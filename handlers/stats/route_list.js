const deps = require('../../src/common/dependencies');
const { dataPick } = require('../../src/utils/database');
const { accumulateDayRow , buildDayHTML} = require('../../src/utils/stats'); 


//left outer join interline as a (nolock) on main.uid = a.uid   
module.exports = async (req, res) => {
    const data        = req.body;
    let   start_date  = req.body.start_date || '';
    let   end_date    = req.body.end_date || '';
    let   GU1         = req.body.GU1     || '';
    let   GU2         = req.body.GU2     || '';
    let   GU3         = req.body.GU3    || '';
    let   GU4         = req.body.GU4    || '';
    let   GU5         = req.body.GU5    || '';
    let   GU6         = req.body.GU6    || '';
    let   GU7         = req.body.GU7    || '';
    const gMode       = req.body.gMode  || '';
    const page        = req.body.page    || '1';
    const listCount   = req.body.listCount;
    const sWord       = req.body.sWord || '';
    const sFrom       = req.body.sFrom || 'Air';
    const AviaLoginId = req.cookies?.AviaLoginId || '';
    const b2bMASTER   = req.cookies?.b2bMASTER || '';
    const b2bSiteCode = req.cookies?.b2bSiteCode || '';
    const mainTable   = 'interline';
    const pool        = await deps.getPool();
    let   YY          = deps.getNow().YY;
    let   MM          = deps.getNow().MM;
    let   cYear       = data.cYear  || YY;
    let   cMonth      = data.cMonth || MM;
    
    let addQry        = ` 1=1 `;
    if (sWord && sFrom ) {
        addQry +=  ` and ${sFrom} like '%${sWord}%' `;
    }

    if (b2bSiteCode !== "")	    addQry += ` and a.site_code = '${b2bSiteCode}' `;

    if (start_date != "") {
        if (GU1 == "d.in_date") addQry += ` and d.in_date >= '${deps.StrClear(start_date)}' `; 
        else addQry += ` and substring(a.issue_date,1,8) >= '${deps.StrClear(start_date)}' `; 
    }
    if (end_date != "") {
        if (GU1 == "d.in_date") addQry += ` and d.in_date <= '${deps.StrClear(end_date)}' `; 
        else addQry += ` and substring(a.issue_date,1,8) <= '${deps.StrClear(end_date)}' `; 
    }

    try {
        // 항공사별 클래스(F/C) 정보 로드
        
        const fieldQry = `
            a.uid, a.site_code , a.order_date , a.issue_date , a.in_status ,d.air_code ,(a.adult_member+a.child_member+a.infant_member) as member ,route.routeJson
        `;

        let sqlText = ` select ${fieldQry} from ${mainTable} as a 
            left outer join interline_routing as d on a.uid = d.uid_minor and d.minor_num = '1'
            left outer join interline_minor as n on a.uid = n.uid_minor
            outer apply (
                select (
                    select minor_num,in_date,out_date,citycode,air_code,air_class from interline_routing where uid_minor = a.uid order by minor_num asc
                    for json path
                ) as routeJson
            ) as route
            where  ${addQry} 
        `;

        //console.log(sqlText)
        const result = await pool.request().query(sqlText);
        let   rows = ``;
        let   tot = 0;
        let   cData = {};
        let   rData = {};
        let   airData = {};
        
        for (const row of result.recordset) {
            const member = Number(row.member || 0);
            const air = String(row.air_code || '').substring(0, 2);
            
            // routeJson 파싱하여 citycode 추출
            let citycodes = [];
            try {
                if (row.routeJson) {
                    const routeData = typeof row.routeJson === 'string' ? JSON.parse(row.routeJson) : row.routeJson;
                    if (Array.isArray(routeData)) {
                        routeData.forEach(route => {
                            if (route.citycode) {
                                citycodes.push(String(route.citycode));
                            }
                        });
                    }
                }
            } catch (err) {
                console.error('routeJson 파싱 오류:', err);
            }
            //console.log(citycodes)
            // citycode1부터 citycode8까지 채우기
            //for (let i = 0; i < 8; i++) {
            //    if (!citycodes[i]) citycodes[i] = '';
            //}
            
            let city = "";
            for (let ix = 0; ix < citycodes.length ; ix++) {
                const citycode = String(citycodes[ix] || '');
                const citycode2 = String(citycodes[ix + 1] || '');
                let   src = citycode.substring(0, 3);
                const src2 = citycode2.substring(0, 3);
                let dest = citycode.substring(3, 6);
                
                if (src2 === dest && citycode !== "") {
                    dest = ".";
                } else if (src2 !== "") {
                    dest = "---";
                } else if (src2 === "" && src !== "") {
                    src += ".";
                }
                
                city += src + dest;
            }
            //console.log(city)
            // 데이터 누적
            if (!cData[air]) cData[air] = {};
            if (!cData[air][city]) cData[air][city] = 0;
            cData[air][city] += member;
            
            if (!rData[city]) rData[city] = 0;
            rData[city] += member;
            
            if (!airData[air]) airData[air] = 0;
            airData[air] += member;
            
            tot++;
        }

        const sortedRData = Object.entries(rData).sort((a, b) => b[1] - a[1])
            .reduce((acc, [key, val]) => {
            acc[key] = val;
            return acc;
            }, {});
        //console.log(sortedRData)
        // 정렬된 HTML로 변환
        let listHTML = ``;
        const style1 = "left:0px;position: sticky;background-color: #eee;";
        const style2 = "right:0px;position: sticky;background-color: #eee;";
        
        const style3_1 = " style='top:0px;  position:sticky; background-color: #eee; white-space: nowrap;' ";
        const style3_2 = " style='top:45px; position:sticky; background-color: #eee; white-space: nowrap;' ";
        
        // cityChange 함수 (citycode를 읽기 쉬운 형식으로 변환)
        const cityChange = (city) => {
            if (!city) return '';
            // "ICN---HNL.HNL---LAX" 형식을 "ICN-HNL-LAX" 형식으로 변환
            return city.replace(/\./g, '-');
        };
        
        // 헤더 행 생성
        listHTML += `<tr ${style3_1}><th class='wh200 hh44' style='padding:0 0 0 0; ${style1}' rowspan=''>구분<br><img src='../images/blank.gif' width='200' height='1'></th>`;
        const len = Object.keys(airData).length;
        
        for (const [air, val] of Object.entries(airData)) {
            listHTML += `<th class=''>${air}</th>`;
        }
        for (let ix = len; ix < 10; ix++) {
            listHTML += `<th class='coEEE'>YY</th>`;
        }
        listHTML += `<th class='' style='${style2}'>합계</th>`;
        listHTML += `</tr>`;
        
        // 데이터 행 생성
        for (const [city, mem] of Object.entries(sortedRData)) {
            listHTML += `<tr>`;
            const rs = cityChange(city);
            listHTML += `<td style='${style1}'>${rs}</td>`;
            
            for (const [air, val] of Object.entries(airData)) {
                const cityCount = cData[air] && cData[air][city] ? cData[air][city] : '';
                listHTML += `<td>${cityCount}</td>`;
            }
            
            for (let ix = len; ix < 10; ix++) {
                listHTML += `<td></td>`;
            }
            listHTML += `<td style='${style2}'>${rData[city]}</td>`;
            listHTML += `</tr>`;
        }
        
        // 합계 행 생성
        listHTML += `
            <tr style='background-color:#eee;white-space: nowrap;'>
                <th class='hh44'>합 계</th>`;
        let totalSum = 0;
        for (const [air, val] of Object.entries(airData)) {
            totalSum += val;
            listHTML += `<th>${val}</th>`;
        }
        for (let ix = len; ix < 10; ix++) {
            listHTML += `<th></th>`;
        }
        listHTML += `<th>${totalSum}</th>`;
        listHTML += `</tr>`;
        if (!tot) {
            listHTML = `<tr><td colspan='20' class='ac hh50'>검색된 데이터가 없습니다.</td></tr>`;
        }

        listHTML = `
            <table class='table table-light text-center mt-3' border=1 bordercolor='#ddd' style='border-bottom:1px solid #ddd;' id='dtBasic'>
                ${listHTML}
            </table>
        `;

        res.json({success : 'ok', listData: listHTML , totalCount: tot });
    } catch (err) {
        console.error('에러:'+err.stack);
        res.status(500).send('Database error');
    }
	
};



