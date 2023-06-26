
// ------------------------ IMPORTS ------------------------ //

const Cart=require('../models/cartModels')
const Products=require('../models/productModels')
const User = require("../models/usermodals");
const Order=require('../models/orderModels')
const Wallet=require('../models/walletModels')
const Coupon=require('../models/couponModels')

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
    const orderData = await Order.findOne({ customer_id: id });
    const custData = await User.findOne({_id:id})
    const cartData = await Cart.findOne({user_id:id})
    const custName = custData.name
    console.log(orderData);
      res.render('orderhistory',{ order:orderData, name:custName, session:id, cart:cartData, title:'Order History'})
    }catch(err){
      console.log(err.message);
    }
  }

// ------------------------ PRODUCT STATUS ------------------------ //

  const productStatus = async (req, res) => {
    try {
      const id = req.query.id;
      const productId = req.body.productID;
      const adminId = req.session.admin_id;
      const productStatus = req.body.product_status;

      const orderdata = await Order.findOne({ customer_id: id,'product_details._id': productId });
      const productPrice= orderdata.product_details[0].product_price
      const paymentMode= orderdata.product_details[0].payment_method
  
      console.log(paymentMode);
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

  const cancelProduct=async(req,res)=>{
    try {
          const orderid = req.query.orderid
          console.log(orderid);
          await Order.findByIdAndUpdate({ _id:orderid }, { $set: { product_status: 'Canceled' } })
          res.redirect('/orderhistory')
    } catch (error) {
      console.log(error.message);
    }
  }

  const returnProduct = async (req, res) => {
    try {
      const orderid = req.query.orderid;
      const daysThreshold = 14;
  
      const order = await Order.findOne({
        customer_id: req.session.user_id,
        'product_details._id': orderid
      });
  
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
  
      const currentDate = new Date();
      const orderDateStr = order.product_details.find(item => item._id.toString() === orderid).order_date;
      const orderDate = new Date(orderDateStr);
      const userid=req.session.user_id
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

      await Wallet.updateOne(
        { user_id: userid },
        {
          $inc: {
            wallet_amount: order.product_details[0].product_price
          }
        }
      );

      const orderData= await Order.findOne({ customer_id: userid,'product_details._id': orderid})
      console.log(orderData);
      
      let wallet_history = {
        transaction_amount: '+' + orderData.product_details[0].product_price
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
      customer.used_coupon.push(code)
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
                order_id: orderid,
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
  
              let order = await Order.findOneAndUpdate(
                { customer_id: req.session.user_id, customer_name:customer.name },
                { $push: { product_details: orderItem } },
                { new: true, upsert: true }
              );
  
              console.log(order);
            }
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
            transaction_amount: '-$' + amount
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
              order_id: orderid,
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

            let order = await Order.findOneAndUpdate(
              { customer_id: req.session.user_id },
              { $push: { product_details: orderItem } },
              { new: true, upsert: true }
            );

            console.log(order);
          }
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
              order_id: orderid,
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
          
  
            let order = await Order.findOneAndUpdate(
              { customer_id: req.session.user_id },
              {
                $push: {
                  product_details: orderItem
                }
              },
              { new: true, upsert: true }
            );
          }   
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
  

  const paymentSuccess=async(req,res)=>{
    try{
      const orderid = req.query.orderid;
      const userid = req.session.user_id;
      console.log(orderid);

      const orderProducts = await Order.find({ customer_id: userid });
      console.log(orderProducts);
      const order = orderProducts.find(order => order.product_details.some(detail => detail.order_id === orderid));
      
      if (order) {
        const products = order.product_details.filter(detail => detail.order_id === orderid);
        const cartData = await Cart.findOne({ user_id: userid });
        var title='Success'
        console.log(order);
          res.render('success', { order:products,session:orderid, cart:cartData, title })
      
      } else {
        console.log("Order not found");
      }   

    }catch(err){
      console.log(err.message);
    }
  }
  
// ------------------------ EXPORTS ------------------------ //

  module.exports = {
    orderHistory,
    productStatus,
    cancelProduct,
    returnProduct,
    createOrder,
    onlinePaySuccess,
    paymentSuccess
  }