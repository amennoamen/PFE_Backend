const {prisma} =require ('../config/database.js');

class UserService {





    async getAllUsers() {
        const allUsers =await prisma.user.findMany()
        return  allUsers

  }


}



module.exports = new UserService();