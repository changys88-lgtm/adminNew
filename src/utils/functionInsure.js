const deps   = require('../../src/common/dependencies');
const axios  = require('axios');
const fs     = require('fs');


class insureService {
	constructor() {
		this.id = "emdKM0tzZytIaUU9";
		this.apiUrl = "https://trippartners.co.kr/api/";
		this.reqUrl = "";
		this.XML = "";
		this.method = "";
		this.headers = "";
		this.Token = "";
		this.locale = "ko";
	}

	async insureExec() {
		const headers = {};
		headers['Content-Type'] = 'application/json; charset=utf-8';
		if (this.Token !== "") {
			headers['Authorization'] = `Bearer ${this.Token}`;
		}

		const config = {
			url: this.apiUrl + this.reqUrl,
			method: this.method === "put" ? "PUT" : 
				    this.method === "get" ? "GET" : 
				    this.method === "del" ? "DELETE" : "POST",
			headers: headers,
			data: this.XML,
			httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
		};

		try {
			const response = await axios(config);
			const data = response.data;
			insureLogSave(this.reqUrl, this.XML, data);                

			this.reqUrl = "";
			this.XML = "";

			return data;
		} catch (error) {
			this.reqUrl = "";
			this.XML = "";
			throw error;
		}
	}

	async getToken() {
		this.reqUrl = `access_token/${this.id}`;
		this.method = "get";
		const data = await this.insureExec();
		const res = JSON.parse(typeof data === 'string' ? data : JSON.stringify(data));
		return res;
	}

	async getInsureAmount(pData) {
		const { ip_loss, start_date, start_time, end_date, end_time, jumin, sex, commission, country, tasf, token } = pData;

		const XML = JSON.stringify({
			"client_id": "emdKM0tzZytIaUU9",
			"ip_loss": ip_loss,
			"start_date": start_date,
			"start_time": start_time,
			"end_date": end_date,
			"end_time": end_time,
			"jumin": jumin,
			"sex": sex,
			"commission": commission,
			"country": country,
			"tasf": tasf
		});

		this.reqUrl = "get_insure_calc";
		this.method = "post";
		this.XML = XML;
		this.Token = token;
		const data = await this.insureExec();
		
		const res = JSON.parse(typeof data === 'string' ? data : JSON.stringify(data));
		return res;
	}

	//보험저장
	async saveInsure(sData) {
		const { user_name, jumin2, mobile, email, ip_loss, ip_group, price, token } = sData;
		
		const XML = JSON.stringify({
			"client_id": "emdKM0tzZytIaUU9",
			"user_name": user_name,
			"jumin2": jumin2,
			"mobile": mobile,
			"email": email,
			"ip_loss": ip_loss,
			"ip_group": ip_group,
			"price": price
		});

		this.reqUrl = "save_insure";
		this.method = "post";
		this.XML = XML;
		this.Token = token;
		const data = await this.insureExec();
		const res = JSON.parse(typeof data === 'string' ? data : JSON.stringify(data));
		return res;
	}

	//보험취소
	async cancelInsure(cData) {
		const { reason, token } = cData;
		
		const XML = JSON.stringify({
			"client_id": "emdKM0tzZytIaUU9",
			"reason": reason
		});

		this.reqUrl = "insure_cancel";
		this.method = "post";
		this.XML = XML;
		this.Token = token;
		const data = await this.insureExec();
		const res = JSON.parse(typeof data === 'string' ? data : JSON.stringify(data));
		return res;
	}

}

async function insureAutoCheck (pool, {birth='', sex='F' , sdate='' , rdate='' , type=''}) {
    NOWSTIME = deps.getNow().NOWSTIME; 
    if (birth && birth.length === 6) {
        let y = NOWSTIME.slice(0,2);
        const yy = NOWSTIME.slice(2,4); 
        const by = birth.slice(0,2);
        if (by > yy) y = String(Number(y) - 1);
        birth = y+birth;
    }   

    let   term = 2;
    const aTerm = [0, 2, 3, 4, 5, 6, 7, 10, 14, 17, 21, 24, 27, 30, 45, 60, 90];
    sex = String(sex || '').toUpperCase().trim();
    if (sex === '남') sex = 'M';
    else if (sex === '여') sex = 'F';
    else if (sex === 'W') sex = 'F';
    else if (sex.startsWith('1')) sex = 'M';
    else if (sex.startsWith('2')) sex = 'F';
    else if (sex.startsWith('3')) sex = 'M';
    else if (sex.startsWith('4')) sex = 'F';

    if (sdate && rdate) {
        const diffSec = (deps.makeTime(rdate) - deps.makeTime(sdate)) / 1000 ;
        term = Math.ceil(diffSec / 86400); // 날짜 차이 올림
    }
    for (let ix = 0; ix < aTerm.length - 1; ix++) {
        if (aTerm[ix] < term && aTerm[ix + 1] >= term) {
            term = aTerm[ix + 1];
            break;
        }
    }
    let   ageDiffSec = (deps.makeTime(sdate) - deps.makeTime(birth)) / 1000 ;
    const age1 = parseInt(ageDiffSec / (86400 * 365), 10);
    const age2 = Math.round((ageDiffSec % (86400 * 365)) / (86400 * 30));

    let age = age1;
    if (age2 > 6) age ++;

    if (age < 15)         type = '1C';
    else if (age > 79)    type = '1S';
    else if (type !== '') type = String(type).charAt(0) + 'A';
    else                  type = '1A';

    let amt = 0;

    const sqlText = `
        SELECT TOP 1 *
        FROM insure_price_table WITH (NOLOCK)
        WHERE gender      = @gender
          AND insure_age  = @age
          AND insure_type = '1'
          AND insure_pack = @pack
    `;

    const sqlReq = pool.request()
        .input('gender', deps.sql.VarChar, sex)
        .input('age',    deps.sql.Int,     age)
        .input('pack',   deps.sql.VarChar, type);

    const rs = await sqlReq.query(sqlText);
    const row = rs.recordset[0];

    if (row) {
        const termCol = `term_${term}`;
        amt = Number(row[termCol] || 0);
    }

    // 8) 90일 초과시 보험료 상한 적용
    if (term > 90) {
        amt = 100000;
    }

    return {
        TERM: term,
        AMT:  amt,
        TYPE: type,
        AGE:  age,
    };
}

function insureLogSave (url,xml,logdata='',type='') {
    const nows    = deps.getNow().NOWS;
    const nowStr  = deps.getNow().NOWSTIME;
    const logFile = `../admin/Logs/${nows}_insureLogs.txt`;
    const logData = `[${nowStr}]${url}\r\n${xml}\r\n${JSON.stringify(logdata,null,2)}\r\n\r\n`;
    fs.appendFileSync(logFile, logData);
}


module.exports = {
    insureService,
    insureAutoCheck
};