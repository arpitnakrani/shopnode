module.exports = (req,res,next) =>{
    if(!req.session.isLoggedIn)
    {
        console.log("not logged in");
        return res.redirect("/login");
    }
    next();
}