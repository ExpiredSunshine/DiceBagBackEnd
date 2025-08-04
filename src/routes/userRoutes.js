const express = require("express");
const router = express.Router();

// Placeholder for user routes - will be implemented in next commit
router.get("/test", (req, res) => {
  res.json({ message: "User routes placeholder" });
});

module.exports = router;
