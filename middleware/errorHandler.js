const errorHandler = async(err,req,res,next)=>{
    console.log(err);
    res.render('error',{title:'Error'})
}

module.exports = errorHandler