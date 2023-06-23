
// ------------------------ IMPORTS ------------------------ //

const User=require('../models/usermodals')
const Products=require('../models/productModels')
const Cart=require('../models/cartModels')
const Order=require('../models/orderModels')
const Wallet=require('../models/walletModels')
const Category=require('../models/categoreyModels')
const Banner=require('../models/bannerModels')
const Wishlist=require('../models/wishlistModels')
const bcrypt = require("bcrypt");
const fs= require('fs')
const pdf=require('pdf-creator-node')
const path=require('path')
const randomstring =require('randomstring')
const Razorpay = require('razorpay'); 
const nodemailer = require('nodemailer')
const config= require('../config/config')
const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY } = process.env;

const razorpayInstance = new Razorpay({
    key_id: RAZORPAY_ID_KEY,
    key_secret: RAZORPAY_SECRET_KEY
});

// ------------------------ SECURE PASSWORD ------------------------ //


const securePassword = async(password) =>{
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;        
    } catch (error) {
        console.log(error.message);
    }
}

// ------------------------ LOGIN/ SIGNUP ------------------------ //

const loginLoad = async(req,res)=>{
    try{
        message=null
        res.render('login',{message})
    }catch(err){
        console.log(err.message);
    }
}

const loadSignup = async(req,res)=>{
    try{
        message=null
        res.render('signup',{message})
    }catch(err){
        console.log(err.message);
    }
}

const insertUser = async (req, res) => {
  try {
    console.log('hjg');
    const spassword = await securePassword(req.body.password);

    const existingMail = await User.findOne({ email: req.body.email });
    const existingUser = await User.findOne({ username: req.body.username });
    if (existingUser || existingMail) {
      return res.status(200).json({ message: "Email or Userid already registered" });
    }

    if (!req.body.name || req.body.name.trim().length === 0) {
      return res.status(200).json({ message: "Please enter a valid name" });
    }

    const user = new User({
      name: req.body.name,
      email: req.body.email,
      mobile: req.body.mob,
      username: req.body.username,
      password: spassword,
      is_admin: 0,
    });

    const userData = await user.save();


    if (userData) {
      await Dashboard.updateOne( {}, { $inc: {total_users:1} });
      sendVerifyMail(req.body.name, req.body.email, userData._id);
      return res.status(200).json({ message: "Registration Success" });
    } else {
      return res.status(200).json({ message: "Registration Failed" });
    }
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const userVerify= async(req,res)=>{

  const userid= req.session.user_id
  console.log(userid);
  const userData= await User.findById({_id:userid})
  console.log(req.query.name);
  console.log(req.query.email);
  console.log(userData);
  sendVerifyMail(req.query.name, req.query.email, userid);
  const cartData = await Cart.findOne({ user_id: userid });
  const title= 'Profile'
  res.render('userprofile',{user:userData, cart:cartData, title, session:userid,  message:"Check your Mail" })
}


const sendVerifyMail= async(name, email, user_id)=>{
  try{
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port:587,
        secure:false,
        requireTLS:true,
        auth:{
          user:config.emailUser,
          pass:config.emailPassword
        }
      })

      const mailOptions={
        from:config.emailUser,
        to:email,
        subject:"For verification mail",
        html:'<p>Hii' + name + ', Please click here to <a href="http://localhost:3000/verify?id=' + user_id + '"> Verify </a> your mail.</p>'
      }
      transporter.sendMail(mailOptions, function(error,info){
        if(error){
          console.log(error);
          res.render("login", { message: "Email verification Failed" });
        }else{
          console.log("Email has been sent to ", info.response);
        }
      })

  }catch(err){
    console.log(err.message);
  }
}

const verifyMail= async(req,res)=>{
  try {
    console.log(req.query.id);
    await User.updateOne(
      { _id: req.query.id },
      { $set: { is_verified: true } },
      { upsert: true }
    );
    const user_id=req.session.user_id
    const cartData = null
    res.render('email-verified',{session:null, title:'Verify', cart:cartData})
  } catch (error) {
    console.log(error.message);
  }
}


const verifyLogin = async(req,res) => {

    try {
        console.log('fgsd');
        const username = req.body.username;
        const password = req.body.password;
        const userData = await User.findOne({username:username, id_disable:false});
        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password);
            if(passwordMatch){
                if(userData.is_admin === 0
                  // ||
                  // userData.is_admin == 1 
                  ){
                req.session.user_id = userData._id;
                res.redirect('/')
                }
                else{
                    res.render('login', {message : "Email or password is incorrect"});
                }
            }
            else{
                res.render('login', {message : "Email or password is incorrect"});
            }           
        } else {
            res.render('login', {message : "Please provide your correct Email and password "});
        }
    } catch (error) {
        console.log(error.message);
    }
}

