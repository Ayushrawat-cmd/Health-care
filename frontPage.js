const express = require("express");
const http = require("https");
const fs = require("fs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport") ;
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.set('view engine', 'ejs');
    
app.use(express.urlencoded({extended:true}));
app.use(express.static(__dirname+"/Public"));
app.use(session({
    secret: 'our strong secret',
    resave: false,
    saveUninitialized: false,
  }));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb+srv://admin-ayush:ayush123@cluster0.itvnq.mongodb.net/vaccine?retryWrites=true&w=majority', {useNewUrlParser: true, useUnifiedTopology: true});   

app.get("/", function (req,res) {
    res.sendFile(__dirname+"/Public/frontpage.html")
  });

/********************************************Api calling*****************************************************/

app.get("/aboutCovid", function(request,respond){
    const options = {
        "method": "GET",
        "hostname": "corona-virus-world-and-india-data.p.rapidapi.com",
        "port": null,
        "path": "/api",
        "headers": {
            "x-rapidapi-host": "corona-virus-world-and-india-data.p.rapidapi.com",
            "x-rapidapi-key": "fcacaf7d8cmsh26fa7fa32e7dd46p10d352jsn3902cd9fce31",
            "useQueryString": true
        }
    };
    
    const req = http.request(options, function (res) {
        const chunks = [];
    
        res.on("data", function (chunk) {
            // data = JSON.parse(chunk);
            // console.log(data);
            chunks.push(chunk);
        });
    
        res.on("end", function () {
            const body = Buffer.concat(chunks);
            const info = JSON.parse(body);
            var cases = info.countries_stat[1].cases;
            var new_cases = info.countries_stat[1].new_cases;
            var total_recovered = info.countries_stat[1].total_recovered;
            var deaths = info.countries_stat[1].new_deaths;
            respond.render("covid",{total_cases:cases, new_cases: new_cases, recovered: total_recovered, deaths: deaths });
        });
    });
    req.end();
});

/***************************************video player***********************************************/

