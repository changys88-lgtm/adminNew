const { dcjejuSearch } = require('../../src/utils/functionDcjeju');

module.exports = async (req, res) => {
    const data = req.method === 'POST' ? req.body : req.query;
    const arr = await dcjejuSearch (data);
    const rs = {
        KEY: data.key,
        UID: arr.data,
        DEP_DATE: data.depDate,
    };
    res.json({ result: 'ok', search : data ,  received: rs  });
};