// ------------------------ EDIT USER ------------------------ //

const editUser=async(req,res)=>{
  try{
    const userid=req.session.user_id
    const userData= await User.findById({_id:userid})
    res.render('edituserdetails',{user:userData})

  }catch(err){
    console.log(err.message);
  }
}


const updateUser=async(req,res)=>{
  try{
    console.log('hjg');
    const userid= req.session.user_id
    const userData= await User.findById({_id:userid})
    const spassword = await securePassword(req.body.password);
    const existingMail = await User.findOne({ $and: [
                                                { email: req.body.email },
                                                { email: { $ne: userData.email } }
                                              ] });
    const existingUser = await User.findOne({
                                              $and: [
                                                { username: req.body.username },
                                                { username: { $ne: userData.username } }
                                              ] });
    if (existingUser || existingMail) {
      return res.render('edituserdetails',{ message: "Email or Userid already registered" });
    }

    if (!req.body.name || req.body.name.trim().length === 0) {
      return res.render('edituserdetails',{ message: "Please enter a valid name" });
    }

    const updateUser = await User.updateOne({_id:req.session.user_id}, {
                    name: req.body.name,
                    email: req.body.email,
                    mobile: req.body.mob,
                    username: req.body.username,
                    is_admin: 0 })

    const cartData = await Cart.findOne({ user_id: userid });
    const title= 'Profile'
    if (updateUser) {
      return res.render('userprofile',{ user:userData, title, cart:cartData,  message: "Registration Success", session:userid });
    } else {
      return res.render('userprofile',{ user:userData, title, cart:cartData, message: "Registration Failed", session:userid });
    }
  }catch(err){
    console.log(err.message);
  }
}

// ------------------------ LOAD HOME ------------------------ //

const loadHome = async (req,res)=> {

        try {
            if(req.session.user_id){
              const banner= await Banner.find({})
              const session=req.session.user_id
              const category = await Category.find({ id_disable: false });
              const categoryIds = category.map(c => c.product_category); // Extract category IDs

              const productData = await Products.find({
                id_disable: false,
                product_category: { $in: categoryIds }
              }).limit(8);
              console.log(productData);
              
            const id=req.session.user_id
            const cartData = await Cart.findOne({ user_id: id })
            const userData = await User.findById({_id : req.session.user_id});
            console.log(id);
            res.render('home',{products:productData, user:userData, session, cart: cartData, category:category, banner:banner});
            }else{
              const banner= await Banner.find({})
              const session=null
              const category = await Category.find({ id_disable: false });
              const categoryIds = category.map(c => c.product_category); // Extract category IDs
              console.log(categoryIds);
              const productData = await Products.find({
                id_disable: false,
                product_category: { $in: categoryIds }
              }).limit(8);
              console.log(banner);
              res.render('home',{products:productData, session, cart: null, category:category, banner:banner})
            }

        } catch (error) {

            console.log(error.message);
        }
}

// ------------------------ LOAD SHOP ------------------------ //

const loadShop = async (req,res)=> {

        try {
            if(req.session.user_id){
              const session=req.session.user_id
              const category = await Category.find({ id_disable: false });
              const categoryIds = category.map(c => c.product_category); // Extract category IDs

              const productData = await Products.find({
                id_disable: false,
                product_category: { $in: categoryIds }
              }).limit(8);
              console.log(productData);
              
            const id=req.session.user_id
            const cartData = await Cart.findOne({ user_id: id })
            const userData = await User.findById({_id : req.session.user_id});
            console.log(id);
            res.render('product',{products:productData, user:userData, session, cart: cartData, category:category});
            }else{
              const session=null
              const category = await Category.find({ id_disable: false });
              const categoryIds = category.map(c => c.product_category); // Extract category IDs
              console.log(categoryIds);
              const productData = await Products.find({
                id_disable: false,
                product_category: { $in: categoryIds }
              }).limit(8);
              res.render('product',{products:productData, session, cart: null, category:category})
            }

        } catch (error) {

            console.log(error.message);
        }
}

// ------------------------ PRODUCT DETAILS ------------------------ //

