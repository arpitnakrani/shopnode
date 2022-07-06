const deleteProduct = (btn)=>
{
   //without refreshing the page we trying to perform deletation
   const prodId =  btn.parentNode.querySelector("[name=productId]").value ;
   const csrf =  btn.parentNode.querySelector("[name=_csrf]").value ;
   const productElement = btn.closest("article");


   console.log(prodId + "from public/js/admin");

   fetch("/admin/product/" + prodId  , {
    method : "DELETE" ,
    headers : {
        "csrf-token" : csrf
    }
   })
   .then(res =>
    {
        return res.json();
    })
    .then(data =>
        {
            console.log(data + "from public/js/admin");
            productElement.parentNode.removeChild(productElement);
        })
    .catch(err =>
        {
            console.log(err);
        })

}