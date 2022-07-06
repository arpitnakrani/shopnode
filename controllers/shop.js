const path = require("path");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const stripe = require('stripe')(process.env.STRIPE_KEY);
const Product = require('../models/product');
const User = require("../models/user");
const Order = require("../models/order");
const { type } = require("os");
const PROD_PER_PAGE = 3;



exports.getProducts = (req, res, next) => {
  Product.find()
    .skip((page-1) * PROD_PER_PAGE)
    .limit(PROD_PER_PAGE)
    .then(products => {
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'All Products',
        path: '/products',
      });
    })
    .catch(err => 
      {
        console.log("error in admin products!");
        const error = new Error(err);
        error.httpStatusCode = 500 ;
        return next(error);
      });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;

  Product.findById(prodId)
    .then(product => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products',
      });
    })
    .catch(err => 
      {
        console.log("error in admin products!");
        const error = new Error(err);
        error.httpStatusCode = 500 ;
        return next(error);
      });};

exports.getIndex = (req, res, next) => {

  const page = +req.query.page || 1;
  let totalItems;

  Product.find()
  .countDocuments()
  .then(numProducts =>
    {
      totalItems = numProducts ; 
      return Product.find()
      .skip((page-1) * PROD_PER_PAGE)
      .limit(PROD_PER_PAGE);
    })
    .then(products => {
      console.log(req.session.isLoggedIn);
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/',
        currentPage : page ,
        hasNextPage : page < Math.ceil(totalItems/PROD_PER_PAGE) ,
        hasPreviousPage : page-1 > 1,
        nextPage : page+1,
        previousPage : page-1 ,
      
        lastPage : Math.ceil(totalItems/PROD_PER_PAGE) 
      });
    })
    .catch(err => 
      {
        console.log("error in admin products!");
        const error = new Error(err);
        error.httpStatusCode = 500 ;
        return next(error);
      });
};

exports.getCart = (req, res, next) => {

 User
.findById(req.user._id)  //User.
.populate("cart.items.productId")
  .then(user =>
    {
      // console.log(user.cart.items);
      const products = user.cart.items ;
      res.render('shop/cart', {
                  path: '/cart',
                  pageTitle: 'Your Cart',
                  products: products,
                  
                });
    })
    .catch(err => 
      {
        console.log("error in admin products!");
        const error = new Error(err);
        error.httpStatusCode = 500 ;
        return next(error);
      });
  //-------------------------------------------
  // req.user
  //   .getCart()
  //   .then(cart => {
  //     return cart
  //       .getProducts()
  //       .then(products => {
  //         res.render('shop/cart', {
  //           path: '/cart',
  //           pageTitle: 'Your Cart',
  //           products: products
  //         });
  //       })
  //       .catch(err => console.log(err));
  //   })
  //   .catch(err => console.log(err));
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then(product => {
      return req.user.addToCart(product);
    })
    .then(result => {
    res.redirect('/cart');
    })
    .catch(err => 
      {
        console.log("error in admin products!");
        const error = new Error(err);
        error.httpStatusCode = 500 ;
        return next(error);
      });
    };

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;

  req.user
  .removeFromCart(prodId)  //req.user
  .then(() =>
    {
     res.redirect('/cart');
      console.log("cart item deleted!");
    })
    .catch(err => 
      {
        console.log("error in admin products!");
        const error = new Error(err);
        error.httpStatusCode = 500 ;
        return next(error);
      });
};

exports.getCheckoutSuccess = (req, res, next) => {

  req.user //req.user
  .populate("cart.items.productId")
  .then(user =>
    {
       const products = user.cart.items.map(i =>
        {
          return {
            product : {...i.productId._doc},
            qty : i.qty 
          }
        })
        const order = new Order({
          user : {
            email : user.email ,
            userId : req.user 
          },
          products : products
        })
       return order.save()
    })
    .then(()=>
    {
     return  req.user.clearCart();
    })
    .then(result => {
      res.redirect('/orders');
    })
    .catch(err => 
      {
        console.log("error in admin products!");
        const error = new Error(err);
        error.httpStatusCode = 500 ;
        return next(error);
      });};