const productDetail = async(req,res)=>{
    try{
      
      const title='Product Details'

      if(req.session.user_id){
        const session=req.session.user_id
        const id = req.query.id;
        const productData = await Products.findById({ _id: id });
        const userid= req.session.user_id
        const cartData = await Cart.findOne({ user_id: userid })
    
        if (productData) {
          console.log(productData);
          // const adminData = await User.findOne({ is_admin: 1 });
          const userData = await User.findById({ _id: userid })
          res.render("product-detail", { product: productData, userData: userData, session, cart:cartData, title });
        } else {
          res.redirect("/dashboard");
        }
      }else{
        const session=null
        const id = req.query.id;
        const productData = await Products.findById({ _id: id });
        const userid= null
        const cartData = await Cart.findOne({ user_id: userid })
        const userData = null
    
        if (productData) {
          console.log(productData);
          // const adminData = await User.findOne({ is_admin: 1 });
          
          res.render("product-detail", { product: productData, session, cart:cartData, title });
        } else {
          res.redirect("/dashboard");
        }
      }
    }catch(err){
        console.log(err.message);
    }
}

// ------------------------ USER PROFILE ------------------------ //

const userProfile=async(req,res)=>{
  try {
    const userid=req.session.user_id
    const cartData = await Cart.findOne({ user_id: userid });
    const title= 'Profile'
    console.log(cartData);
    message=null
    const user= await User.findById({_id: userid})
        res.render('userprofile',{user:user, cart:cartData, title, message, session:userid })
  } catch (error) {
    console.log(error.message);
  }
}

// ------------------------ SEARCH PRODUCT ------------------------ //

const searchProduct = async (req, res) => {
  try {
    var session = req.session.user_id;
    const banner= await Banner.find({})
    const category = await Category.find({ id_disable: false });

    if (session) {
      const cartData = await Cart.findOne({ user_id: session });
      session = null;
      
      var search = '';
      if (req.body.search) {
        search = req.body.search;
      }

      const userData = await Products.find({ product_name: { $regex: '.*' + search + '.*', $options: 'i' } });

      res.render('home', { products: userData, cart: cartData, session, banner:banner, category:category });
    } else {
      const cart = null;
      session = null;
      
      var search = '';
      if (req.body.search) {
        search = req.body.search;
      }
      console.log(req.body.search);

      const userData = await Products.find({ product_name: { $regex: '.*' + search + '.*', $options: 'i' } });

      res.render('home', { products: userData, cart, session, banner:banner, category:category });
    }
  } catch (error) {
    console.log(error.message);
    // Handle error if needed
    res.status(500).send('An error occurred during the search.');
  }
};

// ------------------------ USER LOGOUT ------------------------ //

const userLogout=async(req,res)=>{
  try{
    req.session.destroy()
    res.redirect('/')
  }catch(err){
    console.log(err.message);
  }
}

// ------------------------ WALLET ------------------------ //

const loadWallet = async (req, res) => {
  try {
    const user_id = req.session.user_id;
  const userData= await User.findById({_id:user_id})
    let wallet = await Wallet.findOne({ user_id: user_id });
    const cartData = await Cart.findOne({ user_id: user_id })
    const title='Wallet'
    if (!wallet) {
      const walletUser = new Wallet({
        user_id: user_id,
        wallet_amount: 0
      });
      wallet = await walletUser.save();
    }
    res.render('wallet', { wallet: wallet, userData:userData, cart:cartData, title, session:user_id });
  } catch (error) {
    console.log(error.message);
  }
};

const addWallet= async(req,res)=>{
  try{

    const userid=req.session.user_id
    const amount =req.body.addamount * 100
    
    
    const options = {
      amount: amount,
      currency: 'INR',
      receipt: 'razorUser@gmail.com'
    };

    razorpayInstance.orders.create(options, async (err, order) => {
      console.log('Razorpay API Response:', err, order);
      if (!err) {
        res.status(200).send({
          success: true,
          amount: amount,
          key_id: RAZORPAY_ID_KEY,
          contact: '9895299091',
          name: 'Taj Muhammed',
          email: 'tajmuhammed4969@gmail.com'
        });

      const wallet= await Wallet.findOne({user_id:userid})
      await Wallet.updateOne({user_id:userid},{
        $inc: {
          wallet_amount: req.body.addamount
        }
      },
      { new: true })
      let wallet_history={
        transaction_amount:'+$'+req.body.addamount
      }
      wallet.wallet_history.shift(wallet_history)
      await wallet.save()
        
      } else {
        console.log('hjghfd');
        res.status(400).send({ success: false, msg: 'Something went wrong!' });
      }
    });

  }catch(err){
    console.log(err.message);
  }
}

