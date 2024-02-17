const userController = require("../controller/user");
const postController = require("../controller/post");
const User = require("../models").User;
const PasswordReset = require('../models').PasswordReset;
const express = require("express");
const router = express.Router();
router.get("/api", (req, res) => {
  res.status(200).send({
    data: "Welcome Node Sequlize API v1",
  });
}); 
router.get("/verify/:verificationToken?", async (req, res) => {
  const { verificationToken } = req.params;
  try {
    // Find the user with the given verification token
    const user = await User.findOne({ where: { verificationToken } });
    if (!user) {
      return res.status(400).send("Invalid verification token");
    }
    // Update email_verification_status to true
    await user.update({ email_verification_status: true });

    // Redirect to the login page
    /*    return res.redirect('http://localhost:3000/login/'); */
    const redirectUrl = "http://localhost:3000/login/";
    const script = `
   <script>
     alert('Email verified successfully');
     window.location.href = '${redirectUrl}';
   </script>
 `;
    return res.send(script);
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal server error");
  }
});

router.post('/api/user/reset-password',userController.sendResetPasswordLink)
 // In the route handler
router.get("/reset-password/:token?", async (req, res) => {
  const { token } = req.params;
  try {
    const user = await PasswordReset.findOne({ where: { token } });
    if (!user) {
      return res.status(400).send("Invalid verification token");
    }
    if (new Date() > user.expiresAt) {
      return res.status(400).send("The reset token has expired");
    }
    await user.update({ password_reset_status: true });
    // Redirect to the password update page with token as query parameter
    return res.redirect(`http://localhost:3000/update-password/?token=${token}`);
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal server error");
  }
});

router.put('/update-password',userController.udatePassword)
router.get("/api/users", userController.getAllUsers);
//test
router.post("/api/user/create", userController.create);
router.post("/user/signup", userController.signup);
router.post("/api/user/login", userController.login);

router.put("/api/user/:userId", userController.update);

router.get("/api/:userId/posts", postController.getAllPostsOfUser);

router.post("/api/post/create", postController.createPost);

router.put("/api/:postId", postController.update);
module.exports = router;
