const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");





const wishlistSchema = mongoose.Schema({


    customer_id: {

        type:String,
        required:true
    },
    product_id: {
        type:Array,
        required:true
    },

    // is_delivered:{
    //     type:Boolean,
    //     default: false
    // }
})

module.exports=mongoose.model("Wishlist",wishlistSchema);