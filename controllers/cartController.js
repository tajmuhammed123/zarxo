const Cart=require('../models/cartModels')
const Products=require('../models/productModels')
const User = require("../models/usermodals");
const Order=require('../models/orderModels')
const Coupon=require('../models/couponModels')

const { v4: uuidv4 } = require('uuid');

  const addToCart = async (req, res) => {
    try {
      const id = req.query.id;
      const userid = req.query.userid;
      const session=req.session.user_id

      // Retrieve product and user data
      const productData = await Products.findById(id);
      const userData = await User.findById(userid);
      var product_price = productData.product_price;
      var rounded_product_price = Number(product_price.toFixed(2));
      var rounded_product_quantity = Number(req.body.product_quantity);
      var total_price = Number((rounded_product_quantity * rounded_product_price).toFixed(2));
      var cartexist = await Cart.findOne({ user_id: userid, product: { _id: id } });
      
      console.log(typeof total_price);
      
      if (cartexist) {
        res.redirect('/product-detail');
      }
      
      if (productData.product_offer) {
        const id = req.query.id;
        const productData = await Products.findById(id);
        product_price = (productData.product_offer * productData.product_price) / 100;
        rounded_product_price = Number(product_price.toFixed(2));
        total_price = Number((rounded_product_quantity * rounded_product_price).toFixed(2));
        console.log(typeof total_price);
      }
      
      const cartItem = {
        product_id: productData._id,
        product_name: productData.product_name,
        product_price: rounded_product_price,
        product_img: productData.product_img[0],
        product_size: req.body.product_size,
        product_quantity: rounded_product_quantity,
        product_brand: productData.product_brand,
        total_price: total_price
      };            

      // Find or create a cart for the user
      let cart = await Cart.findOneAndUpdate({ user_id: req.session.user_id },{$inc:{cart_amount: total_price}});

      if (!cart) {
        // Create a new cart if it doesn't exist
        cart = new Cart({ user_id: req.session.user_id, cart_amount: total_price});
      }

      // Add the cart item to the cart's product array
      cart.product.push(cartItem);

      // Save the cart
      const savedCart = await cart.save();

      if (savedCart) {
        const userid=req.session.user_id
        const cartData=await Cart.findOne({ user_id:userid })
        res.render("product-detail", { message: "Success", product: productData, userData: userData, session, cart:cartData });
      }
    } catch (error) {
      console.log(error.message);
      // Handle the error and send an appropriate response to the client
      res.status(500).send("Error adding product to cart.");
    }
  };
//   const loadCart =async(req,res)=>{
//     try{
//         const userid = req.query.id
//         console.log(userid);
//         const cartData = await Cart.findOne({ user_id: userid })
//         console.log(cartData);
//         res.render('shoping-cart',{products: cartData, userid:userid })

//     }catch(err){
//         console.log(err.message);
//     }
// }

  const loadCart = async (req, res) => {
    try {
      const userid = req.session.user_id;
      console.log(userid);
      var cartPrd = await Cart.findOne({ user_id: userid })
      const title='Cart'
  
      // Check if cart data exists
      if (cartPrd) {
        // Update current_stock only once
          console.log('vbvcxdfb');
          for (const cartItem of cartPrd.product) {
            const productData = await Products.findById(cartItem.product_id);
            if (productData) {
              cartItem.current_stock = productData.product_stock;
            }
          }
          // Increment count to indicate update has been performed
          // cartPrd.count++;
          await cartPrd.save();
  
        res.render('shoping-cart', { products: cartPrd, userid: userid, product:cartPrd.product, cart:cartPrd, title, session:userid });
      }else{
        cartPrd=null
        res.render('shoping-cart', { products: cartPrd, userid: userid, product:cartPrd, cart:cartPrd, title, session:userid });
      }
    } catch (error) {
      console.error(error);
      // Handle the error appropriately
    }
  }

