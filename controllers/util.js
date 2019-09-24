const Cryptr = require('cryptr');
const axios = require('axios');
const app = require('../index');
const Instagram = require('../instagram-controllers/instagramConstructor');

// instagram functions 


let checkForInstagramUser = async (req, res)=>{

    let username = req.params.username;
    
    await getTheSessionObject(username, (err, result)=>{
       res.sendStatus(result);
    })

}




let searchUsersByLocation = async (req, res) => {

    locationInput = ["5togo",
    "Adhoc Bistro",
    "ArtichokeCoffee",
    "Beans&Dots",
    "Biutiful",
    "Burger Van Bistro",
    "Caju by Joseph Hadad",
    "Calif",
    "Experience",
    "CloudBistroPub",
    "CoffeolRomania",
    "Emte",
    "Energiea",
    "Entourage Centrul Vechi",
    "FIX",
    "Fratellini Bistro",
    "FRUDISIAC",
    "Gram Bistro",
    "KANE",
    "Linea Closer To The Moon",
    "Maison des Crêpes",
    "Manufaktura",
    "NOMAD Skybar",
    "PuraVidaRomania",
    "Radisson Blu Hotel",
    "Sardin",
    "Simbio",
    "Social 1",
    "Stadio Bucharest",
    "THE URBANIST",
    "Trick Shot",
    "Trofic",
    "Upstairs Rooftop",
    "Vivo Fusion Food Bar"];
    

    console.log('Request was received');
   
    username = req.body.username;
    password = req.body.password;

    
   
    try{
        // controllerUtil.getTheSessionObject(sessionKey, async (err, result)=>{
          result = new Instagram(username);
          app.locals.instagramConstructors.push(result);

         await result.initialize();
         let loginStatus = await result.login(username,password);   
            res.sendStatus(loginStatus);
        
          await result.clickOnSearchAndType(locationInput, '', 'tomasFirstNightTest');
        //  res.sendStatus(200);
        //  res.end();
        // });
    } catch (error){
        console.log(error);
    }

}


let likePhotosFromDb = async () => { 

   // username 
   // password 

   // have to be defined in parameters

    try{
        // controllerUtil.getTheSessionObject(sessionKey, async (err, result)=>{
          result = new Instagram();
         await result.initialize();
         await result.login(username,password);   
         await result.likePhotosFromUser();
        //  res.sendStatus(200);
        //  res.end();
        // });
    } catch (error){
        console.log(error);
    }




}















let encryptData = async (data, callback) => { 

const cryptr = new Cryptr('myTotalySecretKey');
 
const encryptedString = cryptr.encrypt(data);

callback(null, encryptedString);


}


let getTheSessionObject = async (user, callback) => {

    if(app.locals.instagramConstructors.length > 0){

app.locals.instagramConstructors.forEach(async (element)=>{
    // console.log(element);
    if(element.user === user){
        callback(null, 200);
    } else { 
        callback(null, 201);
    }


});
    } else {
        callback(null, 201);
    }

}

module.exports = {
    searchUsersByLocation,
    checkForInstagramUser,
    encryptData,
    getTheSessionObject
}