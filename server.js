/**
 * CMPSC 488: Authflow Authenticator
 * File name: server.js
 * Purpose: This file contains the server side code for the Authflow Authenticator application. It includes the routes for enrolling users, verifying passkeys, and fetching user accounts.
 * Author: Naman Bhatt
 * Date: 2/5/2024
 * Last Updated: 3/27/2024 
 * Credits: express-openid-connect, mysql, speakeasy, cors, node-fetch, dotenv, openai, winston
 * Additional Comments:
 * - The server is configured to use Auth0 for authentication.
 * - The server uses a MySQL database to store user information.
 * - The server uses the OpenAI API to provide chatbot functionality.
 * - The server uses Winston for logging.
 * - The server uses the speakeasy library to generate and verify passkeys.
 * - The server uses the cors library to enable cross-origin requests.
 */
const express = require('express');
const { auth } = require('express-openid-connect');
const mysql = require('mysql');

const app = express();
const port = process.env.PORT || 3000;


/**
 * Auth0 configuration object for express-openid-connect
 * - authRequired: false allows unauthenticated users to access the app
 * - auth0Logout: true enables the /logout route to log users out of Auth0
 * - secret: a long, randomly-generated string stored in an environment variable
 * - baseURL: the base URL of the app
 * - clientID: the Auth0 client ID
 * - issuerBaseURL: the Auth0 domain URL
 * - The secret, clientID, and issuerBaseURL values are stored in environment variables
 * - The baseURL is set to http://localhost:3000 for local development
 */
const config = {
    authRequired: false,
    auth0Logout: true,
    secret: 'a long, randomly-generated string stored in env',
    baseURL: 'https://authflow-cefe3af2fc5d.herokuapp.com',
    clientID: 'aRRWvT018Ls2zbNLDloG5vDRL8qwVYEx',
    issuerBaseURL: 'https://authflowauthenticator.us.auth0.com'
  };

app.use(auth(config));

const bodyParser = require('body-parser');
const speakeasy = require('speakeasy');
const crypto = require('crypto');
const cors = require('cors');

const fs = require('fs');
const path = require('path');
const winston = require('winston');

// Log files paths
const errorLogPath = path.join(__dirname, 'error.log');
const combinedLogPath = path.join(__dirname, 'authflow.log');

/**
 * Function to clear a log file
 * @param {string} filePath - The path to the log file
 * @return {void}
 * 
 * This function clears the contents of a log file by writing an empty string to it.
 * If an error occurs, it logs the error to the console.
 * 
 * outputFile: error.log
 * outputFile: authflow.log
 * 
 */
const clearLogFile = (filePath) => {
  fs.writeFileSync(filePath, '', (err) => {
    if (err) {
      console.error(`Error clearing log file ${filePath}: ${err}`);
    }
  });
};

// Clear log files on startup
clearLogFile(errorLogPath);
clearLogFile(combinedLogPath);

// Winston logger configuration
const logger = winston.createLogger({
  // Change to 'debug' for more verbose logging
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  
  // Log to console and files
  defaultMeta: { service: 'user-service' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'authflow.log' })
  ],
});

/**
 * Function to log user login details
 * @param {string} email - The email address of the user
 * @param {string} currentTime - The current date and time
 * @return {void}
 * 
 * This function logs the user's email address and the current date and time.
 * If an error occurs, it logs the error to the console.
 * 
 */
const connection = mysql.createConnection({
  host: '35.192.117.103',
  user: 'root',
  password: 'authflow',
  database: 'accounts',
  port: 3306
});

  connection.connect(err => {
    if (err) {
      console.error('Error connecting: ' + err.stack);
      return;
    }
  
    console.log('Connected as id ' + connection.threadId);
  });
  app.use(cors());

  let userAttempts = {};
  app.use(bodyParser.json());
  
  /**
   * Function to log user login details
   * @param {string} email - The email address of the user
   * @param {string} currentTime - The current date and time
   * @return {void}
   * 
   * This function logs the user's email address and the current date and time.
   * If an error occurs, it logs the error to the console.
   * 
   */
  app.get('/', (req, res) => {
    if (req.oidc.isAuthenticated()) {
        const userEmail = req.oidc.user.email;
        const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
        
        // Set all users to not currently logged in
        connection.query('UPDATE clients SET is_currently_logged_in = 0', (err) => {
            if (err) throw err;
            console.log('Reset login status for all users.');
        });

        // Insert or update client entry for currently logged in user
        const query = `INSERT INTO clients (email, created_at, last_login, is_currently_logged_in) VALUES (?, ?, ?, 1) ON DUPLICATE KEY UPDATE last_login=?, is_currently_logged_in=1`;
        
        connection.query(query, [userEmail, currentTime, currentTime, currentTime], (err, results) => {
            if (err) throw err;
            console.log('User login details updated in the database.');
        });

        res.sendFile(__dirname + '/profile.html');
    } else {
        res.sendFile(__dirname + '/login.html');
    }
});


