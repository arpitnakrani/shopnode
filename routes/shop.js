const path = require('path');

const express = require('express');

const shopController = require('../controllers/shop');
const isAuth = require("../middleware/is-auth");


const router = express.Router();


router.get('/products', shopController.getProducts);


router.get('/', shopController.getIndex);
router.get('/cart',isAuth, shopController.getCart);
router.post('/cart',isAuth, shopController.postCart);
router.get("/checkout" , isAuth , shopController.getCheckout);
router.get("/checkout/success" , isAuth , shopController.getCheckoutSuccess); //redirect to the orders list tab
router.get("/checkout/cancel" , isAuth , shopController.getCheckout); //payment failed redirect to the checkout page again
router.get('/orders',isAuth, shopController.getOrders);
router.get("/orders/:orderId" ,isAuth, shopController.getInvoice);
router.post('/cart-delete-item',isAuth, shopController.postCartDeleteProduct);
router.get('/products/:productId',shopController.getProduct);


module.exports = router;
  