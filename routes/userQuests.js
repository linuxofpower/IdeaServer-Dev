import express from 'express';
import {
  createPersonalQuestion,
  answerPersonalQuestion,
  deletePersonalQuestion
} from '../ctrls/questUserCtrl.js';
import {
  canDeletePersonalQuestion } from '../middl/verify.js';


const router = express.Router();

// ✅ Create a personal question (anonymous to a user)
router.post('/new', createPersonalQuestion); // No auth needed

// ✅ Answer a question (authorized via userId in body)
router.patch('/answer/:questionId', answerPersonalQuestion);

// ✅ Delete a question (authorized via userId or IP in body)
router.delete('/:questionId', canDeletePersonalQuestion, 
                              deletePersonalQuestion); // No token middleware

export default router;