const fetch = require('node-fetch');
require('dotenv').config();


const OpenAI = require('openai');

const openai = new OpenAI(process.env.OPENAI_API_KEY);

/**
 * Function for the chatbot endpoint
 * @param {string} message - The user's message to the chatbot
 * @return {object} - The chatbot's reply
 * 
 * This function sends the user's message to the OpenAI API and returns the chatbot's reply.
 * If an error occurs, it logs the error to the console and returns an error message.
 * 
 */
app.post('/chatbot', async (req, res) => {
  const userMessage = req.body.message;

  try {
    const response = await fetch('https://api.openai.com/v1/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo", 
        prompt: `This is a chatbot for the AuthFlow Authenticator app which is similar to the Microsoft Authenticator. A user asks: ${userMessage}\n\n`,
        temperature: 0.7,
        max_tokens: 13,
        top_p: 1.0,
        frequency_penalty: 0.0,
        presence_penalty: 0.0,
      })
    });

    const jsonResponse = await response.json();
    if (response.ok) {
      res.json({ reply: jsonResponse.choices[0].text.trim() });
    } else {
      console.error('OpenAI API error:', jsonResponse);
      res.status(500).json({ message: 'Error processing your request with OpenAI' });
    }
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


/**
 * Function to generate a random string
 * @param {number} length - The length of the random string
 * @return {string} - The random string
 * 
 * This function generates a random string of the specified length using the crypto library.
 * If an error occurs, it logs the error to the console and returns an error message.
 * 
 */
const refreshPasskey = () => {
  const selectQuery = 'SELECT id, secret FROM users';
  connection.query(selectQuery, (err, results) => {
    logger.error(err);
    if (err) console.error(err);
    else {
      results.forEach(user => {
        // Generate new token for each user
        const token = speakeasy.totp({
          secret: user.secret,
          encoding: 'base32'
        });

      console.log('Passkeys refreshed');
      logger.info('Passkeys refreshed');
    }
 )};
}
)};

setInterval(refreshPasskey, 30000);

/**
 * Function to enroll a user
 * @param {string} email - The email address of the user
 * @return {object} - The secret key for the user
 * 
 * This function generates a secret key for the user and inserts the user's email and secret key into the users table.
 * If an error occurs, it logs the error to the console and returns an error message.
 * 
 */
  app.post('/verifyAndRegister', (req, res) => {

    logger.info('Entering /verifyAndRegister endpoint');
    const { code } = req.body;
  
    // Logging the received email and code for verification
    logger.info(`Attempting to verify and register for email with code: ${code}`);
    // Corrected to use email for the query to fetch the user data, including the authFlowCode
    const query = 'SELECT email, password_hash , pin, idp FROM authflowusers WHERE pin = ?';
  
    connection.query(query, [code], (err, results) => { // Using code to fetch the record
      if (err) {
        console.error(err);
        return res.status(500).send({ message: 'Error fetching user data' });
      }
      if (err) {
        logger.error('Database query error: ${err.message}');
      }
  
      if (results.length > 0 && results[0].pin === code) {
        const user = results[0];
        
        logger.info(`User found and enrolled for AuthFlow`);
  
        // Now correctly comparing the provided code with the authFlowCode from the database
        if (user.pin === code) {
          logger.info(`Code matched for email`);
          // If codes match, proceed with user migration to 'users' table
          const secret = speakeasy.generateSecret({length: 20});
          const token = speakeasy.totp({
            secret: secret.base32,
            encoding: 'base32'
          });
          
          const insertQuery = 'INSERT INTO users (email, secret, idp) VALUES (?, ?, ?)';
          connection.query(insertQuery, [user.email, secret.base32, user.idp], (insertErr, insertResult) => {
            if (insertErr) {
              console.error(insertErr);
              return res.status(500).send({ message: 'Error adding user to users table' });
            }
  
            if (insertErr) {
              logger.error(`Error adding user to users table: ${insertErr.message}`);
            }
  
          logger.info(`Account verified and registered successfully for user `); 
          res.send({ message: 'Account verified and registered successfully', secret: secret.base32 });
          });
        } else {
          // Code does not match
          logger.warn(`Incorrect code provided for user`);
          res.status(401).send({ message: 'Incorrect code, please try again' });
        }
      } 
      else {
        // User not found or not enrolled
        logger.warn(`User not found or not enrolled for AuthFlow`);
        res.status(404).send({ message: 'User not found or not enrolled for AuthFlow' });
      }
    });
    logger.info('Exiting /verifyAndRegister endpoint');
  });

/**
 * Function to logout a user
 * @param {void}
 * @return {void}
 * 
 * This function logs the user out of the app and redirects them to the login page.
 * 
 */
  app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/login');
  });

/**
 * Function to delete a user account
 * @param {string} email - The email address of the user
 * @return {void}
 * 
 * This function deletes the user's account from the users table.
 * If an error occurs, it logs the error to the console and returns an error message.
 * 
 */
