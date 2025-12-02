class HistoryController {
  constructor(historyModel) {
    this.historyModel = historyModel;
  }

  // Get all history for a user
  async getUserHistory(req, res) {
    try {
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const history = await this.historyModel.findByUserId(userId);

      res.json(history);
    } catch (error) {
      console.error('Get history error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get accepted requests
  async getAcceptedRequests(req, res) {
    try {
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const accepted = await this.historyModel.getAcceptedRequests(userId);

      res.json(accepted);
    } catch (error) {
      console.error('Get accepted requests error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get cancelled requests
  async getCancelledRequests(req, res) {
    try {
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const cancelled = await this.historyModel.getCancelledRequests(userId);

      res.json(cancelled);
    } catch (error) {
      console.error('Get cancelled requests error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = HistoryController;