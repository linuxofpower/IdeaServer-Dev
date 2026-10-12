import db from "../conn.js";
import { ObjectId } from "mongodb";

// ✅ Create a personal question
export async function createPersonalQuestion(req, res) {
  try {
    const { title, recipientUserId, userId, name } = req.body;

    if (!title || title.trim().length === 0) {
      return res.status(400).json({ message: "Title cannot be empty" });
    }

    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const identifier = userId || `Anonymous_${ip}`;
    const displayName = name || "Anonymous";

    const newQuestion = {
      _id: new ObjectId(),
      title: title.trim(),
      authorId: identifier,
      authorName: displayName,
      createdAt: new Date()
    };

    const result = await db.collection("users").updateOne(
      { googleId: recipientUserId },
      { $push: { unanswered: newQuestion } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Recipient user not found by Google ID" });
    }

    res.status(201).json({ message: "Personal question sent", question: newQuestion });
  } catch (err) {
    console.error("❌ Error creating personal question:", err);
    res.status(500).json({ message: "Failed to send personal question" });
  }
}

// ✅ Answer a personal question
export async function answerPersonalQuestion(req, res) {
  try {
    const { questionId } = req.params;
    const { content, userId } = req.body;

    if (!content || !userId) {
      return res.status(400).json({ message: "Missing content or userId" });
    }

    const user = await db.collection("users").findOne({ googleId: userId });

    if (!user) {
      return res.status(404).json({ message: "User not found by Google ID" });
    }

    const questionIndex = user.unanswered.findIndex(
      (q) => q._id.toString() === questionId
    );

    if (questionIndex === -1) {
      return res.status(404).json({ message: "Question not found in unanswered list" });
    }

    const question = user.unanswered[questionIndex];
    const answeredQuestion = {
      ...question,
      answer: content.trim(),
      answeredAt: new Date(),
    };

    await db.collection("users").updateOne(
      { googleId: userId },
      {
        $pull: { unanswered: { _id: question._id } },
        $push: { answered: answeredQuestion },
      }
    );

    res.status(200).json({ message: "Question answered", question: answeredQuestion });
  } catch (err) {
    console.error("❌ Error answering personal question:", err);
    res.status(500).json({ message: "Failed to answer question" });
  }
}

// ✅ Delete a personal question (by author or admin)
export async function deletePersonalQuestion(req, res) {
  try {
    const { questionId } = req.params;
    let { userId } = req.body;

    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const identifier = userId || `Anonymous_${ip}`;

    const usersCollection = db.collection("users");

    // Check if user is admin
    const adminUser = userId
      ? await usersCollection.findOne({ googleId: userId, status: "admin" })
      : null;
    const isAdmin = !!adminUser;

    const result = await usersCollection.updateOne(
      {
        $or: [
          { "unanswered._id": new ObjectId(questionId), "unanswered.authorId": identifier },
          { "answered._id": new ObjectId(questionId), "answered.authorId": identifier },
          ...(isAdmin ? [{}] : []), // allow admin to delete any
        ],
      },
      {
        $pull: {
          unanswered: { _id: new ObjectId(questionId) },
          answered: { _id: new ObjectId(questionId) },
        },
      }
    );

    console.log("🧾 Backend received userId:", userId);
    console.log("🧾 Resolved identifier:", identifier);
    console.log("🔐 isAdmin:", isAdmin);
    console.log("🧹 Deletion result:", result.modifiedCount);

    if (result.modifiedCount === 0) {
      return res.status(403).json({ message: "You are not allowed to delete this question" });
    }

    res.status(200).json({ message: "Question deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting personal question:", err);
    res.status(500).json({ message: "Failed to delete question" });
  }
}