// ------------------------ FILTER PRODUCT ------------------------ //

const ascendingFilter=async(req,res)=>{
  try{
    if(req.session.user_id){
      const session=req.session.user_id
      const category = await Category.find({ id_disable: false });
      const categoryIds = category.map(c => c.product_category); 
      const banner= await Banner.find({})
      const productData = await Products.find({
        id_disable: false,
        product_category: { $in: categoryIds }
      }).sort({product_price:1})
    const id=req.session.user_id
    const cartData = await Cart.findOne({ user_id: id })
    const userData = await User.findById({_id : req.session.user_id});
    console.log(id);
    res.render('home',{products:productData, user:userData, session, cart: cartData, banner:banner, category:category});
    }else{
      const session=null
      const category = await Category.find({ id_disable: false });
      const categoryIds = category.map(c => c.product_category); 
      const banner= await Banner.find({})
      const productData = await Products.find({
        id_disable: false,
        product_category: { $in: categoryIds }
      }).sort({product_price:1})
      res.render('home',{products:productData, session, cart: null, banner:banner, category:category})
    }

  }catch(err){
    console.log(err.message);
  }
}


const descendingFilter=async(req,res)=>{
  try{
    if(req.session.user_id){
      const session=req.session.user_id
      const category = await Category.find({ id_disable: false });
      const categoryIds = category.map(c => c.product_category); 
      const banner= await Banner.find({})
      const productData = await Products.find({
        id_disable: false,
        product_category: { $in: categoryIds }
      }).sort({product_price:-1}) 
    const id=req.session.user_id
    const cartData = await Cart.findOne({ user_id: id })
    const userData = await User.findById({_id : req.session.user_id});
    console.log(id);
    res.render('home',{products:productData, user:userData, session, cart: cartData, banner:banner, category:category});
    }else{
      const session=null
      const category = await Category.find({ id_disable: false });
      const categoryIds = category.map(c => c.product_category); 
      const banner= await Banner.find({})
      const productData = await Products.find({
        id_disable: false,
        product_category: { $in: categoryIds }
      }).sort({product_price: -1})
      res.render('home',{products:productData, session, cart: null, banner:banner, category:category})
    }

  }catch(err){
    console.log(err.message);
  }
}

// ------------------------ PAGINATION ------------------------ //

const loadMore=async(req,res)=>{
  try{
    if(req.session.user_id){
      const category = await Category.find({ id_disable: false });
      const categoryIds = category.map(c => c.product_category); 
      const banner= await Banner.find({})
    const title='Wallet'
      const session=req.session.user_id
      const productData = await Products.find({
        id_disable: false,
        product_category: { $in: categoryIds }
      })  
    const id=req.session.user_id
    const cartData = await Cart.findOne({ user_id: id })
    const userData = await User.findById({_id : req.session.user_id});
    console.log(id);
    res.render('home',{products:productData, user:userData, session, cart: cartData, category:category, banner:banner, title});
    }else{
      console.log('hjk');
      const banner= await Banner.find({})
      const session=null
      const category = await Category.find({ id_disable: false });
      const categoryIds = category.map(c => c.product_category); 
      const productData = await Products.find({
        id_disable: false,
        product_category: { $in: categoryIds }
      })
      res.render('home',{products:productData, session, cart: null, banner:banner, category:category})
    }

  }catch(err){
    console.log(err.message);
  }
}

// ------------------------ ADDRESS ------------------------ //

const loadAddress=async(req,res)=>{
  try{
    const userid=req.session.user_id
    const cartData = await Cart.findOne({ user_id: userid })
    const title='Address'
    const userData = await User.findOne({ _id: userid });
      res.render('addresslist',{userid:userData, cart:cartData, title, session:userid })
  }catch(err){
    console.log(err.message);
  }
}

const loadEditAddress=async(req,res)=>{
  try{
    const addressid = req.body.address
    const userid=req.session.user_id
    const userData = await User.findOne({ _id: userid });
    const cartData = await Cart.findOne({ user_id: userid })
    const title='Edit Address'
    const address = userData.address.id(addressid)
    console.log(address);
      res.render('editaddress',{ userid:userData, address:address, cart:cartData, title, session:userid })
  }catch(err){
    console.log(err.message);
  }
}