const couponCode = async (req, res) => {
  try {
    const userid = req.session.user_id;
    console.log(userid);
    const code = req.body.code;
    req.session.coupon_status =false
    const cartData = await Cart.findOne({ user_id: userid }).populate("product.product_id");
    const userData = await User.findOne({ _id: userid })
    const orderData = await Order.find({ customer_id: userid });
    console.log(cartData);

    if (cartData) {
      let totalPrice = cartData.product.map((product) => product.total_price).reduce((acc, cur) => acc += cur);

      await Coupon.findOne({coupon_code: { $regex: new RegExp(code, 'i') } })
        .then((coupon) => {
          console.log('Coupon:', coupon);
          if (userData.used_coupon && userData.used_coupon.includes(coupon.coupon_code)) {
            console.log('Already used');
            res.json({ success: false })
          }else{
            console.log(coupon.min_purchase);
            if (coupon.coupon_type === "Flat" && coupon.min_purchase < totalPrice) {
              console.log('flat');
              const val =  coupon.coupon_value;
              if(val > coupon.max_discount){
                totalPrice -= coupon.max_discount;
              }else{
                totalPrice -= val;
              }
              // req.session.coupon_status = true;
              console.log(totalPrice);
              userData.used_coupon.push(coupon.coupon_code)
              userData.save({ upsert: true })
            } else if (coupon.coupon_type === "Percentage" && coupon.min_purchase < totalPrice) {
              console.log('percentage');
              const val = (totalPrice * coupon.coupon_value) / 100;
            console.log(val);

            if (val > coupon.max_discount) {
              totalPrice -= coupon.max_discount;
            } else {
              totalPrice -= val;
            }
            console.log(totalPrice);
            userData.used_coupon.push(coupon.coupon_code)
            userData.save({ upsert: true })
            }
            res.json({ success: coupon, amount:totalPrice });
          }
          
        });

    } else {
      res.redirect('/cart');
    }
  } catch (err) {
    console.log(err.message);
  }
};


const deleteCartProduct = async (req, res) => {
  try {
    const id = req.query.id;
    const userid = req.query.userid;
    console.log('fdsf');
    console.log(userid);

    const prdData = await Cart.findOne({ user_id: userid, 'product._id': id } )
    console.log(prdData.product[0].product_price);
    await Cart.findOneAndUpdate({ user_id: userid }, { $inc:{cart_amount: -prdData.product[0].product_price } })

    // if (!mongoose.isValidObjectId(id)) {
    //   console.log('err');
    //   return res.status(400).send({ success: false, error: 'Invalid product ID' });
    // }

    await Cart.updateOne(
      { user_id: userid },
      { $pull: { product: { _id: id } } }
    );

    res.status(200).send({ success: true });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ success: false, error: error.message });
  }
};


