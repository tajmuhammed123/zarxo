const express=require('express')
const admin_route= express()

const session = require("express-session");
const config = require("../config/config");

admin_route.use(express.json())
admin_route.use(express.urlencoded({ extended: true }))

const path=require('path')
const multer= require('multer')

const auth=require('../middleware/adminAuth')

const storage =multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,path.join(__dirname,'../public/admin/images'))
    },
    filename:function(req,file,cb){
        const name = Date.now()+'-'+file.originalname
        cb(null,name)
    }
})


const upload=multer({storage:storage})

admin_route.set('view engine','ejs')
admin_route.set('views','./views/admin')

// ------------------------ CONTROLLERS ------------------------ //

const adminController=require('../controllers/adminController');
const orderController=require('../controllers/orderController');

// ------------------------ LOGIN ------------------------ //

admin_route.get('/',auth.isLogout,adminController.loadLogin)
admin_route.post('/',adminController.verifyLogin)
admin_route.get('/logout',auth.isLogin,adminController.logout)
admin_route.get('/user-details',auth.isLogin,adminController.loadUser)

// ------------------------ PRODUCTS ------------------------ //

admin_route.get('/product-details',auth.isLogin,adminController.loadProducts)
admin_route.get('/dashboard',auth.isLogin,adminController.loadDashboard)
admin_route.get('/addproduct',auth.isLogin,adminController.loadAddProduct)
admin_route.post('/addproduct',upload.array('product_img'),adminController.addProduct)
admin_route.get('/editproducts',auth.isLogin,adminController.editProduct)
admin_route.post("/editproducts", adminController.updateProduct);
admin_route.post("/edit_product_image",upload.array('product_img'), adminController.editProductImage);


// ------------------------ ORDER ------------------------ //

admin_route.get('/orders',auth.isLogin,adminController.loadOrders)

admin_route.get('/orderaddress',auth.isLogin,adminController.loadOrderAddress)

// ------------------------ PRODUCTS ------------------------ //

admin_route.get('/id_disable',auth.isLogin,adminController.disableProduct)
admin_route.get('/id_undisable',auth.isLogin,adminController.enableProduct)
admin_route.get('/orderproducts',auth.isLogin,adminController.loadOrderProducts)
admin_route.post('/orderproducts',auth.isLogin,orderController.productStatus)

// ------------------------ USER BLOCK/UNBLOCK ------------------------ //

admin_route.get('/user_disable',auth.isLogin,adminController.disableUser)
admin_route.get('/user_undisable',auth.isLogin,adminController.enableUser)

// ------------------------ COUPON ------------------------ //

admin_route.get('/couponlist',auth.isLogin,adminController.listCoupon)
admin_route.get('/addcoupon',auth.isLogin,adminController.loadAddCoupon)
admin_route.post('/addcoupon',adminController.addCoupon)
admin_route.get('/editcoupon',auth.isLogin,adminController.loadeditCoupon)
admin_route.put('/editcoupon',adminController.editCoupon)

// ------------------------ CATEGOREY ------------------------ //

admin_route.get('/addcategorey',auth.isLogin,adminController.loadAddCategorey)

admin_route.post('/addcategorey',auth.isLogin,adminController.addCategorey)

// admin_route.post('/editcategory',auth.isLogin,adminController.editProdutStatus)

admin_route.get('/category',auth.isLogin,adminController.loadCategorey)
admin_route.get('/category_disable',auth.isLogin,adminController.disableCategory)
admin_route.get('/category_undisable',auth.isLogin,adminController.enableCategory)
admin_route.get('/editcategory',auth.isLogin,adminController.loadeditCategorey)
admin_route.put('/editcategory',adminController.editCategorey)

// ------------------------ REPORT ------------------------ //

admin_route.get('/pdfdownload',auth.isLogin,adminController.saleReport)

// ------------------------ BANNER ------------------------ //

admin_route.get('/banner',auth.isLogin, adminController.loadAddBanner);
admin_route.post('/banner',upload.single('banner_img'), adminController.addBanner);
admin_route.get('/bannerlist',auth.isLogin, adminController.bannerList);
admin_route.get('/editbanner',auth.isLogin, adminController.loadEditBanner);
admin_route.post('/editbanner',upload.single('banner_img'), adminController.editBanner);

// ------------------------ OFFER ------------------------ //

admin_route.get('/addoffer',auth.isLogin, adminController.loadaddOffer);
admin_route.post('/addoffer',auth.isLogin, adminController.addOffer);



module.exports = admin_route