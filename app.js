const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname+"/date.js");
const ejs = require("ejs");
const mongoose = require("mongoose");
const __ = require("lodash");

mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser : true});

const app = express();

app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine', 'ejs');
app.use(express.static("public"));

const itemsSchema = {
    task : String
}

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    task : "Welcome to ToDo List App"
});

const item2 = new Item({
    task : "Hit + button to add an item"
});

const item3 = new Item({
    task : "Click checkbox to delete an item"
});

const defaultArray = [item1, item2, item3];

const listSchema = {
    name : String,
    items : [itemsSchema]
}

const List = mongoose.model("List", listSchema);

app.listen(3002, () => {
    console.log("Listening at port 3002");
})

app.get("/", (req, res) => {
    var day = date.getDate();
    Item.find({}, function(err, foundItems) {
        if(foundItems.length === 0) {
            Item.insertMany(defaultArray, function(err) {
                if(err) {
                    console.log(err);
                } else {
                    console.log("Successful Insertion");
                }
            });
            res.redirect("/");
        } else {
            res.render("list", {
                kindOfDay : "Today",
                newTask : foundItems
            });
        }
    });
});

app.post("/", (req, res) => {
    var newTask = req.body.task;
    var listName = req.body.list;
    const newitem = new Item({
        task : newTask
    });
    if(listName === 'Today') {
        newitem.save();
        res.redirect("/");
    } else {
        List.findOne({name : listName},function(err, foundList) {
            foundList.items.push(newitem);
            foundList.save();
            res.redirect("/"+listName);
        });
    }
});

app.get("/:customList", (req, res) => {
    var st = req.params.customList;
    List.findOne({name : req.params.customList}, function(err, foundList) {
        if(!err) {
            if(!foundList) {
                const list = new List({
                    name : __.capitalize(st),
                    items : defaultArray   
                });
                list.save();
                res.redirect("/"+__.capitalize(st));
            }
            else {
                res.render("list", {
                    kindOfDay : __.capitalize(st),
                    newTask : foundList.items
                })
            }
        }
    });
});

app.get("/about", (req, res) => {
    res.render("about", {});
});

app.post("/delete", (req, res) => {
    const listName = req.body.listName;
    console.log(req.body.checkbox);
    if(listName === 'Today') {
        Item.deleteOne({_id : req.body.checkbox}, function(err) {
            if(err) {
                console.log(err);
            } else {
                console.log("Delete successful");
            }
        });
        res.redirect("/");
    } else {
        console.log("inside else");
        console.log(listName);
        console.log(req.body.checkbox);
        List.findOneAndUpdate({name : listName}, { $pull : {items : {_id : req.body.checkbox}}}, function(err, foundList) {
            if(!err) {
                console.log(foundList);
                res.redirect("/"+listName);
            }
        });
    }
});