const editAddress=async(req,res)=>{
  
  try {
    console.log('jkhh');
    const addressid = req.body.addressid;
    const userid = req.session.user_id;
    const updateAddress = {
      firstName: req.body.firstName,
      secondName: req.body.secondName,
      email: req.body.email,
      mobNumber: req.body.mobNumber,
      houseNumber: req.body.houseNumber,
      city: req.body.city,
      state: req.body.state,
      pincode: req.body.pincode
    };
    const user = await User.findById(userid);
  
    const address = user.address.id(addressid);

    address.set(updateAddress);
    await user.save();
    res.redirect('/addresslist')

  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
  
}

const deleteAddress=async(req,res)=>{
  try {
      const addressid= req.query.addressid
      const userid=req.session.user_id
      const userData = await User.findOne({ _id: userid });
      userData.address.pull({ _id: addressid });
      await userData.save();
      const cartData = await Cart.findOne({ user_id: userid })
      const title='Address'
      res.render('addresslist',{userid:userData, cart:cartData, title, session:userid })

  } catch (error) {
    console.log(error.message);
  }
}

// ------------------------ ORDER DETAILS ------------------------ //

const loadOrderDetails=async(req,res)=>{
  try{
    const id=req.session.user_id
    const productid=req.query.productid
    const user= await User.findById(id)
    console.log(user);
    const orderData = await Order.findOne({ customer_id: id });
    const cartData = await Cart.findOne({ user_id: id })
    const title='Order'
    const order = orderData.product_details.find((product) => product._id.toString() === productid);
    console.log(order);
      res.render('orderdetails',{ order:order, user:user, cart:cartData, title })
  }catch(err){
    console.log(err.message);
  }
}

const generatePdf = async (req, res) => {
  try {
    console.log('khjgf');
    const html = fs.readFileSync(path.join(__dirname, '../views/user/template.ejs'), 'utf-8');
    const filename = Math.random() + '_doc' + '.pdf';


    const prod = {
      name: req.body.name,
      description: req.body.description,
      unit: req.body.unit,
      quantity: req.body.quantity,
      price: req.body.price,
      total: req.body.quantity * req.body.price,
      imgurl: req.body.imgurl,
      username: req.body.username,
      mob: req.body.mob,
      email: req.body.email,
      date: req.body.date,
      id: req.body.id,
      amount:req.body.amount

    };

    let subtotal = prod.total;
    const tax = (subtotal * 20) / 100;
    const grandtotal = subtotal - tax;

    const obj = {
      // prodlist: [prod],      
      name: req.body.name,
      description: req.body.description,
      unit: req.body.unit,
      quantity: req.body.quantity,
      price: req.body.price,
      total: req.body.quantity * req.body.price,
      imgurl: req.body.imgurl,
      username: req.body.username,
      mob: req.body.mob,
      email: req.body.email,
      date: req.body.date,
      id: req.body.id,
      amount:req.body.amount,
      subtotal: subtotal,
      tax: tax,
      gtotal: grandtotal,
      prdcts: [prod]
    };

    console.log(obj);

    const options = {
      format: 'A3',
      orientation: 'portrait',
      border: '8mm',
      header: {
        height: '15mm',
        contents: '<h4 style="color: red; font-size: 20; font-weight: 800; text-align: center;">CUSTOMER INVOICE</h4>'
      },
      footer: {
        height: '20mm',
        contents: {
          first: 'Cover page',
          2: 'Second page',
          default: '<span style="color: #444;">page</span>/<span>pages</span>',
          last: 'Last Page'
        }
      }
    };

    const document = {
      html: html,
      data: {
        products: obj
      },
      path: './docs/' + filename
    };

    pdf.create(document, options)
      .then(result => {
        console.log(result);
      })
      .catch(error => {
        console.log(error);
      });

    const filepath = filename;
    console.log(filepath);
    res.redirect('/download?filepath=' + encodeURIComponent(filepath));
  } catch (err) {
    console.log(err.message);
  }
};

const loadDownload=async(req,res)=>{
  try{
    console.log('jkhgfd');
    const filepath = req.query.filepath;
      res.render('download', { path: filepath })
  }catch(err){
    console.log(err.message);
  }
}

// ------------------------ FORGET PASSWORD ------------------------ //

const sentResetPassword = async (name, email, token) => {
  try {
      const transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          requireTLS: true,
          auth: {
              user: config.emailUser,
              pass: config.emailPassword
          }
      })
      const mailOptions = {
          from: config.emailUser,
          to: email,
          subject: "For Reset Password",
          html: '<p>Hii ' + name + ',Please click here to <a href="http://localhost:3000/forget-password?token=' + token + '"> Reset </a> your Password.</p>'
      }
      transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
              console.log(error);
          } else {
              console.log("Email has been sent:- ", info.response);
          }
      })
  } catch (error) {
      console.log(error.message);
  }
}

