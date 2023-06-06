const { v4: uuidv4 } = require('uuid');
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const { uploadFile } = require("../aws/awsS3");

const createUser = async (req, res) => {
  try {
    const { name, password, email, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const image = req.files[0]; // Assuming you are using multer for file uploads

    // Validation and checks go here...
    if (req.user.role !== "admin" && req.user.role !== "master") {
      return res.status(401).send({ status: false, msg: "Unauthorized" });
    }

    if (role === "distributer" && req.user.role !== "admin" && req.user.role !== "master") {
      return res.status(401).send({ status: false, msg: "Unauthorized" });
    }
      
    if (role === "retailer" && req.user.role !== "admin" && req.user.role !== "master" && req.user.role !== "distributer") {
      return res.status(401).send({ status: false, msg: "Unauthorized" });
    }
      
    let parent_id;
    if (role === "master") {
      parent_id = req.user.id;
    } else if (role === "distributer") {
      if (req.user.role === "admin" || req.user.role === "master") {
        parent_id = req.user.id;
      } else {
        return res.status(401).send({ status: false, msg: "Unauthorized" });
      }
    } 
    else if (role === "retailer") {
      if (req.user.role === "admin" || req.user.role === "master"|| req.user.role === "distributer" ) {
        parent_id = req.user.id;
      } else {
        return res.status(401).send({ status: false, msg: "Unauthorized" });
      }
    } else {
      return res.status(400).send({ status: false, msg: "Invalid Role" });
    }
      
    if (image) {
      const newUser = await prisma.user.create({
        data: {
          id: uuidv4(),
          name,
          password: hashedPassword,
          email,
          role,
          admin: { connect: { id: parent_id } },
          profileImage: await uploadFile(image)
        },
      });
      return res.status(201).send({ status: true, msg: "User Created Successfully", data: newUser });
    } else {
      // Handle the case when no image file is uploaded
      return res.status(400).send({ status: false, msg: "No image file uploaded" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send({ status: false, msg: error.message });
  }
};



const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, password, email } = req.body;
    const image = req.files ? req.files[0] : undefined;

    const updateData = {};

    if (name) {
      updateData.name = name;
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    if (email) {
      updateData.email = email;
    }

    if (image) {
      updateData.profileImage = await uploadFile(image);
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: id,
      },
      data: updateData,
    });

    return res.status(200).send({ status: true, msg: "User updated successfully", data: updatedUser });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ status: false, msg: error.message });
  }
};


const getUserByid = async (req, res) => {
  try {
    const id = req.params.id;

    const user = await prisma.user.findUnique({
      where: {
        id: id,
      },
    });

    if (!user) {
      return res.status(404).json({ status: false, msg: "User not found" });
    }

    return res.status(200).json({ status: true, msg: "User found", data: user });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, msg: error.message });
  }
};



 const getUser = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        parentId: true,
        profileImage:true,
        admin: true,
      },
    });

    return res.status(200).send({ status: true, data: users });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ status: false, msg: error.message });
  }
};


const deleteUser = async (req, res) => {
    try {
      const id = req.params.id; // Corrected line
  
      let user =await prisma.user.delete({
        where: {
          id: id,
        },
      });
  
      return res.status(200).send({ status: true, data:user, msg: "User Deleted" });
    } catch (error) {
      console.log(error);
      return res.status(500).send({ status: false, msg: error.message });
    }
  };
  
  
module.exports = {
  createUser,updateUser,getUser,deleteUser,getUserByid
};

