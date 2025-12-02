class UserController {
  constructor(userModel) {
    this.userModel = userModel;
  }

  async createOrUpdateUser(req, res) {
    try {
      const { uid, email, displayName, photoURL, providerId } = req.body;

      if (!uid || !email) {
        return res.status(400).json({ error: "UID and email are required" });
      }

      const user = await this.userModel.createOrUpdate({
        uid,
        email,
        displayName,
        photoURL,
        providerId
      });

      res.json({
        success: true,
        message: "User logged in successfully",
        user
      });
    } catch (error) {
      console.error("User login error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  async getUserProfile(req, res) {
    try {
      const { uid } = req.params;
      const user = await this.userModel.getUserByUid(uid);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = UserController;