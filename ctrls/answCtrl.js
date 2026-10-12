import db from "../conn.js";
import { ObjectId } from "mongodb";

// Add an answer to a question
export async function answerQuestion(req, res) {
  try {


    const { content, userId, name } = req.body;

    const { questionId } = req.params;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: "Answer cannot be empty" });
    }

    const ipAddress = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const identifier = userId || `Anonymous_${ipAddress}`;
    const displayName = name || "Anonymous";


    const questionsCollection = db.collection("questions");
    const question = await questionsCollection.findOne({ _id: new ObjectId(questionId) });
    if (!question) return res.status(404).json({ message: "Question not found" });

    const newAnswer = {

      _id: new ObjectId(),
      content: content.trim(),
      authorId: identifier,
      authorName: displayName,
      createdAt: new Date(),
      likes: 0,
      likedBy: [],
      anonymousLikes: [],

    };

    await questionsCollection.updateOne(
      { _id: new ObjectId(questionId) },
      { $push: { answers: newAnswer } }
    );

    res.status(201).json(newAnswer);
  } catch (error) {
    console.error("Error creating answer:", error);
    res.status(500).json({ message: "Failed to create answer" });
  }
}

// Like or unlike an answer
export async function likeAnswer(req, res) {
  try {
    const { questionId, answerId } = req.params;
    let { userId } = req.body;

    if (!userId) {

      const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
      userId = `Anonymous_${ip}`;
    }


    const questionsCollection = db.collection("questions");
    const question = await questionsCollection.findOne({ _id: new ObjectId(questionId) });
    if (!question) return res.status(404).json({ message: "Question not found" });

    const answerIndex = question.answers.findIndex(ans => ans._id.equals(new ObjectId(answerId)));
    if (answerIndex === -1) return res.status(404).json({ message: "Answer not found" });

    const answer = question.answers[answerIndex];

    answer.likedBy = answer.likedBy || [];
    answer.anonymousLikes = answer.anonymousLikes || [];
    answer.likes = typeof answer.likes === "number" ? answer.likes : 0;

    const isAnonymous = userId.startsWith("Anonymous_");
    const hasLiked = isAnonymous
      ? answer.anonymousLikes.includes(userId)
      : answer.likedBy.includes(userId);

    if (hasLiked) {
      answer.likes = Math.max(0, answer.likes - 1);
      if (isAnonymous) {
        answer.anonymousLikes = answer.anonymousLikes.filter(id => id !== userId);
      } else {
        answer.likedBy = answer.likedBy.filter(id => id !== userId);
      }
    } else {
      answer.likes += 1;
      if (isAnonymous) {

        answer.anonymousLikes.push(userId);
      } else {
        answer.likedBy.push(userId);
      }
    }

    await questionsCollection.updateOne(
      { _id: new ObjectId(questionId), "answers._id": new ObjectId(answerId) },

      {
        $set: {
          [`answers.${answerIndex}.likes`]: answer.likes,
          [`answers.${answerIndex}.likedBy`]: answer.likedBy,
          [`answers.${answerIndex}.anonymousLikes`]: answer.anonymousLikes,
        },
      }
    );

    res.status(200).json(answer);
  } catch (error) {
    console.error("Error toggling like:", error);
    res.status(500).json({ message: "Failed to toggle like" });
  }
}

// Delete an answer
export async function deleteAnswer(req, res) {
  try {
    const { questionId, answerId } = req.params;
    const { userId } = req.body;

    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const identifier = userId || `Anonymous_${ip}`;

    const questionsCollection = db.collection("questions");
    const question = await questionsCollection.findOne({ _id: new ObjectId(questionId) });
    if (!question) return res.status(404).json({ message: "Question not found" });

    const answer = question.answers.find(ans => ans._id.equals(new ObjectId(answerId)));
    if (!answer) return res.status(404).json({ message: "Answer not found" });

    const isOwner = answer.authorId === identifier;
    const isAdmin = userId === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "You are not allowed to delete this answer" });
    }

    await questionsCollection.updateOne(
      { _id: new ObjectId(questionId) },
      { $pull: { answers: { _id: new ObjectId(answerId) } } }
    );

    res.status(200).json({ message: "Answer deleted successfully" });
  } catch (error) {
    console.error("Error deleting answer:", error);
    res.status(500).json({ message: "Failed to delete answer" });
  }
}