app.get("/video", function(req,res){
    const range = req.headers.range;
    if(!range){
        res.status(400).send("Requires range header")
    }
    const videoPath = __dirname+"/vaccine.mp4";
    const videoSize = fs.statSync(__dirname+"/vaccine.mp4").size;
    const chunk_size = 10 ** 6;
    const start = Number(range.replace(/\D/g, ""));
    const end = Math.min(start + chunk_size , videoSize - 1);
    const contentLength = end - start + 1;
    const header = {
        "content-Range": `bytes ${start}-${end}/${videoSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": contentLength,
        "Content-Type": "video/mp4"
    };
    res.writeHead(206, header);
    const videoStream = fs.createReadStream(videoPath,{start, end});
    videoStream.pipe(res);
}); 

app.get("/corona", function(req,res){
    const range = req.headers.range;
    if(!range){
        res.status(400).send("Requires range header")
    }
    const videoPath = __dirname+"/Coronavirus.mp4";
    const videoSize = fs.statSync(__dirname+"/Coronavirus.mp4").size;
    const chunk_size = 10 ** 6;
    const start = Number(range.replace(/\D/g, ""));
    const end = Math.min(start + chunk_size , videoSize - 1);
    const contentLength = end - start + 1;
    const header = {
        "content-Range": `bytes ${start}-${end}/${videoSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": contentLength,
        "Content-Type": "video/mp4"
    };
    res.writeHead(206, header);
    const videoStream = fs.createReadStream(videoPath,{start, end});
    videoStream.pipe(res);
}); 



/*********************************************  Authentication************************************/

const userSchema = new mongoose.Schema( {
    email: String,
    password: String,
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
passport.serializeUser((user, done)=> {done(null, user); });

passport.deserializeUser((user, done)=>{done(null, user); });

app.get("/logout", function(req,res){
    req.logout();
    res.redirect("/");
})

app.post("/register",function (req,res) { ;
    User.register({username:req.body.username}, req.body.password, function(err, user) {
        if (err) { 
            console.log(err);
            res.redirect("/#Signup")
        }else{
            
            passport.authenticate("local")(req,res,function(){
                res.redirect("/login"); 
            });
        }
      });
});

app.get("/login",function(req,res) {
    res.render("login");
});

// app.post("/login", function(req,res){
//     const mail = req.body.username;
//     User.findOne({username: mail}, function(err,found){
//         if(err){
//             console.log(err);
//         }
//         else{
            
//             if(found){
//                 const user =  User({
//                     email: req.body.username,
//                     password: req.body.password
//                 });
//                 req.login(user,function(err){
//                     if(err){
//                         console.log(err);
                        
//                     }
//                     else{
//                         passport.authenticate("local")(req,res,function(){
//                             res.redirect("/tracker/"+found._id); 
//                         });

//                     }
//                 });
//             }
//             else{
//                 res.redirect("/#signup");
//             }
//         }
//     });
    
// });
app.post("/login", function(req,res){
    const mail = req.body.username;
    User.findOne({username: mail}, function(err,found){
        if(err){
            console.log(err);
        }
        else{
            
            if(found){
                const user =  User({
                    email: req.body.username,
                    password: req.body.password
                });
                passport.authenticate("local", function(err,user,info){
                    if(err){
                        console.log(err);
                    }
                    if(!user){
                        res.send({success:false, message:'Incorrect password'});
                    }
                    else{
                        req.login(user,function(err){
                            if(err){
                                console.log(err);
                                
                            }
                            else{
                                res.redirect("/tracker/"+found._id); 
                            }
                        });
                    }
                })(req,res);
                
            }
            else{
                res.redirect("/#signup");
            }
        }
    });
    
});

/***********************************Item list***************************************************/

const itemsSchema = new mongoose.Schema({
    name : String,
})

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name:"Welcome! to your to-do-list"
    
});
const item2 = new Item({
    name :"Hit the + button to add the items"
    
});
const item3 = new Item({
    name:"Tick the check box to delete the item"
    
});
const defaultItems = [item1,item2,item3];

const listSchema = new mongoose.Schema({
    user_id: String,
    name:String,
    items: [itemsSchema]
});

const List = new mongoose.model("List", listSchema);   
    
app.get("/tracker/:customName", function(req,res){

    const customSchema = req.params.customName;
    
    List.findOne({user_id: customSchema},function(err,result){
        if(err){
            console.log(err);
        }
        else{
            if(!result ){
                const newList = new List({
                    user_id: customSchema,
                    name: "Add your vaccination date",
                    items: defaultItems
                });
                newList.save();
                res.redirect("/tracker/"+customSchema);
            }
            else{
                if(req.isAuthenticated()){
                    res.render("list", {listTitle: result.name, newListItems: result.items, schema: result.user_id}); 
                }
                else{
                    res.redirect("/login");
                }
                
            }
        }
    });
    });

    app.post("/tracker/:customName", function(req, res){
        const itemName = req.body.Items;
        const customSchema = req.params.customName;
        const newItem = new Item({
            name:itemName
        });
        
            List.findOne({user_id:customSchema},function(err,found){
                if(err){
                    console.log(err);
                }
                else{
                    found.items.push(newItem);
                    found.save();
                    res.redirect("/tracker/"+customSchema);        
                }
                
            });
            
            
        
         
    });

app.post("/tracker/:customName/delete",function(req,res){
    const deleteItem = (req.body.Done);
    const customSchema = req.params.customName;
        List.findOneAndUpdate({user_id:customSchema},{$pull: {items: {_id: deleteItem}}},function(err,found){
            if(err){
                console.log(err);
            }
            else{
                console.log("Successfully deleted");
                res.redirect("/tracker/"+customSchema);
            }
        });
    
});

/*********************************listening port***************************************************/

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function(err){
    if(err){
        console.log(err);
    }
    else{
        console.log("Running on port 3000");
    }
})
