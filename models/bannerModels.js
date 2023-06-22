const mongoose = require("mongoose");

const banner=mongoose.Schema({

banner_img:{
    type:String,
    required:true
},
first_effect:{
    type:String,
    required:true
},
main_effect:{

    type:String,
    required:true
},
button_effect:{

    type:String,
    required:true
},
first_text:{

    type:String,
    required:true
},
main_text:{

    type:String,
    required:true
},
button_text:{

    type:String,
    required:true
}

});

module.exports=mongoose.model("Banner",banner);
