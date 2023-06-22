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

const user=mongoose.Schema({

address:[addressSchema],

used_coupon:{
    type:Array
},

name:{
    type:String,
    required:true
},
username:{
    type:String,
    required:true
},
mobile:{

    type:String,
    required:true
},
email:{
    type:String,
    required:true
},
password:{

    type:String,
    required:true
},
is_admin: {
    type: Number,
    required: true,
},
id_disable:{
    type:Boolean,
    default:false
},
is_verified:{
    type:Boolean,
    default:false
},
token:{
    type:String,
    default:''
}
  

});

module.exports=mongoose.model("User",user);
