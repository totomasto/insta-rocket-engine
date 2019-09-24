const pupperteer = require('puppeteer');
const proxyChain = require('proxy-chain');
const mysql = require('mysql');
const dbconfig = require('./../db/index');
let con = mysql.createConnection(dbconfig.connection);









function Instagram(user) {

    this.user = user;
    // this.sessionKey = sessionKey;

    this.browser = null;
    this.page = null;

    this.BASE_URL = "https://instagram.com/";
    this.TAG_URL  = (tag)=> `https://www.instagram.com/explore/tags/${tag}/`;
    this.USER_URL = (user) => `https://www.instagram.com/${user}`;
    this.password = 'wfHfKBNZxCFdeEzehAb7Jndqm';
    this.username = 'auto';


    this.initialize = async function () {

        // const oldProxyUrl = `http://${this.username}:${this.password}@proxy.apify.com:8000`;
        // const newProxyUrl = await proxyChain.anonymizeProxy(oldProxyUrl);

        // const newProxyUrl = "http://89.43.78.19:3128";
        //, `--proxy-server=${newProxyUrl}` move this to args after no sand-box
        this.browser = await pupperteer.launch({
            headless: false,
            args : ['--no-sandbox'],
            context: 'multiple-test-context-' + Math.floor(Math.random() * 1000)
            });

        this.page = await this.browser.newPage();    

            // console.log(newProxyUrl);
    }

    this.windowStatus = async function () {

          //logged in means we should find the searchbar 
          try{
            await this.page.$('input[value=""]');
            
            return 200;
            } catch(error){
                // console.log(error);
                return 201;
            }

    }


    this.closeWindow = async function () {
        this.page.close();
    }



    this.login = async function (username, password) {

        console.log(`${username} is trying to log in `);
        await this.page.goto(this.BASE_URL, { waitUntil : 'networkidle2'});
        await this.page.waitFor(7000);
        let loginButton = await this.page.$x('//a[contains(text(), "Log in")]');

        /* Click on the login url button */

        await loginButton[0].click();
        
        // await this.page.waitForNavigation({ waitUntil : 'networkidle2'});

        await this.page.waitFor(1000);

        // writing username and password

        await this.page.type('input[name="username"]', username , { delay : 50 });
        await this.page.type('input[name="password"]', password , { delay : 50 });


        /* Clicking on the log in button */
        
        secondLoginButton = await this.page.$x('//div[contains(text(), "Log In")]');
        await this.page.waitFor(1000);
        await secondLoginButton[0].click();

        await this.page.waitFor(4000);
        

    
       let checkLoginStatus = await this.page.$x('//div[contains(text(), "Log In")]')
       

        // check if page changed and return 201 because user is not authe
       if(checkLoginStatus && checkLoginStatus.length > 0){
        // closing the page because the session is no longer needed 
        await this.browser.close();
        return 201;
       
        } else {
       // return 200 and continue with the session      
        await this.page.waitFor('a > span[aria-label="Profile"]');
        // await this.browser.close();
        return 200;
        
            
       }


    }

    this.clickOnSearchAndType = async function (typedLocations = [], sessionKey, user) {

        

        // waiting after login for page to load and click on the not now from wanting to download the app  
        await this.page.waitFor(2000);
      
      // clicking on the not now button for notification
        const notNowNotificationButton = 'button';
        await this.page.$$eval(notNowNotificationButton, anchors => {
            anchors.map(anchor => {
                if(anchor.textContent == 'Not Now') {
                    anchor.click();
                    
                }
            })
        });
     
        for(let location of typedLocations){


       // clicking on the searchBar 
       const searchBar = await this.page.$('input[value=""]');
       this.page.waitFor(1500);
       
       if(searchBar === null){
           continue;
       } else {
       await searchBar.click();
       }
       
       // and typing whatever we need from function parameter
       await this.page.keyboard.type(location);

       await this.page.waitFor(2000);

       // finding the location from results and clicking on it 
       
       let findLocation = await this.page.evaluate(()=>{
           let elements = document.getElementsByClassName('nebtz coreSpriteLocation');
          if(elements[0] != null){
              
              elements[0].click();
            } else { 
              
                return false;
          }
       });

       if(findLocation === false){  continue; }
    
       // clicking on the most recent posts
       await this.page.waitFor(3000);

            let posts = await this.page.$$('article > div:nth-child(4) img ');
            for(let i = 0 ; i<=10; i++){
            let post = posts[i];
            await this.page.waitFor(2000);
            post.click();
            
            /* Wait for the modal to appear */
            await this.page.waitFor('span[id="react-root"][aria-hidden="true"]');
            await this.page.waitFor(3000);

            /* Get user url*/
            let userURL =  await this.page.evaluate(() => { 
                return  (document.querySelector('article:nth-child(1) > header > div > a')) ? document.querySelector('article:nth-child(1) > header > div > a').href : document.querySelector('article:nth-child(1) > header > div:nth-child(2) > div > div > h2 > a').href; 
            
                
            
            });
            
            
            /*Save user URL to db */
            
            let insertQuery = `INSERT INTO instaUsers (user_url,location, user_email, session_key, action) VALUES ('${userURL}', '${location}', '${user}', '${sessionKey}', '1')`;
            await con.query(insertQuery, (err, result, fields)=>{ if(err) throw err; });
            await this.page.waitFor(1000);
            
              /* close modal and repeat */ 
            let closeModalButton = await this.page.$x('//button[contains(text(), "Close")]');
                await closeModalButton[0].click();   
                await this.page.waitFor(1000);  



            }


    
        }

            this.browser.close();
    }





    this.likePhotosFromUser = async function ()  {

        let userUrls = async (callback) => {  
            await con.query('SELECT DISTINCT(user_url) from instaUsers WHERE id > 235', (err, result, fields)=>{
                callback(null,result);
            });
        }
    
        userUrls(async (err, result)=>{
              for(let url of result){
            await this.page.goto(url.user_url, {waitUntil : 'networkidle2'});
          /*Run 3 photos from the user */
          let userPhotos = await this.page.$$('article > div:nth-child(1) img[decoding="auto"]');
        //   console.log(userPhotos);
          if(userPhotos.length > 0){
          for(let i=0; i<3; i++){
              let photo = userPhotos[i];
              await this.page.waitFor(1000);
              photo.click();
              await this.page.waitFor(1000);
              let isLikeable = await this.page.$('span[aria-label="Like"]');
    
              if(isLikeable){
    
                  // like the photo 
                 await this.page.click('span[aria-label="Like"]');
                  // download the photo to savedImages directory
                 // save(this.page.url(), 'savedImages');
    
              }
    
               
              await this.page.waitFor(3000);
              /* Close the modal */
    
              let closeModalButton = await this.page.$x('//button[contains(text(), "Close")]');
              await closeModalButton[0].click();   
              await this.page.waitFor(1000);   
        
             }
            }
        }
        });
         
          
      
        }


        this.likeTagsProcess = async function (tags = []) {

            for(let tag of tags){
                /* Go to the tag page */
                await this.page.goto(this.TAG_URL(tag), {waitUntil : 'networkidle2'});
                await this.page.waitFor(1000);
    
                let posts = await this.page.$$('article > div:nth-child(3) img[decoding="auto"]');
                
                for(let i = 0 ; i<posts.length; i++){
    
                     let post = posts[i];
                     await this.page.waitFor(2000);
                     /* Click on post */
                     await post.click();
    
    
                     /* Wait for the modal to appear */
                     await this.page.waitFor('span[id="react-root"][aria-hidden="true"]');
                     await this.page.waitFor(1000);
                    
                     let isLikeable = await this.page.$('span[aria-label="Like"]');
    
                     if(isLikeable){
    
                         // like the photo 
                        await this.page.click('span[aria-label="Like"]');
                         // download the photo to savedImages directory
                        // save(this.page.url(), 'savedImages');
    
                        
    
                     
                     }
    
                     await this.page.waitFor(3000);
                    /* Close the modal */
    
                    let closeModalButton = await this.page.$x('//button[contains(text(), "Close")]');
                    await closeModalButton[0].click();   
                    await this.page.waitFor(1000);  
    
                }
    
                await this.page.waitFor(3000);  
    
            }    
    
        }





    
    
  }



  module.exports = Instagram;