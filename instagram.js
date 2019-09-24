const pupperteer = require('puppeteer');
const createPuppeteerPool = require('puppeteer-pool')
const save = require('instagram-save');
const mysql = require('mysql');






const con = mysql.createConnection({
    host : "localhost",
    user : 'root',
    password : 'Depaco123#' ,
    database : 'insta-front'
});

////////////////// REMEMBER //////////////////////////////

// HASHTAG TESTING FOR EACH LINK 
// get most popular words and query each link to see the value then select the ones with the high number of photos 
//   https://www.instagram.com/explore/tags/bucuresti/
/////////////////   END //////////////////////////////////


const BASE_URL = 'https://instagram.com/';
const TAG_URL  = (tag)=> `https://www.instagram.com/explore/tags/${tag}/`;
const USER_URL = (user) => `https://www.instagram.com/${user}`;

const instagram  = {

    browser:null,
    page:null,
    sessionKey : null,


    initialize : async() =>{
        instagram.browser = await pupperteer.launch({
        headless: false,
        args : ['--no-sandbox'],
        context: 'multiple-test-context-' + Math.floor(Math.random() * 1000)
        });

        const context = await instagram.browser.createIncognitoBrowserContext();


        instagram.page = await context.newPage();

      console.log(`Context : ${Math.floor(Math.random() * 1000)}`)
    },

    windowStatus : async() => { 
        
        //logged in means we should find the searchbar 
        try{
        await instagram.page.$('input[value=""]');
        
        return 200;
        } catch(error){
            // console.log(error);
            return 201;
        }
        

    }, 


    login : async (username, password) => { 

        console.log(`${username} is trying to log in `);
        await instagram.page.goto(BASE_URL, { waitUntil : 'networkidle2'});
        await instagram.page.waitFor(2000);
        let loginButton = await instagram.page.$x('//a[contains(text(), "Log in")]');

        /* Click on the login url button */

        await loginButton[0].click();
        
        // await instagram.page.waitForNavigation({ waitUntil : 'networkidle2'});

        await instagram.page.waitFor(1000);

        // writing username and password

        await instagram.page.type('input[name="username"]', username , { delay : 50 });
        await instagram.page.type('input[name="password"]', password , { delay : 50 });


        /* Clicking on the log in button */
        
        secondLoginButton = await instagram.page.$x('//div[contains(text(), "Log In")]');
        await instagram.page.waitFor(1000);
        await secondLoginButton[0].click();

        await instagram.page.waitFor(4000);
        

    
       let checkLoginStatus = await instagram.page.$x('//div[contains(text(), "Log In")]')
       
       if(checkLoginStatus && checkLoginStatus.length > 0){
        await instagram.browser.close();
        return 201;
       
        } else {
            
        await instagram.page.waitFor('a > span[aria-label="Profile"]');
       
        return 200;
            
       }
    },

    clickOnSearchAndType : async (typedLocations = [], sessionKey, user)=>{

        

        // waiting after login for page to load and click on the not now from wanting to download the app  
        await instagram.page.waitFor(2000);
      
      // clicking on the not now button for notification
        const notNowNotificationButton = 'button';
        await instagram.page.$$eval(notNowNotificationButton, anchors => {
            anchors.map(anchor => {
                if(anchor.textContent == 'Not Now') {
                    anchor.click();
                    
                }
            })
        });
     
        for(let location of typedLocations){


       // clicking on the searchBar 
       const searchBar = await instagram.page.$('input[value=""]');
       await searchBar.click();
       // and typing whatever we need from function parameter
       await instagram.page.keyboard.type(location);

       await instagram.page.waitFor(2000);

       // finding the location from results and clicking on it 
       await instagram.page.evaluate(()=>{
           let elements = document.getElementsByClassName('nebtz coreSpriteLocation');
           elements[0].click();
       });

       // clicking on the most recent posts
       await instagram.page.waitFor(3000);

            let posts = await instagram.page.$$('article > div:nth-child(4) img ');
            for(let i = 0 ; i<=10; i++){
            let post = posts[i];
            await instagram.page.waitFor(2000);
            post.click();
            
            /* Wait for the modal to appear */
            await instagram.page.waitFor('span[id="react-root"][aria-hidden="true"]');
            await instagram.page.waitFor(3000);

            /* Get user url*/
            let userURL =  await instagram.page.evaluate(() => { return  document.querySelector('article:nth-child(1) > header > div > a').href; });
            
            
            /*Save user URL to db */
            
            let insertQuery = `INSERT INTO instaUsers (user_url,location, user_email, session_key, action) VALUES ('${userURL}', '${location}', '${user}', '${sessionKey}', '1')`;
            await con.query(insertQuery, (err, result, fields)=>{ if(err) throw err; });
            await instagram.page.waitFor(1000);
            
              /* close modal and repeat */ 
            let closeModalButton = await instagram.page.$x('//button[contains(text(), "Close")]');
                await closeModalButton[0].click();   
                await instagram.page.waitFor(1000);  



            }


    
        }

            instagram.browser.close();
    },

    likePhotosFromUser : async () => {

    let userUrls = async (callback) => {  
        await con.query('SELECT user_url from instaUsers', (err, result, fields)=>{
            callback(null,result);
        });
    }

    userUrls(async (err, result)=>{
          for(let url of result){
        await instagram.page.goto(url.user_url, {waitUntil : 'networkidle2'});
      /*Run 3 photos from the user */
      let userPhotos = await instagram.page.$$('article > div:nth-child(1) img[decoding="auto"]');
      for(let i=0; i<5; i++){
          let photo = userPhotos[i];
          await instagram.page.waitFor(1000);
          photo.click();
          await instagram.page.waitFor(1000);
          let isLikeable = await instagram.page.$('span[aria-label="Like"]');

          if(isLikeable){

              // like the photo 
             await instagram.page.click('span[aria-label="Like"]');
              // download the photo to savedImages directory
             // save(instagram.page.url(), 'savedImages');

          }

           
          await instagram.page.waitFor(3000);
          /* Close the modal */

          let closeModalButton = await instagram.page.$x('//button[contains(text(), "Close")]');
          await closeModalButton[0].click();   
          await instagram.page.waitFor(1000);   
    
         }
        }

    });
     
      
  
    }, 

    
    likeTagsProcess : async (tags = []) => {

        for(let tag of tags){
            /* Go to the tag page */
            await instagram.page.goto(TAG_URL(tag), {waitUntil : 'networkidle2'});
            await instagram.page.waitFor(1000);

            let posts = await instagram.page.$$('article > div:nth-child(3) img[decoding="auto"]');
            
            for(let i = 0 ; i<posts.length; i++){

                 let post = posts[i];
                 await instagram.page.waitFor(2000);
                 /* Click on post */
                 await post.click();


                 /* Wait for the modal to appear */
                 await instagram.page.waitFor('span[id="react-root"][aria-hidden="true"]');
                 await instagram.page.waitFor(1000);
                
                 let isLikeable = await instagram.page.$('span[aria-label="Like"]');

                 if(isLikeable){

                     // like the photo 
                    await instagram.page.click('span[aria-label="Like"]');
                     // download the photo to savedImages directory
                    // save(instagram.page.url(), 'savedImages');

                    

                 
                 }

                 await instagram.page.waitFor(3000);
                /* Close the modal */

                let closeModalButton = await instagram.page.$x('//button[contains(text(), "Close")]');
                await closeModalButton[0].click();   
                await instagram.page.waitFor(1000);  

            }

            await instagram.page.waitFor(3000);  

        }    

    }, 

    showLikedPhotos : async ()=>{



    }
         
}


module.exports = instagram;