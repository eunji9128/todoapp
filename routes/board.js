let router = require('express').Router();

router.get('/sports', function(req, res) {
    res.send('board sub sports page');
});

router.get('/game', function(req, res) {
    res.send('board sub game page');
});

module.exports = router;