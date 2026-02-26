const userService = require('../services/user.service');



class UserController {


  // GET /api/users - Liste tous les utilisateurs
  async getAll(req, res) {
 try {
    const users = await userService.getAllUsers();
    if (users.length === 0) {
      return res.status(200).json({ message: "Aucun utilisateur trouvé" });
    }
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
  }








}


module.exports = new UserController();
