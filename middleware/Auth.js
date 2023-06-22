const User=require('../models/usermodals')


const isLogin = async (req, res, next) => {
  try {
    if (req.session.user_id) {
      const id =req.session.user_id
      const block_user = await User.findOne( {_id:id, id_disable: false} )
      console.log(block_user);
      if(block_user){
        // User is logged in, continue to next middleware or route handler
        next();
      } else {
        // User is not logged in, redirect to login page
        res.redirect("/dashboard");
      }
      
      
    } else {
      // User is not logged in, redirect to login page
      res.redirect("/dashboard");
    }
  } catch (err) {
    console.log(err.message);
    next(err);
  }
};

const isLogout = async (req, res, next) => {
  try {
    if (req.session.user_id) {
      // User is logged in, redirect to home page
      res.redirect("/dashboard");
    } else {
      // User is not logged in, continue to next middleware or route handler
      next();
    }
  } catch (err) {
    console.log(err.message);
    next(err);
  }
};

module.exports = {
  isLogin,
  isLogout,
};