app.delete('/deleteAccount', (req, res) => {
  const { email } = req.body;
  logger.info(`Request received to delete account for email: ${email}`);
  
  // First, delete the account from the users table
  const deleteUserQuery = 'DELETE FROM users WHERE email = ?';
  connection.query(deleteUserQuery, [email], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send({ message: 'Error deleting user account' });
    }
    if (err) {
      logger.error(`Error deleting user account for email ${email}: ${err}`);
    }
    logger.info(`User account for email ${email} deleted successfully.`);
  });
});

/**
 * Function to verify a passkey
 * @param {string} email - The email address of the user
 * @param {string} passkey - The passkey entered by the user
 * @return {object} - The result of the passkey verification
 * 
 * This function fetches the user's secret key from the users table and verifies the passkey entered by the user.
 * If the passkey is verified successfully, it returns a success message.
 * If the passkey is invalid, it returns an error message.
 * If the user is not found, it returns a not found message.
 * If an error occurs, it logs the error to the console and returns an error message.
 * 
 * The passkey is verified using the speakeasy library.
 * 
 */
app.post('/verify-passkey', (req, res) => {
    const { email, passkey } = req.body;
    const query = 'SELECT secret FROM users WHERE email = ?';

    connection.query(query, [email], (err, results) => {
        if (err) {
            logger.error(`Database query error: ${err.message}`);
            return res.status(500).send({ message: 'Error fetching user data' });
        }

        if (results.length > 0) {
            const secret = results[0].secret;
            const verified = speakeasy.totp.verify({
                secret: secret,
                encoding: 'base32',
                token: passkey,
                window: 1 // Allows for a bit of time skew.
            });

            if (verified) {
                res.json({ success: true, message: 'Passkey verified successfully' });
            } else {
                res.status(401).send({ success: false, message: 'Invalid passkey' });
            }
        } else {
            res.status(404).send({ success: false, message: 'User not found' });
        }
    });
});



/**
 * Function to fetch user accounts
 * @param {void}
 * @return {object} - The list of user accounts
 * 
 * This function fetches the email, secret key, and IDP for each user from the users table.
 * It generates a passkey for each user using the speakeasy library.
 * If an error occurs, it logs the error to the console and returns an error message.
 * 
 */
app.get('/getAccounts', (req, res) => {
  logger.info('Entering /getAccounts endpoint');
  const selectQuery = 'SELECT email, secret, idp FROM users';
  connection.query(selectQuery, (err, results) => {
    if (err) {
      logger.error(`Error fetching accounts from database: ${err.message}`);
      console.error(err);
      return res.status(500).send({ message: 'Error fetching accounts' });
    } 

    const accounts = results.map(user => {
      let isSuspended = false;
      const now = new Date();
      // Check if the account is suspended
      if (userAttempts[user.email] && userAttempts[user.email].suspendedUntil && userAttempts[user.email].suspendedUntil > now) {
        isSuspended = true;
      }
      
      return {
        email: user.email,
        passkey: speakeasy.totp({
          secret: user.secret,
          encoding: 'base32'
        }),
        idp: user.idp,
        isSuspended: isSuspended, // Add suspension status
      };
    });

    logger.info(`Successfully fetched accounts. Number of accounts fetched: ${accounts.length}`);
    res.json(accounts);
  });
});

/**
 * Function to recover an account
 * @param {string} email - The email address of the user
 * @return {object} - The security questions and answers for the user
 * 
 * This function checks if the email is in the user_info table but not in the users table.
 * If the email exists, it fetches the security questions and answers for the user.
 * If the email is not found or the account still exists, it returns an error message.
 * If an error occurs, it logs the error to the console and returns an error message.
 * 
 * The security questions and answers are fetched from the user_info table.
 * 
 */
app.post('/recoverAccount', (req, res) => {
  const { email } = req.body;
  // Check if the email is in the user_info table but not in the users table
  const checkQuery = `SELECT * FROM user_info WHERE email = ?`;
  connection.query(checkQuery, [email], (err, results) => {
      if (err) {
          console.error(err);
          return res.status(500).send({ message: 'Database error.' });
      }
      if (results.length > 0) {
          // If email exists, get the security questions
          const questions = [results[0].question1, results[0].question2, results[0].question3];
          const answers = [results[0].answer1, results[0].answer2, results[0].answer3];
          res.json({ questions, answers });
      } else {
          res.status(404).send({ message: 'Email not found or account still exists.' });
      }
  });
});

/**
 * Function to reset a passkey
 * @param {string} email - The email address of the user
 * @return {object} - The new passkey for the user
 * 
 * This function generates a new secret key for the user and updates the users table with the new secret key.
 * If an error occurs, it logs the error to the console and returns an error message.
 * 
 */
app.get('/why_authflow', (req, res) => {
    res.sendFile(__dirname + '/why_Authflow.html');
});

app.get('/registration_page', (req, res) => {
    res.sendFile(__dirname + '/registration_page.html');
});

app.listen(port, () => console.log(`Listening on http://localhost:${port}`));
