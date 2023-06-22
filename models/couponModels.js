const mongoose = require('mongoose')


const CouponSchema = new mongoose.Schema({
    coupon_code:{
        type:String,
        required:true
    },
    coupon_type:{
        type:String,
        required:true
    },
    coupon_value:{
        type:Number,
        required:true
    },
    min_purchase:{
        type:Number,
        required:true
    },
    max_discount:{
        type:Number,
        required:true
    },
    coupon_status:{
        type:Boolean,
        default:false
    },
    Expiry:{
        type:Date,
    },
    // couponaccess:{
    //     type:Boolean,
    //     default:false
    // }
})





module.exports= mongoose.model('Coupon',CouponSchema)