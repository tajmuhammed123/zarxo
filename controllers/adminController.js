
// ------------------------ IMPORTS ------------------------ //

const User = require("../models/usermodals");
const Products = require("../models/productModels");
const Category=require('../models/categoreyModels')
const Order=require('../models/orderModels')
const Coupon=require('../models/couponModels')
const Dashboard=require('../models/dashboardModels')
const Banner=require('../models/bannerModels')
const Offer=require('../models/offerModels')
const bcrypt = require("bcrypt");
const mime = require('mime-types');
const fs = require('fs');
const path = require('path');
const pdf=require('puppeteer')
const ejs = require('ejs');
const puppeteer = require('puppeteer');

// ------------------------ SECURE PASSWORD ------------------------ //

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

// ------------------------ LOGIN ------------------------ //

const loadLogin = async (req, res) => {
  try {
    message = null;
    res.render("login", { message });
  } catch (err) {
    console.log(err.message);
  }
};

const verifyLogin = async (req, res) => {
  try {
    const username = req.body.username;
    const password = req.body.password;
    const userData = await User.findOne({ username: username });

    if (userData) {
      console.log(userData);
      const passwordMatch = await bcrypt.compare(password, userData.password);

      if (passwordMatch) {
        if (userData.is_admin === 0) {
          res.render("login", {
            message: "Email and password is incorrect, not an admin",
          });
        } else {
          console.log(userData);
          req.session.admin_id = userData._id;
          res.redirect("/admin/dashboard");
        }
      } else {
        res.render("login", { message: "Email or password is incorrect" });
      }
    } else {
      res.render("login", {
        message: "Please provide your Email and password",
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};
const logout=async(req,res)=>{
  try{
      console.log(req.session);
      req.session.destroy()
      res.redirect('/admin')

  }catch(err){
      console.log(err.message);
  }
}

// ------------------------ DASHBOARD ------------------------ //

const loadDashboard = async (req, res) => {
  try {
    var id = req.session.admin_id;
    const users= await User.find({is_admin:0})
    console.log(users.length);
    const dashboard=await Dashboard.find({})
    const products=await Products.find({id_disable:false})
    const orders= await Order.find({})
    
    if(dashboard.length==0){
      console.log('null');
      const dataDashboard = new Dashboard({
        total_users : users.length,

      })
      await dataDashboard.save()
    }
    await Dashboard.updateOne({
      total_users: users.length,
      total_products:products.length
    })
    //const userData = await User.findById({ _id: req.session.admin_id });

    const dashboardData=await Dashboard.find({})
    const adminData = await User.findById({ _id: req.session.admin_id });
    res.render("dashboard", { admin: adminData, users:users, dashboardData:dashboardData, orders:orders });
  } catch (err) {
    console.log(err.message);
  }
};

// ------------------------ LOAD USER ------------------------ //

const loadUser = async (req, res) => {
  try {
    const id=req.session.admin_id
    const userData = await User.find({ is_admin: 0 });
    const adminData = await User.findOne({ _id:id });
    console.log(adminData);
    res.render("user-details", { user: userData, admin: adminData });
  } catch (err) {
    console.log(err.message);
  }
};

// ------------------------ PRODUCT CONTROLLERS ------------------------ //

const loadProducts = async (req, res) => {
  try {
    const adminid=req.session.admin_id
    const productsData = await Products.find({ });
    const adminData = await User.findOne({ _id:adminid });
    res.render("product-details", { products: productsData, admin: adminData });
  } catch (err) {
    console.log(err.message);
  }
};

const loadAddProduct = async (req, res) => {
  try {
    const id = req.session.admin_id;
    const adminData = await User.findOne({ _id:id })
    const categoryData = await Category.find({ id_disable:false })
    message = null;
    res.render("addproduct", { admin: adminData, message, category:categoryData });
  } catch (err) {
    console.log(err.message);
  }
};

const addProduct = async (req, res) => {
  try {

    const fileBuffer = req.file.buffer;
    const mimeType = mime.lookup(req.file.originalname);

    if (!mimeType || !mimeType.startsWith('image/')) {
      return res.render("addproduct", {
        message: "Invalid file format. Please upload an image.",
        admin: adminData,
      });
    }

    const productFiles = req.files.map((file) => file.filename);
    const products = new Products({
      product_name: req.body.product_name,
      product_price: req.body.product_price,
      product_discription: req.body.product_discription,
      product_img: productFiles,
      product_category: req.body.product_category,
      product_brand: req.body.product_brand,
      product_size: req.body.product_size,
      id_disable:false,
      product_stock: req.body.product_stock
    });
    const adminid =req.session.admin_id
    const adminData = await User.findOne({ _id:adminid });
    const productsData = await products.save();
    if (productsData) {
      await Dashboard.updateOne( {}, { $inc: {total_products:1} });
      res.redirect('/product-details')
      console.log("success");
    } else {
      return res.render("addproduct", {
        message: "Enter valid details",
        admin: adminData,
      });
      console.log("failed");
    }
  } catch (err) {
    console.log(err.message);
  }
};

const editProduct = async (req, res) => {
  try {
    const adminid =req.session.admin_id
    message=null
    const id = req.query.id;
    const productData = await Products.findById({ _id: id });
    const categoryData = await Category.find({ id_disable:false })
    const offerData = await Offer.find({ })

    if (productData) {
      console.log(productData);
      const adminData = await User.findOne({ _id:adminid });
      res.render("editproducts", { product: productData, admin: adminData, category: categoryData, message, offer:offerData });
    } else {
      res.redirect(`/admin/product-details?adminid=${adminid}&&id=${id}`);
    }
  } catch (error) {
    console.log(error.message);
  }
};

const updateProduct = async (req, res) => {
  try {
    console.log(req.body.product_stock);
    const productData = await Products.findByIdAndUpdate(
      { _id: req.query.id },
      {
        $set: {
          product_name: req.body.product_name,
          product_price: req.body.product_price,
          product_discription: req.body.product_discription,
          product_category: req.body.product_category,
          product_brand: req.body.product_brand,
          product_size: req.body.product_size,
          id_disable: false,
          product_stock: req.body.product_stock,
          product_offer:req.body.product_offer
        },
      }
    );
    console.log(productData);
    await productData.save()
    res.redirect("/admin/product-details");
  } catch (error) {
    console.log(error.message);
  }
};


const editProductImage = async (req, res) => {
  try {
    const productId = req.body.productID;
    console.log(productId);
    const productFiles = req.files.map((file) => file.filename);
    const adminId = req.session.admin_id;

    if (!mimeType || !mimeType.startsWith('image/')) {
      return res.render("addproduct", {
        message: "Invalid file format. Please upload an image.",
        admin: adminData,
      });
    }

    console.log(productFiles);

    await Products.findByIdAndUpdate(
      { _id: productId },
      { $set: { product_img: productFiles } }
    );

    res.redirect(`/admin/editproducts?id=${productId}`);
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Error updating product images');
  }
};


const deleteProduct = async (req, res) => {
  try {
    const id = req.query.id;
    await Products.deleteOne({ _id: id });
    res.redirect("/admin/product-details");
  } catch (error) {
    console.log(error.message);
  }
};

// const loadAddUser = async (req, res) => {
//   try {
//     const id = req.session.admin_id
//     message = null;
//     const adminData = await User.findOne({ _id:id })
//     res.render("adduser", { admin: adminData, message });
//   } catch (err) {
//     console.log(err.message);
//   }
// };

// const addUser = async (req, res) => {
//   try {
//     const id = req.session.admin_id
//     const adminData = await User.findOne({ _id:id })
//     const spassword = await securePassword(req.body.password);

//     const existingUser = await User.findOne({ email: req.body.email });
//     if (existingUser) {
//       return res.render("adduser", {
//         message: "Email already registered",
//         admin: adminData,
//       });
//     }

//     if (!req.body.name || req.body.name.trim().length === 0) {
//       return res.render("adduser", {
//         message: "Please enter a valid name",
//         admin: adminData,
//       });
//     }

//     const user = new User({
//       name: req.body.name,
//       email: req.body.email,
//       mobile: req.body.mob,
//       username: req.body.username,
//       password: spassword,
//       is_admin: 0,
//     });

//     const userData = await user.save();

//     if (userData) {
//       console.log("success");
//       res.render("adduser", {
//         message: "Registration Success",
//         admin: adminData,
//       });
//     } else {
//       res.render("adduser", {
//         message: "Registration Failed",
//         admin: adminData,
//       });
//     }
//   } catch (err) {
//     console.log(err.message);
//   }
// };

// const editUser = async (req, res) => {
//   try {
//     const adminid = req.session.admin_id
//     const id = req.query.id;
//     const userData = await User.findById({ _id: id });

//     if (userData) {
//       console.log(userData);
//       const adminData = await User.findOne({ _id:adminid });
//       res.render("editusers", { user: userData, admin: adminData });
//     } else {
//       res.redirect("/admin/user-details");
//     }
//   } catch (error) {
//     console.log(error.message);
//   }
// };

// const updateUser = async (req, res) => {
//   try {
//     const userData = await User.findByIdAndUpdate(
//       { _id: req.query.id },
//       {
//         $set: {
//           name: req.body.name,
//           email: req.body.email,
//           mobile: req.body.mob,
//           username: req.body.username,
//         },
//       }
//     );
//     console.log(userData);
//     res.redirect("/admin/user-details");
//   } catch (error) {
//     console.log(error.message);
//   }
// };
// const deleteUser = async (req, res) => {
//   try {
//     const id = req.query.id;
//     await User.deleteOne({ _id: id });
//     res.redirect("/admin/user-details");
//   } catch (error) {
//     console.log(error.message);
//   }
// };

const enableProduct = async (req, res) => {
  try {
    const id = req.query.id;
    const adminid = req.session.admin_id;
    await Products.findByIdAndUpdate({ _id: id }, { $set: { id_disable: false } });

    res.redirect(`/admin/product-details?adminid=${adminid}&&id=${id}`);
  } catch (err) {
    console.log(err.message);
  }
}


const disableProduct = async(req,res)=>{
  try{
    const id = req.query.id
    const adminid = req.session.admin_id
        await Products.findByIdAndUpdate({ _id: id }, { $set: { id_disable: true } })

    res.redirect(`/admin/product-details?adminid=${adminid}&&id=${id}`);
  }catch(err){
    console.log(err.message);
  }
}

// ------------------------ ORDER CONTROLLERS ------------------------ //

const loadOrders=async(req,res)=>{
  try{
    const adminid = req.session.admin_id
    const adminData = await User.findOne({ _id:adminid });
    const orders= await Order.find({})
    res.render('order-list',{orders:orders, admin: adminData})

  }catch(err){
    console.log(err.message);
  }
}

const loadOrderAddress=async(req,res)=>{
  try {
    const addid= req.query.addid
    const userid=req.query.id
    const adminid = req.session.admin_id
    const adminData = await User.findOne({ _id:adminid });
    const customer = await User.findOne({ _id: userid });
    const add= customer.address.find((addr) => addr._id == addid)
    res.render('order-address',{address:add, admin: adminData })
  } catch (err) {
    console.log(err.message);
  }
}

const loadOrderProducts=async(req,res)=>{
  try {
    const userid=req.query.id
    const adminid = req.session.admin_id
    const adminData = await User.findOne({ _id:adminid });
    const orderData = await Order.findOne({ customer_id: userid });
    console.log(orderData);
    res.render('order-products',{ admin: adminData, order:orderData })
  } catch (err) {
    console.log(err.message);
  }
}

// ------------------------ CATEGOREY CONTROLLERS ------------------------ //

const loadAddCategorey=async(req,res)=>{
  try{
    const adminid = req.session.admin_id
    const adminData = await User.findOne({ _id:adminid });
      res.render('add-category',{ admin: adminData })
  }catch(err){
    console.log(err.message);
  }
}
const addCategorey=async(req,res)=>{
  try{
    const adminid = req.session.admin_id
    console.log(req.body.productcategory);
    const productCategory = req.body.productcategory;

    const existingCategory = await Category.findOne({
      product_category: { $regex: new RegExp(productCategory, 'i') }
    });
    if (existingCategory) {
      return res.render("add-category", {
        message: "Categorey already exist", admin:adminid
      });
    }
    const category = new Category({
      product_category: req.body.productcategory
    });
    await category.save();
    res.redirect(`/admin/product-details?adminid=${adminid}`);
  }catch(err){
    console.log(err.message);
  }
}

// const editProdutStatus=async(req,res)=>{
//   try {
//     const productid=req.query.productid
//     const product_status= req.body.product_status
//     console.log(product_status);
//     await Order.findByIdAndUpdate({ _id: productid }, { $set: { product_status: product_status } }) 
//   } catch (error) {
//     console.log(error.message);
//   }
// }

const loadCategorey=async(req,res)=>{
  try {
      const adminid=req.session.admin_id
      const category= await Category.find({ });
      res.render('categorey-list',{ category:category, admin:adminid})
  } catch (error) {
    console.log(error.message);
  }
}

const enableCategory=async(req,res)=>{
  try {
    const adminid = req.session.admin_id;
    const categoryid = req.query.categoryid;
    await Category.findByIdAndUpdate({ _id: categoryid }, { $set: { id_disable: false } });

    res.redirect('/admin/category');
  } catch (error) {
    console.log(error.message);
  }
}

const disableCategory=async(req,res)=>{
  try {
    const adminid = req.session.admin_id;
    const categoryid = req.query.categoryid;
    await Category.findByIdAndUpdate({ _id: categoryid }, { $set: { id_disable: true } });

    res.redirect('/admin/category');
  } catch (error) {
    console.log(error.message);
  }
}


const loadeditCategorey=async(req,res)=>{
  try{
    const adminid = req.session.admin_id
    const admin= await User.findById({_id: adminid})
    const categoryid=req.query.categoryid
    const categoryname= await Category.findById({_id: categoryid})
    console.log(categoryname);
    res.render('edit-category',{category:categoryname, admin:admin })
    
  }catch(err){
    console.log(err.message)
  }
}
const editCategorey=async(req,res)=>{
  try{
    const category = req.body.category
    const categoryid=req.body.categoryid
    console.log(categoryid);
    const categoryData=await Category.findByIdAndUpdate({_id:categoryid},{ $set :{
      product_category: req.body.category
    }})
    await categoryData.save()
    res.status(200).json({ success: true });
    
  }catch(err){
    console.log(err.message)
    res.status(400).json({ success: false });
  }
}


// ------------------------ USER CONTROLLERS ------------------------ //

const disableUser=async(req,res)=>{
  try {
    const adminid = req.session.admin_id;
    const userid = req.query.userid;
    await User.findByIdAndUpdate({ _id: userid }, { $set: { id_disable: true } });
    const n=await User.findOne({ _id: userid })
    console.log(n);
    res.redirect('/admin/user-details');
    
    
  } catch (error) {
    console.log(error.message);
  }
}


const enableUser=async(req,res)=>{
  try {
    const adminid = req.session.admin_id;
    const userid = req.query.userid;
    await User.findByIdAndUpdate({ _id: userid }, { $set: { id_disable: false } });

    res.redirect('/admin/user-details');
  } catch (error) {
    console.log(error.message);
  }
}

// ------------------------ COUPON CONTROLLERS ------------------------ //

const loadAddCoupon=async(req,res)=>{
  try {
    message=null
    const adminid=req.session.admin_id
    res.render('addcoupon',{admin:adminid, message})
  } catch (error) {
    console.log(error.message);
  }
}

const addCoupon=async(req,res)=>{
  try {
      console.log(req.body.coupon_code);
      const adminid=req.session.admin_id
      const existingCoupon = await Coupon.findOne({ coupon_code: req.body.coupon_code });
      if (existingCoupon) {
        return res.render("addcoupon", {
          message: "Coupon already exist", admin:adminid
        });
      }

    const coupon = new Coupon({
      coupon_code: req.body.coupon_code,
      coupon_type: req.body.coupon_type,
      coupon_value: req.body.coupon_value,
      min_purchase: req.body.min_purchase,
      max_discount: req.body.max_discount,
    });
    await coupon.save();
    res.redirect('/admin/couponlist')
  } catch (error) {
    console.log(error.message);
  }
}

const listCoupon=async(req,res)=>{
  try {
    const adminid=req.session.admin_id
    const couponData= await Coupon.find({ });
    res.render('coupon-list',{ coupon:couponData, admin:adminid})
  } catch (error) {
    console.log(error.message);
  }
}


const loadeditCoupon=async(req,res)=>{
  try{
      const adminid = req.session.admin_id
      const couponid =req.query.couponid
      const couponData=await Coupon.findById({_id:couponid})
      res.render('couponedit',{admin:adminid, couponid:couponData})
  }catch(err){
    log(err.message)
  }
}

const editCoupon = async (req, res) => {
  try {
    const couponid = req.body.couponid;
    const couponData = await Coupon.findByIdAndUpdate(
      { _id: couponid },
      {
        $set: {
          coupon_code: req.body.coupon_code,
          coupon_type: req.body.coupon_type,
          coupon_value: req.body.coupon_value,
          min_purchase: req.body.min_purchase,
          max_discount: req.body.max_discount
        }
      }
    );
    await couponData.save();
    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ------------------------ SALES REPORT ------------------------ //

const saleReport = async (req, res) => {
  try {
    const adminid=req.session.admin_id
    const admin=await User.findById({_id:adminid})
    const orders= await Order.find({})
    const months0106 = [];
    const months0612 = [];
    
    for (let i = 0; i < orders.length; i++) {
      for (let j = 0; j < orders[i].product_details.length; j++) {
        const dateArray = orders[i].product_details[j].order_date.split('-');
        const month = parseInt(dateArray[1]);
    
        if (month >= 1 && month <= 6) {
          months0106.push(orders[i].product_details[j]);
        } else if (month >= 6 && month <= 12) {
          months0612.push(orders[i].product_details[j]);
        }
      }
    }
    
    console.log(months0106); // order dates from month 01 to 06
    console.log(months0612); // order dates from month 06 to 12
    
    const dashboard = await Dashboard.find({});
    const data = {
      dashboard: dashboard,
      admin:admin,
      // orders:orders
      uptojune:months0106,
      afterjune:months0612
    };

    const filepathName = path.resolve(__dirname, '../views/admin/salereport.ejs');
    const html = fs.readFileSync(filepathName).toString();
    const ejsData = ejs.render(html, data);

    console.log('Generating PDF...');

    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    await page.setContent(ejsData, { waitUntil: 'networkidle0' });

    const pdfBytes = await page.pdf({ format: 'Letter' });
    await browser.close();

    const randomFilename = generateRandomFilename(); // Generate a random filename here
    const filePath = path.resolve(__dirname, `../docs/${randomFilename}.pdf`);

    fs.writeFileSync(filePath, pdfBytes);

    console.log('PDF file generated successfully.');
    console.log(randomFilename);
    res.redirect('/admin/dashboard');
  } catch (err) {
    console.log('Error:', err.message);
  }
};

// Function to generate a random filename
const generateRandomFilename = () => {
  const randomString = Math.random().toString(36).substring(7); // Generate a random string
  const timestamp = Date.now(); // Get the current timestamp
  return `file_${timestamp}_${randomString}`;
};
const loadAddBanner=async(req,res)=>{
  try{
    const admin=req.session.admin_id
    const adminData = await User.findOne({ _id:admin });
      res.render('addbanner',{admin:adminData})
  }catch(err){
    console.log(err.message);
  }
}

// ------------------------ BANNER CONTROLLERS ------------------------ //

const addBanner = async (req, res) => {
  try {
    const adminid = req.session.admin_id;
    const adminData = await User.findOne({ _id: adminid });

    if (!req.file) {
      return res.render("addbanner", {
        message: "No file was uploaded",
        admin: adminData,
      });
    }

    // Check if the file is an image
    const fileBuffer = req.file.buffer;
    const mimeType = mime.lookup(req.file.originalname);

    if (!mimeType || !mimeType.startsWith('image/')) {
      return res.render("addbanner", {
        message: "Invalid file format. Please upload an image.",
        admin: adminData,
      });
    }


    const bannerFile = req.file.filename;
    const banner = new Banner({
      button_effect: req.body.button_effect,
      first_effect: req.body.first_effect,
      main_effect: req.body.main_effect,
      banner_img: bannerFile,
      first_text: req.body.first_text,
      main_text: req.body.main_text,
      button_text: req.body.button_text,
    });

    const bannerData = await banner.save();
    if (bannerData) {
      res.render("addbanner", {
        message: "Product added successfully",
        admin: adminData,
      });
      console.log("success");
    } else {
      return res.render("addbanner", {
        message: "Enter valid details",
        admin: adminData,
      });
      console.log("failed");
    }
  } catch (err) {
    console.log(err.message);
  }
};



const bannerList=async(req,res)=>{
  try{
    const admin=req.session.admin_id
    const adminData = await User.findOne({ _id:admin });
    const banner= await Banner.find({})
      res.render('bannerlist',{admin:adminData, banner:banner})
  }catch(err){
    console.log(err.message);
  }
}
const loadEditBanner=async(req,res)=>{
  try{
    const bannerid=req.query.bannerid
    const admin=req.session.admin_id
    const adminData = await User.findOne({ _id:admin });
    const banner=await Banner.findById({_id:bannerid})
      res.render('banner-edit',{admin:adminData, banner:banner})
  }catch(err){
    console.log(err.message);
  }
}


const editBanner = async (req, res) => {
  try {
    console.log('kjjhg');
    const bannerFile = req.file.filename;
    console.log(req.query.bannerid);
    const bannertData = await Banner.findByIdAndUpdate(
      { _id: req.query.bannerid },
      {
        $set: {
          button_effect: req.body.button_effect,
          first_effect: req.body.first_effect,
          main_effect: req.body.main_effect,
          banner_img: bannerFile,
          first_text: req.body.first_text,
          main_text: req.body.main_text,
          button_text: req.body.button_text,
        },
      }
    );
    console.log(bannertData);
    await bannertData.save()
    res.redirect("/admin/bannerlist");
  } catch (error) {
    console.log(error.message);
  }
};

// ------------------------ OFFER CONTROLLERS ------------------------ //

const loadaddOffer=async(req,res)=>{
  const adminid=req.session.admin_id
  res.render('add-offer',{admin:adminid})
}

const addOffer=async(req,res)=>{
  try{
    const adminid=req.session.admin_id
    const offer= new Offer({
      offer_code:req.body.offer_code,
      offer_amount:req.body.offer_amount
    })
    console.log(offer);
    await offer.save()
    res.render('add-offer',{admin:adminid, message:'Offer added successfully'})
  }catch(err){
    console.log(err.message);
  }
}

// ------------------------ EXPORTS ------------------------ //

module.exports = {
  loadLogin,
  verifyLogin,
  logout,
  loadDashboard,
  loadProducts,
  loadUser,
  loadAddProduct,
  addProduct,
  editProduct,
  updateProduct,
  editProductImage,
  deleteProduct,
  enableProduct,
  disableProduct,
  loadOrders,
  loadOrderAddress,
  loadOrderProducts,
  loadAddCategorey,
  addCategorey,
  loadCategorey,
  enableCategory,
  disableCategory,
  disableUser,
  enableUser,
  addCoupon,
  loadAddCoupon,
  listCoupon,
  loadeditCoupon,
  editCoupon,
  loadeditCategorey,
  editCategorey,
  saleReport,
  loadAddBanner,
  addBanner,
  bannerList,
  loadEditBanner,
  editBanner,
  loadaddOffer,
  addOffer
};
