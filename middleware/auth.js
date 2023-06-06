const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");

const authMiddleware = async (req, res, next) => {
  try {
    const { authorization } = req.headers;

    if (authorization && authorization.startsWith("Bearer")) {
      const token = authorization.split(" ")[1];
      const { userID } = jwt.verify(token, process.env.JWT_SECRET);

      let role;
      let entity;

      const admin = await prisma.admin.findUnique({
        where: { id: userID },
        select: { id: true, role: true },
      });

      if (admin) {
        role = admin.role;
        entity = admin;
      } else {
        const user = await prisma.user.findUnique({
          where: { id: userID },
          select: { id: true, role: true },
        });

        if (user) {
          role = user.role;
          entity = user;
        }
      }

      if (role) {
        req.user = entity;
        req.user.role = role;
        next();
      } else {
        return res.status(401).send({ msg: "Unauthorized user or Token is missing" });
      }
    } else {
      return res.status(401).send({ msg: "Unauthorized user or Token is missing" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send({ msg: error.message });
  }
};

module.exports = { authMiddleware };
