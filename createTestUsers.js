// scripts/createTestUsers.js
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { faker } = require('@faker-js/faker'); // npm i faker
const User = require('./models/user.model'); // sửa đường dẫn tới model User của bạn
const { constants } = require('crypto');

// Kết nối MongoDB
mongoose.connect('mongodb://localhost:27017/ten_db_cua_ban', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Hàm bỏ dấu và khoảng trắng, viết liền, viết thường
function normalizeName(name) {
    return name
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // bỏ dấu
        .replace(/\s+/g, ''); // bỏ khoảng trắng
}

/**
 * Tạo user test và lưu ra MongoDB & JSON file
 * @param {number} count số lượng user muốn tạo
 */
async function createTestUsers(count = 20) {
    const users = [];

    for (let i = 0; i < count; i++) {
        const fullName = faker.name.findName();             // tên giống thật
        const email = `${normalizeName(fullName)}${Math.floor(10000 + Math.random() * 90000)}@example.com`;

        const password = await bcrypt.hash('123456', 10); // password mặc định

        users.push({
            fullName,
            email,
            password,
            avatarUrl: faker.image.avatar(),
            phoneNumber: faker.phone.number('0#########'),
            address: faker.address.streetAddress(),
            provinceId: faker.datatype.uuid(),
            districtId: faker.datatype.uuid(),
            wardCode: faker.datatype.uuid(),
            role: 1, // User
            status: 1
        });
    }

    // console.log(uses)
    try {
        // Lưu vào MongoDB
        // const result = await User.insertMany(users);
        // console.log(`${result.length} users created successfully in MongoDB.`);

        // Lưu ra file JSON
        const filePath = path.join(__dirname, 'testUsers.json');
        fs.writeFileSync(filePath, JSON.stringify(users, null, 2), 'utf-8');
        console.log(`Users data saved to ${filePath}`);
    } catch (err) {
        console.error('Error creating users:', err);
    } finally {
        mongoose.connection.close();
    }
}

// Tạo 20 users test (có thể chỉnh số lượng)
createTestUsers(20);
