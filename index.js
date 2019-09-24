const ig = require('./instagram');
const express = require('express');
const app = module.exports = express();
const bodyParser = require('body-parser');
let cors = require('cors'); // CORS pentru eroarea din JS -> JS fetch() inainte de a face request cu functia dorita , face un OPTIONS request in care nu se aplica custom HEADERS
const controllerUtil = require('./controllers/util.js');

// let schedule = require('node-schedule');
// var ip = require('ip');


app.listen(5000, console.log('Listening on 5000...'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static('public'));
app.use(cors());


app.locals.instagramConstructors = [];
app.post('/search/location', async(req,res)=>{
    await controllerUtil.searchUsersByLocation(req,res);
});

app.get('/check/:username', async(req,res)=>{
    console.log(req.params);
    await controllerUtil.checkForInstagramUser(req,res);
})



// schedule.scheduleJob('0 17 ? * 0,4-6', likePhotosFromDb());




























app.post('/login', async (req, res)=>{


    try{
    
        const instagram = new Instagram(req.body.sessionKey);
        
        await instagram.initialize();
        let loginStatus = await instagram.login(req.body.username, req.body.password);
        // console.log(instagram);
        app.locals.instagramConstructors.push(instagram);
        instagram.closeWindow();
        instagram.closeWindow();        
        res.sendStatus(loginStatus);
    } catch(error){
        console.log(error);
        res.send('Login failed');
    }
    
    
    
    });


    app.get('/login/status/:sessionKey', async (req,res)=>{
        console.log('Checking if logged in...');

            let sessionKey = req.params.sessionKey;
        // console.log(req.params.sessionKey);

            try{

            controllerUtil.getTheSessionObject(sessionKey,async (err, result)=>{

                // console.log(result);
                let status = await result.windowStatus();
                console.log(status);
                res.sendStatus(status);
            });
        } catch (error){
            res.sendStatus(201);
        }
            // let status = await Instagram.initialize();
            // console.log(status);
            // res.sendStatus(status);
            
        
        
        });    



app.post('/session/generate', (req, res)=>{


controllerUtil.encryptData(req.body.baseKey, (err, result)=>{

    if(err) res.sendStatus(500);

    global.sessionKey = result;    
    console.log('Key generated succesfully');
    res.send(result);

   });

});















    

// app.post('/like/hash', async(req, res)=>{
//     console.log('request was received');
//     hashtagInput = req.body.data.split(',');
    
//     let sessionKey = req.body.sessionKey;
//         controllerUtil.getTheSessionObject(sessionKey,async (err, result)=>{


//        result.likeTagsProcess(hashtagInput);
//        res.sendStatus(200);
//        res.end();


//         });
   


// });




































