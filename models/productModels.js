const mongoose = require("mongoose");

const reviewSchema=mongoose.Schema({
    user_name:{
        type:String,
        required:true
    },
    review:{
        type:String,
        required: true
    },
    star:{
        type:Number
    }
})

const products=mongoose.Schema({

product_name:{
    type:String,
    required:true
},
product_price:{
    type:Number,
    required:true
},
product_discription:{

    type:String,
    required:true
},
product_img:{

    type:Array,
    required:true
},
product_size:{

    type:Array
},
product_category:{

    type:String,
    required:true
},
product_brand:{

    type:String,
    required:true
},
id_disable:{
    type:Boolean,
    required:true
},
product_stock:{
    type:Number,
    required:true
},
product_offer:{
    type:Number
},
product_review:[reviewSchema]

});

module.exports=mongoose.model("Product",products);
