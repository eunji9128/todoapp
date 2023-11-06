const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const methodOverride = require('method-override');
app.set('view engine', 'ejs');
app.use(methodOverride('_method'));

var db;

MongoClient.connect('mongodb+srv://admin:admin123@cluster0.zisf71t.mongodb.net/?retryWrites=true&w=majority', function (error, client) {
    if (error) return console.log(error);
    
    db = client.db('todoapp');
    
    app.listen(8080, function () {
        console.log('listening on 8080');
    });

})

app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');

app.use(session({ secret: 'qwerasdf', resave: true, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

app.get('/login', function(req, res) {
    res.render('login.ejs');
})

app.post('/login', passport.authenticate('local', {
    failureRedirect: '/fail'
}), function(req, res) {
    res.redirect('/');
})

passport.use(new LocalStrategy({
    usernameField: 'id',
    passwordField: 'pw',
    session: true,
    passReqToCallback: false,
  }, function (submitId, submitPw, done) {
    console.log(submitId, submitPw);
    db.collection('login').findOne({ id: submitId }, function (error, result) {
      if (error) return done(error);
      if (!result) return done(null, false, { message: '존재하지 않는 아이디입니다.' });
      if (submitPw == result.pw) {
        return done(null, result);
      } else {
        return done(null, false, { message: '비밀번호가 맞지 않습니다.' });
      }
    })
  }));

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    db.collection('login').findOne({id: id}, function(error, result){
        done(null, result);
    })
});

app.post('/register', function(req, res) {
    db.collection('login').insertOne( {id: req.body.id, pw: req.body.pw}, function(error, result) {
        res.redirect('/');
    } )
})

app.get('/write', function (req, res) {
    res.render('write.ejs');
});

app.get('/list', function(req, res) {
    db.collection('post').find().toArray(function(error, result) {
        console.log(result);
        res.render('list.ejs', { posts : result });
    })
})

app.post('/add', function (req, res) {
    db.collection('counter').findOne({name: 'Total Post Amount'}, function(error, result) {
        let totalPost = result.totalPost;
        console.log(totalPost);

        let insertData = {_id: totalPost, user: req.user.id, title: req.body.title, date: req.body.date};
        
        db.collection('post').insertOne(insertData, function(error, result) {
            console.log('add 저장완료');
            db.collection('counter').updateOne({name: 'Total Post Amount'}, {$inc : {totalPost: 1}}, function() {});
        })
    })
    res.send('전송 완료');
    console.log(req.body.title, req.body.date);
})

app.delete('/delete', function(req, res) {
    req.body._id = +req.body._id;
    console.log(req.body);

    let deleteData = { _id: req.body._id, user: req.user.id };

    db.collection('post').deleteOne(deleteData, function(error, result) {
        console.log('삭제 완료');
        res.status(200).send({ message: '삭제 성공' });
    })
})

app.get('/detail/:id', function(req, res) {
    db.collection('post').findOne({_id: +req.params.id} , function(error, result) {
        console.log('error: ', error,', result: ', result);
        res.render('detail.ejs', {post: result});
    })

})

app.get('/edit/:id', function(req, res) {
    db.collection('post').findOne({_id: +req.params.id}, function(error, result) {
        res.render('edit.ejs', {post: result});
    })
})

app.put('/edit', function(req, res) {
    console.log(req.body);
    db.collection('post').updateOne(
        {_id: +req.body.id},
        { $set: { 
            title: req.body.title,
            date: req.body.date,
        }},
        function() {
            res.redirect('/list');
        }
    )
})

app.get('/chat', function(req, res) {
    let postId = req.query.value;
    res.send(postId);
})

app.get('/mypage', isLogin, function(req, res) {
    res.render('myPage.ejs', {user: req.user});
});

function isLogin(req, res, next) {
    if (req.user) {
        next()
    } else {
        res.send('login required');
    }
};

app.get('/search', function(req, res) {
    let searchCond = [
        {
            $search: {
                index: 'titleSearch',
                text: {
                    query: req.query.value,
                    path: 'title',
                }
            }
        },
        {
            $sort: {
                _id: 1,
            }
        },
        {
            $limit: 2,
        }
    ]
    console.log(req.query.value);
    db.collection('post').aggregate(searchCond).toArray((error, result) => {
        console.log(result);
        res.render('search.ejs', { posts : result })
    });
})


app.use('/shop', require('./routes/shop.js'));

app.use('/board/sub', require('./routes/board.js'));


let multer = require('multer');
let storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, './public/image')
    },
    filename: function(req, file, cb) {
        cb(null, file.originalname)
    }
});

let upload = multer({storage: storage});

app.get('/upload', function(req, res) {
    res.render('upload.ejs');
});

app.post('/upload', upload.single('profile'), function(req, res) {
    res.send('uploaded');
});

app.get('/image/:imagename', function(req, res) {
    res.sendFile(__dirname + '/public/image/' + req.params.imagename);
});