let router = require('express').Router();

function isLogin(req, res, next) {
    if (req.user) {
        next()
    } else {
        res.send('login required');
    }
};

router.use(isLogin);

router.get('/shirts', function(req, res) {
    res.send('shirts page');
});

router.get('/pants', function(req, res) {
    res.send('pants page');
});

module.exports = router;