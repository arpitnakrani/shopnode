const User = require("../models/user");
const bcrypt= require("bcryptjs");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const { validationResult } = require("express-validator");

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'arpitnakrani2580@gmail.com',
    pass: "ogohoggkmtrcfjhe"
  }
});



exports.getLogin =  (req,res,next) =>
{

  const errors = validationResult(req);
        res.render('auth/login', {
        path: "/login",
        pageTitle: 'login',
        errorMessage : "",
        validationErrors : [],
        oldInputs : {email : "", password : "" } ,

      });
}


exports.postLogin =  (req,res,next) =>
{
  const email = req.body.email ;
  const password = req.body.password ;
  const errors = validationResult(req);


  if(!errors.isEmpty())
  {
    return res.status(422).render('auth/login', {
      path: "/login",
      pageTitle: 'login',
      errorMessage : errors.array()[0].msg ,
      validationErrors : errors.array() ,
      oldInputs : {email : email, password : password } ,
    });
  }

  User.findOne({email : email})
  .then(user => //
    {
        if(!user)
        {
          const errors = validationResult(req);
          return    res.status(422).render('auth/login', {
            path: "/login",
            pageTitle: 'login',
            errorMessage : errors.array()[0].msg ,
            validationErrors : errors.array() ,
            oldInputs : {email : email, password : password } ,
          });
        }
        //verify the password
        return bcrypt.compare(password , user.password)
        .then(doMatch =>
          {
            if(!doMatch) 
            {
            console.log("password do not match!");
             return res.redirect("/login");
            } 
            //else setup the session if password is matching
            req.session.isLoggedIn = true ;
            req.session.user = user;
            return req.session.save((err)=>
            {
              res.redirect("/");    // no need to save the session but in case loading defects we can make use of that
            })
          })
    })
    .catch(err => 
      {
        console.log("error in admin products!");
        const error = new Error(err);
        error.httpStatusCode = 500 ;
        return next(error);
      });}

exports.postLogout =  (req,res,next) =>
{
    req.session.destroy( (err)=>
    {
      console.log(err);
      res.redirect("/");
    })
}

exports.getSignup =  (req,res,next) =>
{
  let message = req.flash("userMessage")
  if(message.length >= 0)
  {
    message = message[0];
  }
  else
  {
    message = null;
  }
  res.render('auth/signup',{
    path: "/signup",
    pageTitle: 'signup',
    userMessage : message ,
    oldInputs : {
      email : "" ,
      password : "",
      confirmPassword : ""
    } ,
    validationErrors  : []
  });
}

exports.postSignup =  (req,res,next) =>
{
  const email = req.body.email;
    const password = req.body.password ;
    const confirmPassword = req.body.confirmPassword ;

  const errors = validationResult(req);
  if(!errors.isEmpty())
  {
    return  res.status(422).render('auth/signup',{
      path: "/signup",
      pageTitle: 'signup',
      userMessage : errors.array()[0].msg ,
      oldInputs : {email : email, password : password , confirmPassword : confirmPassword} ,
      validationErrors  : errors.array()
    });
  }
       bcrypt.hash(password ,12)
        .then(hashPasword =>
          {
            const user = new User({
              email : email ,
              password : hashPasword,
              cart : {items : []}
            })
            return user.save()
          })
          .then(result =>
            {
               res.redirect("/login");
               var mailOptions = {
                from: 'arpitnakrani2580@gmail.com',
                to: email,
                subject: 'Succesfully signedup!',
                text: `Hi, thank you for your nice Node.js tutorials.`
                // html: '<h1>Hi Smartherd</h1><p>Your Messsage</p>'        
                }
              transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                  console.log(error);
                } else {
                  console.log('Email sent: ' + info.response);
                }
              });
            })
            .catch(err => 
              {
                console.log("error in admin products!");
                const error = new Error(err);
                error.httpStatusCode = 500 ;
                return next(error);
              });            
}



exports.getReset = (req,res,next)=>
{
  let message = req.flash("error")
  if(message.length >= 0)
  {
    message = message[0];
  }
  else
  {
    message = null;
  }

  res.render('auth/reset', {
    path: "/reset",
    pageTitle: 'Reset Password',
    errorMessage : message
  });
}

exports.postReset = (req,res,next)=>
{
  const email = req.body.email;
  crypto.randomBytes(32,(err,buffer)=>
  {
    if(err)
    {
      console.log(err);
      return res.redirect("/reset");
    }
    
      const token = buffer.toString("hex");
      User.findOne({email : email})
      .then(user =>
        {
          if(!user)
          {
            req.flash("error" ,"user not found with this email!");
            return res.redirect("/reset");
          }
          user.resetToken = token ;
          user.resetTokenExpiry = Date.now() + 1000*60*60
          return user.save();

        })
        .then(result =>
          {
            res.redirect("/");
            var mailOptions = {
              from: 'arpitnakrani2580@gmail.com',
              to: email,
              subject: 'Reset Password',
              html: `<p>hello you requested password reset </p>
              <a href="http://localhost:3000/reset/${token}"> click here  to reset password!</a>`
              // html: '<h1>Hi Smartherd</h1><p>Your Messsage</p>'        
            };
            
            transporter.sendMail(mailOptions, function(error, info){
              if (error) {
                console.log(error);
              } else {
                console.log('Email sent: ' + info.response);
              }
            });
          })
          .catch(err => 
            {
              console.log("error in admin products!");
              const error = new Error(err);
              error.httpStatusCode = 500 ;
              return next(error);
            });    
  })
}

exports.getNewPassword = (req,res,next)=>
{
  const token = req.params.token ;

  User.findOne({resetToken : token ,resetTokenExpiry : {$gt : Date.now()}})
 .then(user =>
  {
    let message = req.flash("error")
    if(message.length >= 0)
    {
      message = message[0];
    }
    else
    {
      message = null;
    }
      if(!user)
      {
        console.log("token not verified!");
        return;
      }
      res.render('auth/new-password', {
        path: "/New-password",
        pageTitle: 'New Password',
        errorMessage : message,
        userId : user._id.toString()
      });
     
  })
  .catch(err => 
    {
      console.log("error in admin products!");
      const error = new Error(err);
      error.httpStatusCode = 500 ;
      return next(error);
    });}


exports.postNewPassword = (req,res,next)=>
{
  const userId = req.body.userId ;
  const password = req.body.password ;

  User.findOne({_id : userId})
  .then(user =>
    {
        if(!user)
        return console.log("no user found!");
        //else
        req.flash("error","password updated succsfully plzz login");
        return bcrypt.hash(password,12)
        .then(hashPasword =>
          {
            user.password = hashPasword ;
            user.resetToken = undefined ;
            user.resetTokenExpiry = undefined ;
            return user.save()
          })
          .then(result =>
            {
              console.log(user.resetToken)
               res.redirect("/login");
               var mailOptions = {
                from: 'arpitnakrani2580@gmail.com',
                to: user.email,
                subject: 'Succesfully password Changed!!',
                text: `you can now login with new crendtials..`
                // html: '<h1>Hi Smartherd</h1><p>Your Messsage</p>'        
              };
              
              transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                  console.log(error);
                } else {
                  console.log('Email sent: ' + info.response);
                }
              });
            })
      })
      .catch(err => 
        {
          console.log("error in admin products!");
          const error = new Error(err);
          error.httpStatusCode = 500 ;
          return next(error);
        });    
}