const updateCart = async (req, res) => {
  try {
    console.log(req.body.product);
    const userData = req.body.user;
    const proId = req.body.product;
    let count = parseInt(req.body.count);

    const cartData = await Cart.findOne({ user_id: userData });
    const product = cartData.product.find((product) => product.product_id === proId);

    const productData = await Products.findOne({ _id: proId });
    console.log(productData);
    const productQuantity = productData.product_stock;

    if (count > 0) {
      // Quantity is being increased
      if (product.product_quantity + count > productQuantity) {
        res.json({ success: false, message: 'Quantity limit reached!' });
        return;
      }
    } else if (count < 0) {
      // Quantity is being decreased
      if (product.product_quantity <= 1 || Math.abs(count) > product.product_quantity) {
        await Cart.updateOne({ user_id: userData }, { $pull: { product: { product_id: proId } } });
        res.json({ success: true });
        return;
      }
    }

    await Cart.updateOne(
      { user_id: userData, 'product.product_id': proId },
      { $inc: { 'product.$.product_quantity': count } }
    );

    const updatedCartData = await Cart.findOne({ user_id: userData });
    const updatedProduct = updatedCartData.product.find((product) => product.product_id === proId);
    const updatedQuantity = updatedProduct.product_quantity;
    var price = updatedQuantity * productData.product_price;
    
    if(productData.product_offer){
      const proId = req.body.product;
      const productData = await Products.findOne({ _id: proId });
      product_price= (productData.product_offer * productData.product_price)/100
      price=updatedQuantity * product_price
    }
    await Cart.findOneAndUpdate({ user_id: userData }, { $inc:{cart_amount: product_price } })

    await Cart.updateOne(
      { user_id: userData, 'product.product_id': proId },
      { $set: { 'product.$.total_price': price } }
    );

    res.json({ success: true });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};





  const placeOrder=async(req,res)=>{
    try{
      const userid = req.session.user_id;
      const cartData = await Cart.findOne({ user_id: userid });
      const customer = await User.findOne({ _id: userid });
      const addressid = req.body.address;

      // Check if cartData exists and is an array
      if (cartData && Array.isArray(cartData.product)) {
        // Iterate over each cart item in the productData array
        for (const cartItem of cartData.product) {
          const order = new Order({
            addressId: addressid,
            customer_id: userid, // Use the userid obtained from the request query
            customer_name: customer.name,
            product_id: cartItem.product_id,
            product_name: cartItem.product_name,
            product_price: cartItem.product_price,
            product_img: cartItem.product_img,
            product_size: cartItem.product_size,
            product_quantity: cartItem.product_quantity,
            product_brand: cartItem.product_brand,
          });

          const orderData = await order.save();
          console.log(orderData);
        }
      } else {
        console.log('Cart data not found or is invalid');
      }

      for (const productData of cartData) {
        console.log('jhkgh');
        const product = await Products.findByIdAndUpdate(
          { _id: productData.product_id },
          {
            $inc: {
              product_stock: -productData.product_quantity
            }
          },
          { new: true }
        )
        const orderData = await product.save();
        console.log(orderData);
      }

      await Cart.delete( { user_id: userid } )
      const add= customer.address.find((addr) => addr._id == addressid)
      console.log(add);
      res.render("success",{order:add});
      
    }catch(err){
      console.log(err.message);
    }
  }

  const loadPayment=async(req,res)=>{
    try{
      message=null
      const userid=req.session.user_id
      const cartData=await Cart.findOne({user_id:userid})
      const cart_amount= cartData.cart_amount
      if(cart_amount==null || cart_amount==0){
        let cart_amount = 0
        const cart= await Cart.findOne({user_id:userid})
        cart.product.forEach((product) => {
        cart_amount += product.total_price;
      });
      }

      await Cart.findOneAndUpdate({user_id:userid},{ $set:{cart_amount:cart_amount} })
      console.log('jk');
      const userData = await User.findOne({ _id: userid });
      const title='Payment'
      console.log(cart_amount);
      const randomId = uuidv4();
      console.log();
      res.render('payment',{ userid:userData, message, totalamount:cart_amount, cart:cartData, order_id:randomId, title, session:userid })
    }catch(err){
      console.log(err.message);
    }
  }

  const loadAddAddress=async(req,res)=>{
    try{
      const userid=req.query.userid
      console.log(userid);
      const cartData = await Cart.findOne({ user_id: userid })
      const title='Add Address'
      res.render('addaddress',{userid:userid, cart:cartData, title, session:userid})
    }catch(err){
      console.log(err.message);
    }
  }


  const addAddress = async (req, res) => {
    try {
      const userId = req.query.userid;
  
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      const newAddress = {
        firstName: req.body.firstName,
        secondName: req.body.secondName,
        email: req.body.email,
        mobNumber: req.body.mobNumber,
        houseNumber: req.body.houseNumber,
        city: req.body.city,
        state: req.body.state,
        pincode: req.body.pincode
      };
  
      user.address.push(newAddress);
      await user.save();
  
      console.log(user);
  
      res.render('payment',{userid:user});
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  };

  const updateCoupon=async(req,res)=>{
    try{
      console.log(req.session.totalPrice);
      const prid=req.body.prid
      const orderid=req.body.orderid
      const totalPrice = req.body.totalamnt
      // const userData = await User.findOne({ _id: prid });
      res.redirect(`/payment?prid=${prid}&&orderid=${orderid}&&totalamount=${totalPrice}`)
    }catch(err){
      console.log(err.message);
    }
  }
  
  

module.exports = {
    addToCart,
    loadCart,
    deleteCartProduct,
    updateCart,
    placeOrder,
    loadAddAddress,
    loadPayment,
    addAddress,
    couponCode,
    updateCoupon
}