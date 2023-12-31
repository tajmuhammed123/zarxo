
// ------------------------ IMPORTS ------------------------ //

const Cart=require('../models/cartModels')
const Products=require('../models/productModels')
const User = require("../models/usermodals");
const Order=require('../models/orderModels')
const Wallet=require('../models/walletModels')
const Coupon=require('../models/couponModels')
const fs = require('fs');
const path = require('path');
const pdf=require('puppeteer')
const ejs = require('ejs');
const puppeteer = require('puppeteer');

// ------------------------ RAZORPAY ------------------------ //

const Razorpay = require('razorpay'); 
const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY } = process.env;

const razorpayInstance = new Razorpay({
    key_id: RAZORPAY_ID_KEY,
    key_secret: RAZORPAY_SECRET_KEY
});

// ------------------------ ODRER HISTORY ------------------------ //

const orderHistory=async(req,res)=>{
    try{

    const id = req.session.user_id;
    const orderData = await Order.find({ customer_id: id });
    const custData = await User.findOne({_id:id})
    const cartData = await Cart.findOne({user_id:id})
    const custName = custData.name
    console.log(orderData);
      res.render('orderhistory',{ order:orderData, name:custName, session:id, cart:cartData, title:'Order History'})
    }catch(err){
      console.log(err.message);
    }
  }
const orderProductsFilter=async(req,res)=>{
    try{
    const product_id=req.query.prid
    const id = req.session.user_id;
    const orderData = await Order.findOne({ _id: product_id });
    const custData = await User.findOne({_id:id})
    const cartData = await Cart.findOne({user_id:id})
    const custName = custData.name
    console.log(orderData);
      res.render('orderProducts',{ order:orderData, name:custName, session:id, cart:cartData, title:'Order History'})
    }catch(err){
      console.log(err.message);
    }
  }

// ------------------------ PRODUCT STATUS ------------------------ //

  const productStatus = async (req, res) => {
    try {
      const id = req.body.userid;
      const productId = req.body.productID;
      const adminId = req.session.admin_id;
      const productStatus = req.body.product_status;
      const date=new Date()
      console.log(date);
  
      await Order.updateOne(
        {
          customer_id: id,
          'product_details._id': productId
        },
        {
          $set: {
            'product_details.$.product_status': productStatus,

          }
        }
      );

      if(productStatus=='Delivered'){
        await Order.updateOne(
          {
            customer_id: id,
            'product_details._id': productId
          },
          {
            $set: {
              'product_details.$.product_status': productStatus,
              'product_details.$.deliver_date': date
  
            }
          },{ upsert: true }
        );
      }
  
      res.redirect(`/admin/orders?adminid=${adminId}`);
      console.log(productStatus);
    } catch (error) {
      console.log(error.message);
    }
  };

  // ------------------------ CANCEL ORDER ------------------------ //

  const cancelProduct=async(req,res)=>{
    try {
        const userid=req.session.user_id
          const orderid = req.query.orderid
          console.log(orderid);
          const order = await Order.findOne({ customer_id: userid,'product_details._id': orderid},{
            'product_details.$': 1
          })
          console.log(order);
          if(order.product_details[0].payment_method!='Cash On Delivery'){
            const wallet = await Wallet.findOne({ user_id: userid });

            const amount=(order.product_details[0].product_price) * (order.product_details[0].product_quantity)

            await Wallet.updateOne(
              { user_id: userid },
              {
                $inc: {
                  wallet_amount: amount
                }
              }
            );

            let wallet_history = {
              transaction_amount: '+ ₹ ' + amount
            };
            
            console.log(wallet_history);
            
            wallet.wallet_history.push(wallet_history);
            await wallet.save();

          }
          await Order.updateOne(
            {
              customer_id: userid,
              'product_details._id': orderid
            },
            {
              $set: {
                'product_details.$.product_status': 'Canceled',
    
              }
            },{ new: true })
          res.redirect('/orderhistory')
    } catch (error) {
      console.log(error.message);
    }
  }

  // ------------------------ RETURN ORDER ------------------------ //

  const returnProduct = async (req, res) => {
    try {
      const orderid = req.query.orderid;
      const daysThreshold = 14;
      const userid=req.session.user_id
  
      const order = await Order.findOne({ customer_id: userid,'product_details._id': orderid},{
        'product_details.$': 1
      })
  
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
  
      const currentDate = new Date();
      const orderDateStr = order.product_details.find(item => item._id.toString() === orderid).order_date;
      const orderDate = new Date(orderDateStr);
      const timeDifference = currentDate.getTime() - orderDate.getTime();
      const daysDifference = Math.ceil(timeDifference / (1000 * 3600 * 24));
  
      if (daysDifference > daysThreshold) {
        return res.status(400).json({ error: 'Order is older than the threshold' });
      }

      await Order.findOneAndUpdate(
        {
          customer_id: userid,
          'product_details._id': orderid
        },
        {
          $set: {
            'product_details.$.product_status': 'Return'
          }
        },
        { new: true }
      );
      const wallet = await Wallet.findOne({ user_id: userid });

      const amount=(order.product_details[0].product_price) * (order.product_details[0].product_quantity)
      await Wallet.updateOne(
        { user_id: userid },
        {
          $inc: {
            wallet_amount: amount
          }
        }
      );
      
      let wallet_history = {
        transaction_amount: '+ ₹ ' + amount
      };
      
      console.log(wallet_history);
      
      wallet.wallet_history.push(wallet_history);
      await wallet.save();
      
      console.log(wallet);
  
      res.redirect('/orderhistory');
    } catch (error) {
      console.log(error.message);
    }
  };  

