const express = require("express");
const router = express.Router();
const User = require("../models/user");
const { check, body } = require("express-validator");

const authController = require("../controllers/auth");

router.post("/login", [
        body("email" ,"please enter the valid email!")
        .isEmail()
        .normalizeEmail()
     ,
     body("password" , "plzz enter valid password")
     .isLength({min:5})
     .trim() ,

]
 , authController.postLogin);
 
router.get("/login", authController.getLogin);
router.get("/signup", authController.getSignup);
router.post(
  "/signup",
  [
    check("email", "please enter valid email address!")
      .isEmail()
      .normalizeEmail()
      .custom((value) => {
      return User.findOne({email : value})
      .then(userDoc =>
      {
        if(userDoc)
        { 
          throw new Error("email alredy exists try diffrent one!");
        }
        return true;
     })

      }),
    body(
      "password",
      "plzz enter valid password min length :5 and no special charchter"
    )
      .isLength({ min: 5 })
      .isAlphanumeric()
      .trim(),

    body("confirmPassword" , "password does not match!")
    .custom((value, {req}) =>
    {
        if(value !== req.body.password)
        throw new Error("password do not match!");
        return true;
    })
  ],
  authController.postSignup
);
router.post("/new-password", authController.postNewPassword);
router.get("/reset/:token", authController.getNewPassword);
router.post("/reset", authController.postReset);
router.get("/reset", authController.getReset);
router.post("/logout", authController.postLogout);

module.exports = router;