const forgetLoad = async (req, res) => {
  try {
      res.render('forget');
  } catch (error) {
      console.log(error.message);
  }
}

const forgetVerify = async (req, res) => {
  try {

      const email = req.body.email;
      const userData = await User.findOne({ email: email });
      if (userData) {

          if (userData.is_verifed === 0) {
              res.render("forget", { message: "Please Verify Your Mail" })
          }
          else {
              const randomString = randomstring.generate();
              const updateData = await User.updateOne({ email: email }, { $set: { token: randomString } })
              sentResetPassword(userData.name, userData.email, randomString)
              res.render('forget', { message: "Please check your mail to reset your password." })
          }
      } else {
          res.render('forget', { message: "user email is incorrect." });
      }
  } catch (error) {
      console.log(error.message);
  }
}

const forgetPasswordLoad = async (req, res) => {
  try {
      const token = req.query.token;
      const tokenData = await User.findOne({ token: token })
      if (tokenData) {
          res.render('forget-password', { user_id: tokenData._id })
      } else {
          res.render('404', { message: "Token is invalid" })
      }
  } catch (error) {
      console.log(error.message);
  }
}

const resetPassword = async (req, res) => {
  try {
      const password = req.body.password;
      const user_id = req.body.user_id
      const secure_Password = await securePassword(password)
      const updateData = await User.findByIdAndUpdate({ _id: user_id }, { $set: { password: secure_Password, token: '' } })

      res.redirect("/")

  } catch (error) {
      console.log(error.message);
  }
}

// ------------------------ WISHLIST ------------------------ //

const loadWishlist=async(req,res)=>{
  try {
    const userid=req.session.user_id

    const wishlistData = await Wishlist.findOne({ customer_id: userid });
    const productIds = Array.from(new Set(wishlistData.product_id)); 
    const products = await Products.find({ _id: { $in: productIds } });
    
    
      const cartData=await Cart.findOne({ user_id: userid })
      res.render('wishlist',{products:products,session:userid, cart:cartData})
  } catch (error) {
    console.log(error.message);
  }
}

const addWishlist=async(req,res)=>{
    try{
      console.log(req.body.productid);
        const productid = req.body.productid
        const wishlistData = await Wishlist.findOne({ customer_id: req.session.user_id, product_id: productid });
        const productIdToDelete = req.body.productid;
        console.log(wishlistData);
        
        if (wishlistData) {
          const productIds = wishlistData.product_id;
          const updatedProductIds = productIds.filter((productId) => productId !== productIdToDelete);
        
          wishlistData.product_id = updatedProductIds;
          await wishlistData.save();
          res.status(200).send({ success: false, message: 'Product removed from wishlist.' });
        } else {
          console.log('ghfg');
          await Wishlist.findOneAndUpdate(
            { customer_id: req.session.user_id },
            { $push: { product_id: productid } },
            { new: true, upsert: true }
          );

          res.status(200).send({ success: true, message: 'Product added to wishlist' });
        }  

    }catch(err){
      console.log(err.message);
    }
}


// ------------------------ EXPORTS ------------------------ //


module.exports ={
    loginLoad,
    loadSignup,
    insertUser,
    verifyMail,
    userVerify,
    verifyLogin,
    editUser,
    updateUser,
    loadHome,
    loadShop,
    productDetail,
    userProfile,
    searchProduct,
    userLogout,
    loadWallet,
    addWallet,
    ascendingFilter,
    descendingFilter,
    loadMore,
    loadAddress,
    loadEditAddress,
    editAddress,
    deleteAddress,
    loadOrderDetails,
    generatePdf,
    loadDownload,
    sentResetPassword,
    forgetLoad,
    forgetVerify,
    forgetPasswordLoad,
    resetPassword,
    loadWishlist,
    addWishlist
}


// const addressData = await User.findOne(
//   { _id: userid },
//   { address: { $elemMatch: { _id: addressid } } }
// );