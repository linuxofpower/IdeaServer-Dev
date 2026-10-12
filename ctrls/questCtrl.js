import db from "../conn.js";
import { ObjectId } from "mongodb";

// Create a new question
export async function createQuestion(req, res) {
  try {

    let { title, userId, name } = req.body;

    if (!title || title.trim().length === 0) {
      return res.status(400).json({ message: "Title cannot be empty" });
    }

    const ipAddress = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const identifier = userId || `Anonymous_${ipAddress}`;
    const displayName = name || "Anonymous";

    const newQuestion = {
      title: title.trim(),
      authorId: identifier,
      authorName: displayName,
      createdAt: new Date(),
      likes: 0,
      likedBy: [],
      anonymousLikes: [],
      answers: [],

    };

    const questionsCollection = db.collection("questions");
    const result = await questionsCollection.insertOne(newQuestion);

    res.status(201).json({ ...newQuestion, _id: result.insertedId });

  } catch (error) {
    console.error("Error creating question:", error);
    res.status(500).json({ message: "Failed to create question" });
  }
}

// Get all questions
export async function getQuestions(req, res) {
  try {
    const questionsCollection = db.collection("questions");
    const questions = await questionsCollection.find({}).toArray();
    res.status(200).json(questions);
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({ message: "Failed to fetch questions" });
  }
}

// Get a single question by ID
export const getQuestion = async (req, res) => {

  try {
    const { questionId } = req.params;
    const objectId = new ObjectId(questionId);

    const question = await db.collection("questions").findOne(
      { _id: objectId },
      { projection: { content: 0 } }
    );

    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    res.json(question);

  } catch (error) {
    console.error("Error fetching question:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Like or unlike a question
export async function likeQuestion(req, res) {
  try {
    const { questionId } = req.params;
    let { userId } = req.body;

    if (!userId) {
      userId = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    }

    const questionsCollection = db.collection("questions");
    const question = await questionsCollection.findOne({ _id: new ObjectId(questionId) });
    if (!question) return res.status(404).json({ message: "Question not found" });


    if (!question.likedBy) question.likedBy = [];
    if (!question.anonymousLikes) question.anonymousLikes = [];


    if (typeof question.likes !== "number" || isNaN(question.likes)) {
      question.likes = 0;
    }


    const isAnonymous = userId.includes(":") || userId.startsWith("Anonymous_");
    const hasLiked = isAnonymous
      ? question.anonymousLikes.includes(userId)
      : question.likedBy.includes(userId);

    if (hasLiked) {

      question.likes = Math.max(0, question.likes - 1);
      if (isAnonymous) {
        question.anonymousLikes = question.anonymousLikes.filter(id => id !== userId);
      } else {
        question.likedBy = question.likedBy.filter(id => id !== userId);
      }
    } else {

      question.likes += 1;
      if (isAnonymous) {
        question.anonymousLikes.push(userId);
      } else {
        question.likedBy.push(userId);
      }
    }

    await questionsCollection.updateOne(
      { _id: new ObjectId(questionId) },
      {
        $set: {

          likes: question.likes,
          likedBy: question.likedBy,
          anonymousLikes: question.anonymousLikes
        }
      }
    );

    res.status(200).json({
      _id: questionId,
      likes: question.likes,
      likedBy: question.likedBy,
      anonymousLikes: question.anonymousLikes
    });

  } catch (error) {
    console.error("Error toggling like:", error);
    res.status(500).json({ message: "Failed to toggle like" });
  }
}

// Delete a question
export async function deleteQuestion(req, res) {
  try {
    const { questionId } = req.params;
    let { userId } = req.body;

    const userIP = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const identifier = userId || `Anonymous_${userIP}`;

    const questionsCollection = db.collection("questions");
    const usersCollection = db.collection("users");

    const question = await questionsCollection.findOne({ _id: new ObjectId(questionId) });
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    let adminUser = null;
    if (userId) {
      adminUser = await usersCollection.findOne({ googleId: userId, status: "admin" });
    }
    const isAdmin = !!adminUser;

    console.log("🧾 Backend received userId:", userId);
console.log("🧾 Resolved identifier:", identifier);
console.log("📌 Question.authorId:", question.authorId);
console.log("🔐 isAdmin:", isAdmin);


    if (question.authorId === identifier || isAdmin) {
      await questionsCollection.deleteOne({ _id: new ObjectId(questionId) });
      return res.status(200).json({ message: "Question deleted successfully" });
    }

    return res.status(403).json({ message: "You are not allowed to delete this question" });
   
  } catch (error) {
    console.error("Error deleting question:", error);
    res.status(500).json({ message: "Failed to delete question" });
  }
}
