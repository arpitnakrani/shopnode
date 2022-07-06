const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require("mongoose");
const multer = require("multer");
const csrf = require("csurf");
const flash = require("connect-flash");
const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:test123@cluster0.ws29e.mongodb.net/shop`
const session = require("express-session");
var MongoDBStore = require('connect-mongodb-session')(session);
const helmet = require("helmet");
const compression = require("compression");

var store = new MongoDBStore({
  uri: MONGODB_URI ,
  collection: 'sessions'

});

console.log(process.env.MONGO_USER);
const csrfProtction = csrf();


const errorController = require('./controllers/error');
const User = require('./models/user');

const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'images');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) ;
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
})

const fileFilter = (req,file,cb) =>
{
    if(file.mimetype === "image/png" || file.mimetype === "image/jpg" || file.mimetype === "image/jpeg")
    cb(null,true);
    //else
    cb(null,false);
}

app.use(helmet()); //helmet is used to add the security header to every response we are sending to the browser.
app.use(compression()); //it is used to compress files like css files it will be catch by browser automatically it makes process faster. if weuse hosting provider they can do it by their self ..you must not set compression after hosting
app.use(multer({storage : storage , fileFilter : fileFilter}).single("image"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use("/images",express.static(path.join(__dirname, 'images')));

//session implementation
app.use(session({
  secret : "this is a key for hasing of cookie" ,
  resave : false ,
  saveUninitialized : false ,
  store : store
}))

app.use(csrfProtction);
app.use(flash());


//user saving
app.use((req, res, next) => {
  if(!req.session.user)
  {
    return next();
  }
  User.findById(req.session.user._id)
    .then(user => {
      if(!user)
      {
        return next();
      }
      req.user = user;
      next();
    })
    .catch(err => {
      //inside async coe like callback and inside then catch block it will not handle 
      //by the express error hanfling mechanisum means we have to it with next(error) but in sync code error handling can be done by the express error handling mechannism means by throw new Error("msg for error")
      const error = new Error(err);
      error.responseStatusCode = 500;
      return next(error);    // or return next(new Error(err));
    }
    );
});


//adding locals
app.use((req,res,next)=>
{
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

//routes
app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get("/500" , errorController.get500);
app.use(errorController.get404);

app.use((error , req, res ,next)=>
{
  console.log(error);
    res.redirect("/500");
})

//connect with db and run on server
mongoose.connect(MONGODB_URI)
 .then(res =>
  {
    app.listen(process.env.PORT || 3000,()=>{
      console.log("listning on the port 3000  & connected with shop");
    });
  })
  .catch(err => console.log(err));
