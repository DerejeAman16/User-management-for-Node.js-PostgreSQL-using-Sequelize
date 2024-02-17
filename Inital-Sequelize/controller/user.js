const User = require("../models").User;
const PasswordReset = require('../models').PasswordReset;
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const validator = require("validator");
const emailvalidator = require("email-validator");
const generateVerificationToken = require("../middleware/GenerateVerificationToken");
const axios = require("axios");
require("dotenv").config();
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

module.exports = {
  async getAllUsers(req, res) {
    try {
      const userCollection = await User.findAll({});

      res.status(201).send(userCollection);
    } catch (e) {
      console.log(e);

      res.status(500).send(e);
    }
  },

  async create(req, res) {
    try {
      const userCollection = await User.create({
        email: req.body.email,
      });

      res.status(201).send(userCollection);
    } catch (e) {
      console.log(e);
      res.status(400).send(e);
    }
  },
  async signup(req, res) {
    try {
      const { email, password } = req.body;
      const response = await axios.get(
        `https://emailvalidation.abstractapi.com/v1/?api_key=${process.env.API_KEY}&email=${email}`
      );
      const { deliverability, is_valid_format } = response.data;
      // Check if the email is deliverable and valid
      if (!is_valid_format.value || deliverability !== "DELIVERABLE") {
        return res.status(400).send("Invalid email address");
      }

      const userExists = await User.findOne({ where: { email } });
      if (userExists) {
        return res
          .status(400)
          .json({ message: "Email is already associated with an account" });
      }
      const setrole = "admin";
      const verificationToken = generateVerificationToken();
      await User.create({
        email,
        role: setrole,
        password: await bcrypt.hash(password, 15),
        email_verification_status: false,
        verificationToken,
      });
      const verificationLink = `http://localhost:3456/register/verify/${verificationToken}`;
      const mailOptions = {
        from: "omdereje16@gmail.com",
        to: email,
        subject: "Email Verification",
        html: `<p>Click <a href="${verificationLink}">here</a> to verify your email address</p>`,
      };
      await transporter.sendMail(mailOptions);

      return res
        .status(200)
        .send(
          "Registration successful. Check your email for verification link"
        );
    } catch (e) {
      console.error(e);
      res.status(400).send(e);
    }
  },
  async sendResetPasswordLink(req, res) {
    try {
        const { email } = req.body;
        // Check if the email exists in the database
        const user = await User.findOne({ where: { email } }); 
        if (!user) {
            return res.status(400).json({ message: 'Email not found' });
        }
        // Generate and save reset token
        const resetToken = generateVerificationToken();  
        await PasswordReset.create({ 
          UserId: user.id, 
          token: resetToken ,
          password_reset_status:false});
      
        const resetLink = `http://localhost:3456/register/reset-password/${resetToken}`;
        const mailOptions = {
          from: "omdereje16@gmail.com",
          to: email,
          subject: "Password reset",
          html: `<p>Click <a href="${resetLink}">here</a> to verify your email address</p>`,
        };
        await transporter.sendMail(mailOptions);

        return res.status(200).json({ message: 'Reset password link sent successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
},

async udatePassword(req, res) {
  try {
    const{token, password}=req.body;
    console.log('token', token)
    const user = await PasswordReset.findOne({ where: {  token } });
    if (!user || !user.password_reset_status) {
      return res
     .status(400)
     .json({ message: "Invalid token or password reset not allowed" });
    }
    const hashedPassword = await bcrypt.hash(password, 15);
    await User.update({ password: hashedPassword }, { where: { id: user.UserId } });
    return res.status(200).json({message: "password has successfully updated"})
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal server error");
    
  }
},
  async login(req, res) {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res
          .status(400)
          .json({ message: "Email is not associated with an account" });
      }
      if (!user.email_verification_status) {
        return res
          .status(400)
          .json({ success: false, message: "Email is not verified" });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Password is incorrect" });
      }
      const token = jwt.sign(
        { email: user.email, id: user.id },
        process.env.JWT_SECRET
      );
      //return res.status(200).json({ accessToken: token });

      res.status(200).json({
        success: true,
        accessToken: token,
        userData: { ...user.dataValues },
      });
    } catch (error) {
      console.log(error);
    }
  },

  async update(req, res) {
    try {
      const userCollection = await User.find({
        id: req.params.userId,
      });

      if (userCollection) {
        const updatedUser = await User.update({
          id: req.body.email,
        });

        res.status(201).send(updatedUser);
      } else {
        res.status(404).send("User Not Found");
      }
    } catch (e) {
      console.log(e);

      res.status(500).send(e);
    }
  },
};