// ------------------------ ORDER PROCESS ------------------------ //

  const createOrder = async (req, res) => {
    try {
      console.log("Total Amount", req.body.totalamnt);
      const userid = req.session.user_id;
      const cartData = await Cart.findOne({ user_id: userid });
      const customer = await User.findOne({ _id: userid });
      const amount = parseFloat(req.body.totalamnt);
      const amont = req.body.totalamnt*100;
      const addressid = req.body.address;
      const orderid = req.body.orderid;
      const addressData = await User.findOne(
        { _id: userid, 'address._id': addressid },
        { 'address.$': 1 }
      );
      
      const code = req.body.coupon;
      if(code){
        customer.used_coupon.push(code)
      }
      console.log(req.body.mode);
      console.log(req.body.address);
      console.log(orderid);
  
      if (req.body.mode === 'Online Payment') {
        const options = {
          amount: amont,
          currency: 'INR',
          receipt: 'razorUser@gmail.com'
        };
        console.log(options)
  
        razorpayInstance.orders.create(options, async (err, order) => {
          console.log('Razorpay API Response:', err, order);
          if (!err) {
            console.log('hjkgfgd');
            res.status(200).send({
              success: true,
              msg: 'Order Created',
              order_id: order.id,
              amount: amount,
              key_id: RAZORPAY_ID_KEY,
              product_name: req.body.name,
              odrerid: orderid,
              mode: req.body.mode,
              address: req.body.address,
              contact: '9895299091',
              name: 'Taj Muhammed',
              email: 'tajmuhammed4969@gmail.com'
            });
          } else {
            console.log(err);
            res.status(400).send({ success: false, msg: 'Something went wrong!' });
          }
        });
      } else if (req.body.mode === 'Wallet') {
        const wallet = await Wallet.findOne({ user_id: userid });
        console.log(wallet.wallet_amount);
        if (wallet.wallet_amount >= amount) {
          console.log('kjhg');
          if (cartData && Array.isArray(cartData.product)) {
            let prds = [];
          
            for (const cartItem of cartData.product) {
              const orderItem = {
                product_id: cartItem.product_id,
                product_name: cartItem.product_name,
                product_price: cartItem.product_price,
                product_img: cartItem.product_img,
                product_size: cartItem.product_size,
                product_quantity: cartItem.product_quantity,
                product_brand: cartItem.product_brand,
                payment_method: req.body.mode,
                addressId: addressid,
                address: {}
              };
          
              const selectedAddress = addressData.address.find(
                addr => addr._id.toString() === addressid
              );
          
              if (selectedAddress) {
                orderItem.address = {
                  firstName: selectedAddress.firstName,
                  secondName: selectedAddress.secondName,
                  email: selectedAddress.email,
                  mobNumber: selectedAddress.mobNumber,
                  houseNumber: selectedAddress.houseNumber,
                  city: selectedAddress.city,
                  state: selectedAddress.state,
                  pincode: selectedAddress.pincode
                };
              }
          
              prds.push(orderItem);
            }
          
            let order = await new Order({
              customer_id: req.session.user_id,
              customer_name: customer.name,
              order_id: orderid,
              product_details: prds
            });
          
            console.log(order);
            await order.save();
          } else {
            console.log('Cart data not found or is invalid');
          }
  
          for (const productItem of cartData.product) {
            console.log(productItem.product_id);
            await Products.findByIdAndUpdate(
              productItem.product_id,
              {
                $inc: {
                  product_stock: -productItem.product_quantity
                }
              },
              { new: true }
            );
          }
  
          await Wallet.updateOne(
            { user_id: userid },
            {
              $inc: {
                wallet_amount: -amount
              }
            }
          );
          let wallet_history = {
            transaction_amount: '- ₹ ' + amount
          };
          wallet.wallet_history.push(wallet_history);
          await wallet.save();
  
          console.log('hjkgh');
          await Cart.deleteOne({ user_id: userid });
          const add = customer.address.find(addr => addr._id == addressid);
          console.log(add);
          res.status(200).send({ success: true, cod: true });
        } else {
          console.log('Insufficient Balance');
          res.status(400).send({ success: false, msg: 'Insufficient Balance' });
        }
      } else {
        if (cartData && Array.isArray(cartData.product)) {
          let prds = [];
        
          for (const cartItem of cartData.product) {
            const orderItem = {
              product_id: cartItem.product_id,
              product_name: cartItem.product_name,
              product_price: cartItem.product_price,
              product_img: cartItem.product_img,
              product_size: cartItem.product_size,
              product_quantity: cartItem.product_quantity,
              product_brand: cartItem.product_brand,
              payment_method: req.body.mode,
              addressId: addressid,
              address: {}
            };
        
            const selectedAddress = addressData.address.find(
              addr => addr._id.toString() === addressid
            );
        
            if (selectedAddress) {
              orderItem.address = {
                firstName: selectedAddress.firstName,
                secondName: selectedAddress.secondName,
                email: selectedAddress.email,
                mobNumber: selectedAddress.mobNumber,
                houseNumber: selectedAddress.houseNumber,
                city: selectedAddress.city,
                state: selectedAddress.state,
                pincode: selectedAddress.pincode
              };
            }
        
            prds.push(orderItem);
          }
        
          let order = await new Order({
            customer_id: req.session.user_id,
            customer_name: customer.name,
            order_id: orderid,
            product_details: prds
          });
        
          console.log(order);
          await order.save();
        
        } else {
          console.log('Cart data not found or is invalid');
        }
  
        for (const productItem of cartData.product) {
          console.log(productItem.product_id);
          await Products.findByIdAndUpdate(
            productItem.product_id,
            {
              $inc: {
                product_stock: -productItem.product_quantity
              }
            },
            { new: true }
          );
        }
        await Cart.deleteOne({ user_id: userid });
        const add = customer.address.find(addr => addr._id == addressid);
        console.log(addressData);
        console.log(add);
        res.status(200).send({ success: true, cod: true });
      }
    } catch (error) {
      console.log(error.message);
      res.status(500).send({ success: false, msg: 'Internal Server Error' });
    }
  };  

  // ------------------------ CARD PAYMENT SAVE ------------------------ //

  const onlinePaySuccess=async(req,res)=>{
    try {
      const userid = req.session.user_id;
      const cartData = await Cart.findOne({ user_id: userid });
      const customer = await User.findOne({ _id: userid });
      const addressid = req.body.address;
      const orderid = req.body.orderid
      console.log('jkhgfd');
      console.log(req.body.mode);
      const addressData = await User.findOne(
        { _id: userid, 'address._id': addressid },
        { 'address.$': 1 }
      );

      if (cartData && Array.isArray(cartData.product)) {
        let prds = [];
      
        for (const cartItem of cartData.product) {
          const orderItem = {
            product_id: cartItem.product_id,
            product_name: cartItem.product_name,
            product_price: cartItem.product_price,
            product_img: cartItem.product_img,
            product_size: cartItem.product_size,
            product_quantity: cartItem.product_quantity,
            product_brand: cartItem.product_brand,
            payment_method: req.body.mode,
            addressId: addressid,
            address: {}
          };
      
          const selectedAddress = addressData.address.find(
            addr => addr._id.toString() === addressid
          );
      
          if (selectedAddress) {
            orderItem.address = {
              firstName: selectedAddress.firstName,
              secondName: selectedAddress.secondName,
              email: selectedAddress.email,
              mobNumber: selectedAddress.mobNumber,
              houseNumber: selectedAddress.houseNumber,
              city: selectedAddress.city,
              state: selectedAddress.state,
              pincode: selectedAddress.pincode
            };
          }
      
          prds.push(orderItem);
        }
      
        let order = await new Order({
          customer_id: req.session.user_id,
          customer_name: customer.name,
          order_id: orderid,
          product_details: prds
        });
      
        console.log(order);
        await order.save();   
        } else {
          console.log('Cart data not found or is invalid');
        }

        for (const productItem of cartData.product) {
          console.log(productItem.product_id);
          await Products.findByIdAndUpdate(
            productItem.product_id,
            {
              $inc: {
                product_stock: -productItem.product_quantity
              }
            },
            { new: true }
          );
        }          

        await Cart.deleteOne({ user_id: userid });
        res.status(200).send({ success: true});
        const add = customer.address.find((addr) => addr._id == addressid);
        console.log(add);
    } catch (error) {
      console.log(error.message);
    }
  }

  // ------------------------ ORDER SUCCESS PAGE ------------------------ //

  const paymentSuccess=async(req,res)=>{
    try{
      const orderid = req.query.orderid;
      const userid = req.session.user_id;
      console.log(orderid);
      
      const orderProducts = await Order.find({ customer_id: userid });
      console.log(orderProducts);
      const order = orderProducts.find(order => order.order_id === orderid);
      
      if (order) {
        const cartData = await Cart.findOne({ user_id: userid });
        var title = 'Success';
        console.log(order);
        res.render('success', { order: order, session: req.session.user_id, cart: cartData, title });
      } else {
        console.log("Order not found");
      }
      
    }catch(err){
      console.log(err.message);
    }
  }

