const deps = require('../../src/common/dependencies');
const { uidNext } = require('../../src/utils/idxFunction');

function dataPick(obj, keys = []) {
    if (!keys.length) return { ...obj }; // keys가 없으면 전체 복사
    return keys.reduce((acc, key) => {
      acc[key] = obj[key];
      return acc;
    }, {});
}

async function mainOrderQuery(order_num, b2bSiteCode = '', groupGrade = '') {
  if (!order_num) return null;
  const pool = await deps.getPool();

  const fieldQry  = `,  tm.username , tm.handphone as managerPhone , e.manager as managerName , e.tel_number as partner_managerPhone , si.site_name  , deposit + (outstanding_amt * 10000)  as Deposit  `;
	const sqlText  = ` select a.*, p.tourGubun , p.tourName, p.saleUnit , po.roomType ${fieldQry} 
      from orderSheet as a left outer join orderSheet_minor as b on a.order_num = b.order_num and b.minor_num = 1 
      left outer join Products as p on b.tourNumber = p.tourNumber 
      left outer join Products_option as po on b.tourNumber = po.tourNumber and b.option_code = po.minor_num 
      left outer join tblManager as tm on a.manager = tm.member_code 
      left outer join oye2021.dbo.site_manager as e on a.site_code = e.site_code and a.man_id = e.man_id 
      left outer join oye2021.dbo.site as si on a.site_code = si.site_code 
      where a.order_num = @order_num 
   `;
    const result = await pool.request().input('order_num',deps.sql.NVarChar,order_num).query(sqlText);
    const mainRow = result.recordset[0] || {};
    return mainRow;
}

async function mainInterQuery(pool, uid, b2bSiteCode = '', groupGrade = '') {
  if (isNaN(uid)) return null;

  //const pool = await deps.getPool();

  let siteQry = '';
  let qry = '';

  if (groupGrade === 'F') {
    siteQry = `or (c.preSiteCode = '${b2bSiteCode}' or a.site_code in (select site_code from site where preSiteCode = '${b2bSiteCode}'))`;
  } else if (groupGrade === 'C') {
    siteQry = `or c.preSiteCode = '${b2bSiteCode}'`;
  }

  if (b2bSiteCode !== '') {
    qry = `and (a.site_code = '${b2bSiteCode}' or b.bspSiteCode = '${b2bSiteCode}' or 
             (select master_site from site where site_code = a.site_code) = '${b2bSiteCode}' ${siteQry})`;
  }

  const addQry = `, (select carbon_order_price from interline_wincle where uid_minor = a.uid) as wincleSum`;

  const mainSql = `
    SELECT a.*, b.*, c.site_name, c.deposit AS Deposit, c.comm_grade AS CommGrade,
           manager_tel2, c.tel_number, c.TicketNotUse, d.manager AS site_manager
           ${addQry}
      FROM interline AS a
      LEFT OUTER JOIN interline_minor AS b ON a.uid = b.uid_minor
      LEFT OUTER JOIN site AS c ON a.site_code = c.site_code
      LEFT OUTER JOIN site_manager AS d ON a.site_code = d.site_code AND a.manager_id = d.man_id
     WHERE a.uid = '${uid}' ${qry}
  `;

  const mainResult = await pool.request().query(mainSql);
  const mainRow = mainResult.recordset[0] || {};

  const routeSql = `
    SELECT TOP 1 air_code, in_date, citycode, air_class,
           (SELECT TOP 1 minor_num FROM interline_routing WHERE uid_minor = '${uid}' AND minor_num < 11 ORDER BY minor_num DESC) AS maxRoute
      FROM interline_routing
     WHERE uid_minor = '${uid}'
     ORDER BY minor_num ASC
  `;

  const routeResult = await pool.request().query(routeSql);
  const routeRow = routeResult.recordset[0] || {};

  mainRow.FirstAir = routeRow.air_code;
  mainRow.FirstCls = routeRow.air_class;
  mainRow.FirstDate = routeRow.in_date;
  mainRow.maxRoute = routeRow.maxRoute;
  mainRow.CityCode = routeRow.citycode;

  if (!mainRow.first_departure) {
    mainRow.first_departure = mainRow.FirstDate;
  }

  return mainRow;
}

function buildInsertQuery(table, arr) {
  const columns = Object.keys(arr).map(key => `[${key}]`).join(', ');
  const values = Object.values(arr)
    .map(val => (val === null || val === undefined) ? 'NULL' : `'${String(val).replace(/'/g, "''")}'`)
    .join(', ');
  return `INSERT INTO ${table} (${columns}) VALUES (${values})`;
}