exports.getOrders = (req, res, next) => {

  Order.find({"user.userId" : req.user._id})
    .then(orders =>      // [{items : {pdata,qty} , user : {}} ,{}]
      {
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders,
      });
    })
    .catch(err => 
      {
        console.log("error in admin products!");
        const error = new Error(err);
        error.httpStatusCode = 500 ;
        return next(error);
      });};

exports.getInvoice = (req,res,next)=>
{
  const orderId = req.params.orderId;
  Order.findById(orderId)
  .then(order=>
    {
      if(!order)
      {
        return next(new Error("order not found!"));
      }
      
      if(order.user.userId.toString() !== req.user._id.toString()){
        const error = new Error("unauthorized!!")
        return next(error);
      }
        //else
        const invoiceId = "invoice-" + orderId + ".pdf";
        const invoicePath = path.join("data","invoices" ,invoiceId);

        const pdfDoc = new PDFDocument();
        pdfDoc.pipe(fs.createWriteStream(invoicePath));
        // pdfDoc.text("hello world!");
        res.setHeader("Content-Type" ,"application/pdf");
        res.setHeader("Content-Disposition", 'inline;filename="'+ invoiceId +'"');
        pdfDoc.pipe(res);
        pdfDoc.fontSize(24).text("invoice") ;
        pdfDoc.text("--------------------");
        let totalPrice = 0;
        order.products.forEach(p =>
          {
            totalPrice += p.qty*p.product.price;
            pdfDoc.text(p.product.title + " -- " + p.qty + " * " + "$" +  p.product.price);
          });

        pdfDoc.text("-----------");
        pdfDoc.fontSize(24).text("total price : " + "$"+totalPrice );
        pdfDoc.end();
        // fs.readFile(invoicePath , (err , file)=>
        // {
        //   if(err)
        //   return next(err);
        //   else
        //   {
        //     res.setHeader("Content-Type" ,"application/pdf");
        //     res.setHeader("Content-Disposition", 'inline;filename="'+ invoiceId +'"');
        //     //res.setHeader("Content-Disposition" , 'inline; filename="' + invoiceId + '"');
        //     res.send(file);
        //   }
        // })
        // const fileRs = fs.createReadStream(invoicePath);
        // res.setHeader("Content-Type" ,"application/pdf");
        // res.setHeader("Content-Disposition", 'inline;filename="'+ invoiceId +'"');
        // fileRs.pipe(res);
     })
  .catch(err => {
    console.log("databse error!");
    next(err);
  })

}

exports.getCheckout = (req,res,next)=>
{
  let total = 0;
  let  products ;
    
  User
  .findById(req.user._id)  //User.
  .populate("cart.items.productId")
  .then(user =>
    {
      // console.log(user.cart.items);
      products = user.cart.items;
      total = 0;
      user.cart.items.map(p =>
        {
            total += p.productId.price * p.qty;
        });

        return stripe.checkout.sessions.create({
          payment_method_types : ["card"] ,
          line_items: products.map(p =>
            {
              return {
                  name : p.productId.title ,
                  description : p.productId.description ,
                  amount : p.productId.price ,
                  currency : "usd" ,
                  quantity : p.qty ,

              }
            }),
          
          // mode: 'payment',
          success_url: req.protocol + "://"+ req.get("host") + "/checkout/success",
          cancel_url: req.protocol + "://"+ req.get("host") + "/checkout/cancel",
        });
     
    })
    .then(session =>
      {
        res.render('shop/checkout', {
          path: '/checkout',
          pageTitle: 'checkout',
          products: products,
          totalSum :total ,
          sessionId : session.id
        });
      })
    .catch(err => 
      {
        console.log("error in getCheckout !");
        const error = new Error(err);
        error.httpStatusCode = 500 ;
        return next(error);
      });

}