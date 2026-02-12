const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");

const router = express.Router();

const subjectsList = [
  "Maths",
  "Reasoning",
  "History",
  "Geography",
  "Polity",
  "Static GK",
  "Current Affairs",
  "English",
  "Science",
  "COA",
  "SNS"
];

// GET USER RECORDS (Auto-create today's record)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    const today = new Date().toISOString().split("T")[0];

    let todayRecord = user.records.find(r => r.date === today);

    if (!todayRecord) {
      const newRecord = {
        date: today,
        subjects: subjectsList.map(subject => ({
          subjectName: subject,
          video: false,
          revision: false,
          test: false
        }))
      };

      user.records.push(newRecord);
      await user.save();
    }

    res.json(user.records);

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});
// UPDATE CHECKBOX
router.put("/update", authMiddleware, async (req, res) => {
  try {
    const { date, subjectName, field, value } = req.body;

    const user = await User.findById(req.user.id);

    const record = user.records.find(r => r.date === date);
    if (!record) {
      return res.status(404).json({ message: "Date not found" });
    }

    const subject = record.subjects.find(s => s.subjectName === subjectName);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    if (!["video", "revision", "test"].includes(field)) {
      return res.status(400).json({ message: "Invalid field" });
    }

    subject[field] = value;

    await user.save();

    res.json({ message: "Updated successfully ✅" });

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});
// ANALYTICS ROUTE
// ANALYTICS ROUTE
router.get("/analytics", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    const sortedRecords = user.records.sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    let totalTasks = 0;
    let completedTasks = 0;

    const subjectStats = {};
    const activeDates = [];

    sortedRecords.forEach(record => {
      let dayCompleted = false;

      record.subjects.forEach(subject => {
        if (!subjectStats[subject.subjectName]) {
          subjectStats[subject.subjectName] = {
            total: 0,
            completed: 0
          };
        }

        ["video", "revision", "test"].forEach(field => {
          subjectStats[subject.subjectName].total++;
          totalTasks++;

          if (subject[field]) {
            subjectStats[subject.subjectName].completed++;
            completedTasks++;
            dayCompleted = true;
          }
        });
      });

      if (dayCompleted) {
        activeDates.push(record.date);
      }
    });

    // 🔥 STREAK CALCULATION
    let streak = 0;
    const today = new Date();

    for (let i = 0; i < activeDates.length; i++) {
      const recordDate = new Date(activeDates[i]);
      const diff =
        Math.floor((today - recordDate) / (1000 * 60 * 60 * 24));

      if (diff === streak) {
        streak++;
      } else {
        break;
      }
    }

    const overallPercentage = totalTasks
      ? ((completedTasks / totalTasks) * 100).toFixed(1)
      : 0;

    res.json({
      totalDays: user.records.length,
      overallPercentage,
      subjectStats,
      streak
    });

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});


module.exports = router;
