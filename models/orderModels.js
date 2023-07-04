const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");

const addressSchema= new mongoose.Schema({
    firstName:{
        
        type:String,
        required:true
    },
    secondName:{
        
        type:String,
        required:true
    },
    email:{
        
        type:String,
        required:true
    },
    mobNumber:{
        
        type:Number,
        required:true
    },
    houseNumber:{
        
        type:String,
        required:true
    },
    city:{
        
        type:String,
        required:true
    },
    state:{
        
        type:String,
        required:true
    },
    pincode:{
        
        type:Number,
        required:true
    },
})


const productSchema= mongoose.Schema({

    addressId:{
        type:ObjectId,
        required:true
    },
    product_id: {

        type:String,
        required:true
    },
    product_name: {

        type:String,
        required:true
    },
    product_price: {

        type:Number,
        required:true
    },
    product_img: {

        type:String,
        required:true
    },
    product_size: {

        type:String,
        required:true
    },
    product_quantity: {

        type:Number,
        required:true
    },
    product_brand: {

        type:String,
        required:true
    },
    product_status:{
        type:String,
        default:'Ordered'
    },
    order_date: {
        type:Date,
        default:Date.now
    },
    payment_method:{
        type:String,
        required:true
    },
    deliver_date:{
        type:Date
    },
    address: [addressSchema]
})



const orderSchema = mongoose.Schema({


    customer_id: {

        type:String,
        required:true
    },
    customer_name: {

        type:String,
        required:true
    },
    order_id:{
        type:String
    },
    product_details: [productSchema],

    // is_delivered:{
    //     type:Boolean,
    //     default: false
    // }
})

module.exports=mongoose.model("Order",orderSchema);