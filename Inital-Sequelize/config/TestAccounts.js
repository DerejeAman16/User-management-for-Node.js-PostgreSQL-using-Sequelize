const bcrypt = require('bcrypt');
const User = require("../models").User;

async function createTestAccount() {
    const password = '123456';
    const hashedpassword =  await bcrypt.hash(password, 15);
    try {
        const testAccount = {
            email: 'dereje.aman@proton.me',
            password:  hashedpassword,
            role: 'admin',
            email_verification_status: false, 
            verificationToken: 'some-verification-token',  
          };
          const createdUser = await User.create(testAccount); 
    } catch (error) {
        console.error('Error creating test account:', error);

    }
}

module.exports = createTestAccount
