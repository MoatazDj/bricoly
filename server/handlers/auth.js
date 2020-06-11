const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const db = require('../database/db');

// importing users' table's model
var users = db.import('../database/models/users.js');
var professionals = db.import('../database/models/professionals.js');
var credentials = db.import ('../database/models/credentials.js');

/**
* @function signUp - signing up the user in the database
* @async
* @param {req, res}
* @returns {response} - saving the user in the database 
*/

exports.signUp = async (req, res) => {
    
    // TODO - add req body paramter validation IMPORTANT !!!
    try {
        // generate salt
        console.log(req.body);
        var salt = await bcrypt.genSalt(10);
        // hash password
        var hashedPass =  await bcrypt.hash(req.body.password, salt);
        db.sync({force:false})
        // sync databaseif
        if (req.body.is_professional === false){
            var user = await users.create({ 
                first_name :req.body.firstName, 
                last_name: req.body.lastName,
                email:req.body.email,
                phone:req.body.phone,
                is_professional:false 
            });
            var savedRow = await user.save();
            const { id, email } = savedRow;
            const token = jwt.sign({id, email}, process.env.ACCESS_TOKEN_SECRET);   
            var credential = await credentials.create({ 
                id:id,
                password: hashedPass,
                salt:salt,
                token:token
            })    
            // create credentials with user id 
            var savedCredential = await credential.save();    
            
            // send res with the token and user id
            res.status(201).send({id:savedCredential.id, accessToken:savedCredential.token});
        }   else if (req.body.is_professional === true){ 
          
            var user = await users.create({ 
                first_name :req.body.firstName, 
                last_name: req.body.lastName,
                email:req.body.email,
                phone:req.body.phone,
                is_professional:true 
            });
            console.log("USERRRRRRRRRRRRRR", user);
            var professional = await professionals.create({ 
                id : user.id, 
                category_id : req.body.category_id ,
                adress : req.body.adress,
                longitude : req.body.longitude,
                latitude : req.body.latitude,
                motorized : req.body.motorized,
                description : req.body.description 
            });
            var savedRow = await user.save();
            console.log("SAVEDROWWWWWWWWWWW", savedRow)
            const { id, email } = savedRow;
            const token = jwt.sign({id, email}, process.env.ACCESS_TOKEN_SECRET);  
          
            var credential = await credentials.create({ 
                id: user.id,
                password: hashedPass,
                salt:salt,
                token:token
            })    
            // create credentials with user id 
            var savedCredential= await credential.save();    
            console.log('hello cred',savedCredential)
            // send res with the token and user id
            res.status(201).send({id:savedCredential.id, accessToken:savedCredential.token});
        }
        
    }
    catch(e){ 
        throw(e);
    }     
    
    // save new user to database
    // send user id, email & token back to front end
}

/**
* @function singIn - signing in the user 
* @async
* @param {req, res}
* @returns {response} - getting the user from the database 
*/

exports.singIn = async (req, res) => {
    console.log(req.body);
    // TODO - add req body paramter validation IMPORTANT !!!
    try {
        // synchronizing database
        db.sync({force: false})
        .then(() => (
            // find user id in db
            users.findOne({
                where: {
                    email: req.body.email
                }
            })
            ))
            .then(userRow => {
                req.body.id = userRow.id;
                // fetch credentials by user id
                return credentials.findOne({
                    where: {
                        id: userRow.id
                    }
                })
            })
            .then(userCredentials => {
                console.log(userCredentials);
                // compare stored password with attempted password
                return bcrypt.compare(req.body.password, userCredentials.password)
            })
            .then(passwordMatch => {
                if (passwordMatch) {
                    const { id, email } = req.body;
                    const token = jwt.sign({id, email}, process.env.ACCESS_TOKEN_SECRET)
                    res.status(200).send({id:id, accessToken:token});
                } else {
                    res.status(401).send({message: 'password is incorrect'})
                }
            })
            .catch(e => {
                console.log('DB Error : ', e)
            })
        } catch(e) {
            console.log('Error catched : ',e)
        }
        
        
        // if successful 
        // create new jwt token
        // send user id and token back
        // if not 
        // send error msg
    }