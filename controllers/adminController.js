const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid"); // Import the UUID generator
const { uploadFile } = require("../aws/awsS3");
const { ObjectId } = require('mongodb');

const createAdmin = async (req, res) => {


  try {
    const { name, password, email, role } = req.body;

    if (!name|| !password|| !email|| !role) return res.status(500).json({message:"Please Provide All Data"})

    const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await prisma.admin.create({
        data: {
          id: new ObjectId().toString(),
          name,
          password: hashedPassword,
          email,
          role
        },
      });

      return res.status(201).json({ status: true, msg: "Admin Created Successfully", data: newUser });
    
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, msg: error.message });
  }
};


// const getAdmin = async (req, res) => {
//   try {
//     const adminId = req.params.id;
//     const admin = await prisma.admin.findUnique({
//       where: { id: parseInt(adminId) },
//       select: { password: false },
//     });

//     if (!admin || admin.role !== "admin") {
//       return res.status(401).send({ status: false, msg: "UnAuthorised user" });
//     }

//     return res.status(200).send({ status: true, msg: "Success", data: admin });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).send({ status: false, msg: error.message });
//   }
// };

const findAdmin = async (req, res) => {
  try {
    const adminId = req.params.id; // Parse the adminId as a string

    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (admin) {
      // Admin found
      res.status(200).json({ status: true, data: admin });
    } else {
      // Admin not found
      res.status(404).json({ error: "Admin not found" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to find admin" });
  }
};


const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.admin.findFirst({
      where: { email: email, role: "admin" },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    const token = jwt.sign(
      {
        userID: user.id.toString(),
      },
      process.env.JWT_SECRET,
      { expiresIn: "2d" }
    );

    return res.status(200).send({
      status: true,
      msg: "Login Success",
      token: token,
      userID: user.id,
      userType: user.role,
      name: user.name,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ status: false, msg: error.message });
  }
};


module.exports = {
    createAdmin,
    adminLogin,
    findAdmin
  };