// ------------------------ ORDER DETAILS ------------------------ //

const loadOrderDetails=async(req,res)=>{
  try{
    const id=req.session.user_id
    const productid=req.query.productid
    const user= await User.findById(id)
    console.log(user);
    const orderData = await Order.findOne(
      { customer_id: id, 'product_details._id': productid },
      { 'product_details.$': 1 }
    )
    console.log(id);
    const cartData = await Cart.findOne({ user_id: id })
    const title='Order'
    const order = orderData.product_details.find(
      product => product._id.toString() === productid
    );
    console.log(order);
      res.render('orderdetails',{ order:order, user:user, cart:cartData, title, session:id })
  }catch(err){
    console.log(err.message);
  }
}

const downloadInvoice=async(req,res)=>{
  try {
    const id=req.query.id
    const userid=req.session.user_id
    const orderData = await Order.findOne(
      { customer_id: userid, 'product_details._id': id },
      { 'product_details.$': 1 }
    )
    const order=orderData.product_details[0]
    console.log(order);
    const userData=await User.findOne({_id:userid})
    console.log('dfs');
    console.log(orderData);
    res.render('template',{ orderData:order, user:userData })
  } catch (error) {
    console.log(error.message);
  }
}
  
// ------------------------ EXPORTS ------------------------ //

  module.exports = {
    orderHistory,
    orderProductsFilter,
    productStatus,
    cancelProduct,
    returnProduct,
    createOrder,
    onlinePaySuccess,
    paymentSuccess,
    loadOrderDetails,
    downloadInvoice,
  }