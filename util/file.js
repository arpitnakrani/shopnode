const fs = require("fs");
const path =require("path");

const deleteFile = (deletePath) => {
        fs.unlink(deletePath , (err ,res)=>
        {
            if(err)
            throw (err);
            else
            console.log("image of product deleted succesfully");
        });
 }

 module.exports.deleteFile = deleteFile ;