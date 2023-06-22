const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
    
    product_id:{
        type:String,
        required:true
    },
    product_name:{
        type:String,
        required:true
    },
    product_price:{
        type:Number,
        required:true
    },
    product_img:{
    
        type:String,
        required:true
    },
    product_size:{
    
        type:String
    },
    product_quantity:{
        type:Number,
        required:true
    },
    product_brand:{
    
        type:String,
        required:true
    },
    current_stock:{
        type:String
    },
    total_price:{
        type:Number
    }
})

const cartSchema = mongoose.Schema({
    product:[productSchema],
    user_id:{
        type:String,
        required:true
    },
    cart_amount:{
        type:Number,
    },

})


module.exports = mongoose.model('Cart',cartSchema)