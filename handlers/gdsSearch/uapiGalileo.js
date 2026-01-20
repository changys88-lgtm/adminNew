//const { createHeader , newTraceID , uapiGalSearch } = require('../../src/utils/functionGalileo');
const { createHeader , newTraceID , uapiGalSearch } = require('../../src/utils/functionGalileo');

module.exports = async (req, res) => {
    const data = req.method === 'POST' ? req.body : req.query;
    arr = await uapiGalSearch (data);
    const rs = {
        GDS: 'G',
        TID: arr.data[0],
        TRID: arr.data[1],
        DEP_DATE: data.departure_date,
        BSP: 'bspSiteCode'
    };
    res.json({ result: 'ok', search : data ,  received: rs  });
};