const Product = require('../models/product');
const { validationResult } = require("express-validator");
const fileOpration = require("../util/file");


exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    hasError :false ,
    errorMessage : null ,
    validationErrors : [],
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;
  console.log(image);
  const errors = validationResult(req);

  if(!image)
  {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      hasError :true ,
      errorMessage : "image is not valid!" ,
      validationErrors : errors.array() ,
      product : {title : title , price: price ,description : description }
    });
  }

  const imageUrl = image.path;
  if(!errors.isEmpty())
  {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      hasError :true ,
      errorMessage : errors.array()[0].msg ,
      validationErrors : errors.array() ,
      product : {title : title , price: price ,description : description ,  }
    });
  }
  
  const product = new Product({
    title : title,
    price : price,
    description : description,
    imageUrl : imageUrl,
    userId : req.user
  } 
  );
  product
    .save()
    .then(result => {
      // console.log(result);
      console.log('Created Product');
      res.redirect('/admin/products');
    })
    .catch(err => 
      {
        console.log("error in admin products!");
        const error = new Error(err);
        error.httpStatusCode = 500 ;
        return next(error);
      });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect('/');
  }
  const prodId = req.params.productId;
  Product.findById(prodId)
    // Product.findById(prodId)
    .then(product => {
      if (!product) {
        return res.redirect('/');
      }
      res.render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product',
        editing: editMode,
        errorMessage : null,
        hasError : false,
        validationErrors : [],
        product: product,
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

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const image = req.file;
  const updatedDesc = req.body.description;
  const errors = validationResult(req);
  

  if(!errors.isEmpty())
  {
    console.log(errors.array());
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'edit Product',
      path: '/admin/edit-product',
      editing: true,
      hasError :true ,
      errorMessage : errors.array()[0].msg,
      validationErrors : errors.array(),
      product : {title : updatedTitle , price: updatedPrice ,description : updatedDesc , _id : prodId }
    });
  }

  Product.findById(prodId)
  .then(product =>  
    {
      if(product.userId.toString() !== req.user._id.toString())
      {
        console.log("user is not allowed to edit ");
        return res.redirect("/")
      }
      product.title = updatedTitle;
      product.price = updatedPrice;
      product.description = updatedDesc;
      if(image)
      {
        fileOpration.deleteFile(product.imageUrl);
        product.imageUrl  = image.path;
      }
      return product.save()
       .then(result => {
        console.log('UPDATED PRODUCT!');
        res.redirect('/admin/products');
      }) //findbyid return mongoose object we can save it to update the content
    })
   
    .catch(err => 
      {
        console.log("error in admin products!");
        const error = new Error(err);
        error.httpStatusCode = 500 ;
        return next(error);
      });    
};

exports.getProducts = (req, res, next) => {
  Product.find({userId : req.user._id})
    .then(products => {
      res.render('admin/products', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products',
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

exports.deleteProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
  .then(product =>
    {
      if(!product)
      {
        return next(new Error("product not found!"))
      }
      fileOpration.deleteFile(product.imageUrl); 
      return Product.deleteOne({_id : prodId , userId : req.user._id});

    })
    .then(() => {
      console.log('PRODUCT deleted');
      // res.redirect('/admin/products');
      res.status(200).json({message : "sucees!"});
    })
    .catch(err => 
      {
        // console.log("error in admin products!");
        // const error = new Error(err);
        // error.httpStatusCode = 500 ;
        // return next(error);
        res.status(500).json({message : "failded eleting product!"});
      });};
