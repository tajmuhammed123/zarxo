const mongoose = require("mongoose");

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
}

});

module.exports=mongoose.model("Product",products);
