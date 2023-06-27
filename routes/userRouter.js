const express = require('express');
const user_route = express();

const session=require('express-session')
const config = require("../config/config");
// user_route.use(session({secret:config.sessionSecret}))

user_route.use(
    session({
      secret: config.sessionSecret,
      saveUninitialized: true,
      resave: false,
      cookie: {
        maxAge: 500000,
      },
    })
  );

user_route.use(express.json())
user_route.use(express.urlencoded({ extended: true }))

user_route.set('view engine','ejs');
user_route.set('views','./views/user')

const auth=require('../middleware/Auth')


const userController= require('../controllers/userController')
const cartController=require('../controllers/cartController');
const orderController = require('../controllers/orderController');

user_route.get('/login',auth.isLogout,userController.loginLoad)

user_route.post("/signup", userController.insertUser);

// user_route.get('/signup',auth.isLogout,userController.loadSignup),

user_route.get('/verify',userController.verifyMail)

user_route.get('/userverify',userController.userVerify)

user_route.post('/login',userController.verifyLogin)

user_route.get('/edituser',userController.editUser)

user_route.post('/edituser',userController.updateUser)

user_route.get('/',auth.isLogin, userController.loadHome)

user_route.get('/dashboard', userController.loadHome)

user_route.get('/shop', userController.loadShop)

// user_route.get('/filter',userController.filterProduct)

user_route.get('/product-detail', userController.productDetail)

user_route.post('/addcart', cartController.addToCart)

user_route.get('/cart',auth.isLogin, cartController.loadCart)

user_route.post('/cart',auth.isLogin, cartController.updateCoupon)

user_route.delete('/deleteproduct',cartController.deleteCartProduct)

user_route.post('/update_cart',auth.isLogin, cartController.updateCart );

user_route.get('/payment',auth.isLogin, cartController.loadPayment);

user_route.get('/addaddress',auth.isLogin, cartController.loadAddAddress);

user_route.post('/payment',auth.isLogin, cartController.addAddress);

user_route.post('/confirm',auth.isLogin, cartController.placeOrder);

user_route.get('/orderhistory',auth.isLogin, orderController.orderHistory);

user_route.get('/userprofile',auth.isLogin, userController.userProfile);

user_route.get('/cancel',auth.isLogin, orderController.cancelProduct);

user_route.get('/return',auth.isLogin, orderController.returnProduct);

user_route.post('/search', userController.searchProduct);

user_route.post('/createOrder', orderController.createOrder);

user_route.post('/coupon', cartController.couponCode);

user_route.get('/success',auth.isLogin, orderController.paymentSuccess);

user_route.post('/paidsuccess',auth.isLogin, orderController.onlinePaySuccess);

user_route.get('/logout',auth.isLogin, userController.userLogout);

user_route.get('/wallet',auth.isLogin, userController.loadWallet);

user_route.get('/lowsort', userController.ascendingFilter);

user_route.get('/highsort', userController.descendingFilter);

user_route.get('/loadmore', userController.loadMore);

user_route.post('/editaddress', userController.loadEditAddress);

user_route.get('/addresslist',auth.isLogin, userController.loadAddress);

user_route.post('/updateaddress', userController.editAddress);

user_route.get('/deleteaddress', userController.deleteAddress);

user_route.get('/orderdetails',auth.isLogin, userController.loadOrderDetails);

user_route.get('/downloadinvoice',auth.isLogin, userController.downloadInvoice);

user_route.get('/forget',userController.forgetLoad)

user_route.post('/forget',userController.forgetVerify)

user_route.get('/forget-password',userController.forgetPasswordLoad)

user_route.post('/forget-password',userController.resetPassword)

user_route.get('/wishlist',auth.isLogin,userController.loadWishlist)

user_route.post('/addwishlist',auth.isLogin,userController.addWishlist)

user_route.post('/addreview',auth.isLogin,userController.addReview)


module.exports = user_route;