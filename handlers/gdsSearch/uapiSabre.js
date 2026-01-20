const { uapiSabreSearch } = require('../../src/utils/functionSabre');

module.exports = async (req, res) => {
    const data = req.method === 'POST' ? req.body : req.query;
    arr = await uapiSabreSearch (data);
    const rs = {
        GDS: 'A',
        TID: arr.data[0],
        TRID: '',
        DEP_DATE: data.departure_date,
        BSP: 'bspSiteCode'
    };
    res.json({ result: 'ok', search : data ,  received: rs  });
};