async function interSearchLogSave (data,pool) {
  logUid = await uidNext('interline_search_log', pool,'','log_uid');
  if (data.ip.startsWith('::ffff:')) data.ip = data.ip.replace('::ffff:', '');
  const arr = {
    up_date: deps.getNow().NOWS,
    up_time: deps.getNow().TIME,
    site_code: data.site_code || 'AVIA',
    man_id: data.AviaLoginId,
    ticket_type: data.ticket_type,
    src: data.departure,
    dest: data.arrive,
    src2: data.departure2,
    dest2: data.arrive2,
    src3: data.dep_city3,
    dest3: data.arr_city3,
    src4: data.dep_city4,
    dest4: data.arr_city4,
    dep_date: deps.StrClear(data.departure_date),
    dep_date2: deps.StrClear(data.dep_date2),
    dep_date3: deps.StrClear(data.dep_date3),
    dep_date4: deps.StrClear(data.dep_date4),
    arr_date: deps.StrClear(data.arrive_date),
    ip: data.ip,
    log_uid: logUid,
    adt_mem: data.adt,
    chd_mem: data.chd,
    inf_mem: data.inf,
    stopover: data.stopover ?? '',
    shareTime: data.SearchMaxShareTimeData ?? '',
    ref: data.ref || '',
    grade: data.grade ?? '',
    etc: data.etc ?? '',
    bspSiteCode: ''
  };

  const logSql = buildInsertQuery(`interline_search_log`, arr);
  //console.log(logSql)
  await pool.request().query(logSql);
  return logUid;
}

async function interlineLogSave(pool, { uid, query='', id='', b2bLoginId='', ip='' }) {
  if (!uid) return;

  const sql = deps.sql;
  const operator = id || b2bLoginId || '';
  const nows = deps.getNow().NOWSTIME;

  const req = pool.request();
  const { recordset } = await req
    .input('uid', sql.Int, uid)
    .query('SELECT ISNULL(MAX(minor_num),0)+1 AS next_minor FROM interline_log WHERE uid_minor=@uid');

  const minor = recordset[0]?.next_minor ?? 1;

  await pool.request()
    .input('uid',      sql.Int,      uid)
    .input('minor',    sql.Int,      minor)
    .input('content',  sql.NVarChar, query)
    .input('up_date',  sql.NVarChar, nows)
    .input('operator', sql.NVarChar, operator)
    .input('ip',       sql.NVarChar, ip)
    .query(`
      INSERT INTO interline_log (uid_minor, minor_num, content, up_date, operator, ip)
      VALUES (@uid, @minor, @content, @up_date, @operator, @ip)
  `);
  return { ok: true, minor };
}

async function interlineDatLog(pool,{db_name = '', uid = '', content = '' ,username = '', out_ok = 'Y'}) {
  const sql = deps.sql;
  const { recordset } = await pool.request()
    .input('uid', sql.Int, uid)
    .input('db_name', sql.NVarChar, db_name)
    .query('SELECT ISNULL(MAX(minor_num),0)+1 AS next_minor FROM dat_table WHERE uid_minor=@uid and db_name = @db_name ');

  const minor = recordset[0]?.next_minor ?? 1;
  await pool.request()
      .input('db_name',   sql.NVarChar, db_name)
      .input('uid',       sql.NVarChar, uid)
      .input('minor_num', sql.Int,      minor)
      .input('content',   sql.NVarChar, content ?? '')
      .input('username',  sql.NVarChar, username)
      .input('up_date',   sql.NVarChar, deps.getNow().NOWSTIME)
      .input('out_ok',    sql.NVarChar, out_ok)
      .query(`
        INSERT INTO dat_table (db_name, uid_minor, minor_num, content, username, up_date, out_ok)
        VALUES (@db_name, @uid, @minor_num, @content, @username, @up_date, @out_ok)
      `);

}

async function minorNext (pool , {table = '' , uid = '' , uid_minor = '' , query = ''}) {
  let addQry = ' 1=1 ';
  if (uid)       addQry += ` and uid = ${uid}`;
  if (uid_minor) addQry += ` and uid_minor = ${uid_minor}`;
  if (query)     addQry += ` and ${query}`;
  const sqlText = `SELECT ISNULL(MAX(minor_num),0)+1 AS next_minor FROM ${table} WHERE ${addQry} `;
  const { recordset } = await pool.request().query(sqlText);
  const minor = recordset[0]?.next_minor ?? 1;
  return minor;
}

module.exports = {
    dataPick,
    mainInterQuery,
    mainOrderQuery, 
    interSearchLogSave,
    interlineLogSave,
    interlineDatLog,
    minorNext
};