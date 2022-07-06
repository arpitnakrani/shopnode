const path = require('path');

const express = require('express');

const adminController = require('../controllers/admin');
const isAuth = require("../middleware/is-auth");
const {body} = require("express-validator");

const router = express.Router();

// // /admin/add-product => GET
router.get('/add-product', adminController.getAddProduct);

// // /admin/products => GET

// // /admin/add-product => POST
router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);
router.post('/edit-product', isAuth,[

    body("title" ,"please enter title!")
    .isString()
    .notEmpty()
    .trim()
    .isLength({min : 3}),

    body("price" ,"enter valid price")
    .isFloat() ,

    body("description" ,"enter valid description")
    .isAlphanumeric()
    .trim() ,    
] 
 , adminController.postEditProduct);
router.delete('/product/:productId',isAuth, adminController.deleteProduct);
router.post('/add-product',isAuth, [

    body("title" ,"please enter title!")
    .isAlphanumeric()
    .notEmpty()
    .trim()
    .isLength({min : 3}),

    body("price" ,"enter price")
    .isFloat() ,

    body("description" ,"enter desc")
    .trim() ,    
] ,adminController.postAddProduct);
router.get('/products',isAuth, adminController.getProducts);



module.exports = router;
