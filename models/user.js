const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({

  email : {
    type : String ,
    required : true 
  },
  password : {
    type : String ,
    required : true
  },
  resetToken : String,
  resetTokenExpiry : Date, 
  cart : {
    items : [
       {
         productId : { type : Schema.Types.ObjectId ,ref : "Product" , required : true} ,
         qty : {type : Number , required : true}
       }
    ]
  }
});

userSchema.methods.addToCart = function(product) 
{
    //const updatedCartItems = [ {productId : product._id , qty : 1} ]
    let newQty = 1;

      const cartProductIndex = this.cart.items.findIndex( cp => {
        return cp.productId.toString() === product._id.toString();
      });

    const updatedCartItems = [...this.cart.items];
    if (cartProductIndex >= 0) {
      newQty = updatedCartItems[cartProductIndex].qty + 1;
      updatedCartItems[cartProductIndex].qty = newQty;
    } 
    else {
      updatedCartItems.push({
        productId: product._id,
        qty: newQty,
      });
    }

    const updatedCart = {
      items: updatedCartItems,
    };

    this.cart = updatedCart;
    return this.save();
}

userSchema.methods.removeFromCart = function(prodId)
{
  const updatedCartItems = this.cart.items.filter(i =>
    {
      return i.productId.toString() !== prodId.toString() ;
    })
    this.cart.items = updatedCartItems
    return this.save();
}

userSchema.methods.clearCart = function()
{
    this.cart = {
      items:[]
    }

    return this.save();
  
}


module.exports = mongoose.model("User", userSchema);


// const mongodb = require("mongodb");

// const ObjectId = mongodb.ObjectId;

// class User {
//   constructor(username, email, cart, id) {
//     this.name = username;
//     this.email = email;
//     this.cart = cart; // {items: []}
//     this._id = id;
//   }

//   //-----------------------------------------------------
//   save() {
//     const db = getDb();
//     return db.collection("users").insertOne(this);
//   }

//   //----------------------------------------------------------
//   addToCart(product) {
//     //  const updatedCartItems = [ {productId : new ObjectId(product._id) , qty : 1} ]
//     let newQty = 1;
//     let updatedCartItems;
//     let cartProductIndex = -1;

//     if (this.cart) {
//       cartProductIndex = this.cart.items.findIndex((cp) => {
//         return cp.productId.toString() === product._id.toString();
//       });
//     }

//     updatedCartItems = [...this.cart.items];
//     if (cartProductIndex >= 0) {
//       newQty = updatedCartItems[cartProductIndex].qty + 1;
//       updatedCartItems[cartProductIndex].qty = newQty;
//     } else {
//       updatedCartItems.push({
//         productId: new ObjectId(product._id),
//         qty: newQty,
//       });
//     }

//     const updatedCart = {
//       items: updatedCartItems,
//     };

//     const db = getDb();
//     return db
//       .collection("users")
//       .updateOne(
//         { _id: new ObjectId(this._id) },
//         { $set: { cart: updatedCart } }
//       );
//   }

//   //-----------------------------------------------------
//   static findById(userId) {
//     const db = getDb();
//     return db
//       .collection("users")
//       .findOne({ _id: new ObjectId(userId) })
//       .then((user) => {
//         // console.log(user);
//         return user;
//       })
//       .catch((err) => {
//         console.log(err);
//       });
//   }

//   //-------------------------------------------------------
//   getCart() {
//     const db = getDb();
//     const productIds = this.cart.items.map((i) => {
//       return i.productId;
//     });
//     return db
//       .collection("products")
//       .find({ _id: { $in: productIds } })
//       .toArray()
//       .then( products => {
//        return products.map((p) => {
//           return {
//             ...p,
//             qty: this.cart.items.find((i) => {
//               return i.productId.toString() === p._id.toString();
//             }).qty,
//           };
//         });
//       })
//       .catch((err) => console.log(err));
//   }
// //-------------------------------------------------
//   deleteCartItem(prodId)
//   {
//     const updatedCartItems = this.cart.items.filter(i =>
//       {
//         return i.productId.toString() !== prodId.toString();
//       })
//     const db = getDb();
//     return db
//       .collection("users")
//       .updateOne(
//         { _id: new ObjectId(this._id) },
//         { $set: { cart : {items: updatedCartItems }} }
//       );
//   }
//   //-------------------------------------------
//   addOrder()
//   {
//     const db = getDb();
//     return this.getCart().then(products => //products array is containing product data,quantity
//       { 
//         const order ={
//           items : products,
//           user : {
//             userId : new ObjectId(this._id) ,
//             name : this.name
//           }
//         }
//         return db.collection("orders").insertOne(order)  //saving the order
//       })
//       .then( res =>{            //emptying cart
//         console.log("succesfully cart added to orders");
//         this.cart = {items : []};
//         return db
//         .collection("users")
//         .updateOne(
//           { _id: new ObjectId(this._id) },
//           { $set: { cart : { items: [] }} }
//         );
//       })
//       .catch(err => console.log(err));   
//   }
//   //--------------------------------------------------------

//   getOrder()
//   {
//     //from here i changed the code
//     const db = getDb();
//     return db.collection("orders").find({"user.userId" : new ObjectId(this._id)}).toArray()
 
//   }
// }

