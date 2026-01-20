const express = require('express');
const sql = require('mssql');
const app = express();
const port = 3000;
const { dbConfig, blockedIP, getNow } = require('../lib/config');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get('/', (req, res) => {
    res.render('index');
});

app.get('/orders', async (req, res) => {
    res.render('../air/order_list');
});

app.post('/orders', async (req, res) => {
  const {
    sWord = '',
    sFrom = '',
    start_date = '',
    end_date = '',
    Sorting = 'uid',
    page = 1,
    pageSize = 20
  } = req.query;

  const offset = (page - 1) * pageSize;
  const limit = parseInt(pageSize);

  try {
    await sql.connect(dbConfig);

    let whereClause = "WHERE atr_yes != 'DOM'";

    if (sWord && sFrom) {
      if (sFrom === 'pax_name') {
        whereClause += ` AND EXISTS (SELECT 1 FROM interline_pax WHERE uid_minor = a.uid AND CONCAT(eng_name1, eng_name2) LIKE '%${sWord}%')`;
      } else {
        whereClause += ` AND ${sFrom} LIKE '%${sWord}%'`;
      }
    }

    if (start_date) {
      whereClause += ` AND a.order_date >= '${start_date}000000'`;
    }
    if (end_date) {
      whereClause += ` AND a.order_date <= '${end_date}235959'`;
    }

    const baseQuery = `
      SELECT a.uid, a.order_date, a.issue_date, k.eng_name1, k.eng_name2,
             d.air_code, d.citycode, b.site_name, a.in_status
      FROM interline AS a WITH (NOLOCK)
      LEFT JOIN interline_pax AS k WITH (NOLOCK) ON a.uid = k.uid_minor AND k.minor_num = '1'
      LEFT JOIN interline_routing AS d WITH (NOLOCK) ON a.uid = d.uid_minor AND d.minor_num = '1'
      LEFT JOIN site AS b WITH (NOLOCK) ON a.site_code = b.site_code
      ${whereClause}
      ORDER BY ${Sorting} DESC
      OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY
    `;

    const result = await sql.query(baseQuery);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  } finally {
    await sql.close();
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});