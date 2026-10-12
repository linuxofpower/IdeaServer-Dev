import express from 'express';
import { createQuestion, getQuestions, getQuestion,
	     likeQuestion, deleteQuestion } from '../ctrls/questCtrl.js';
import {answerQuestion, likeAnswer, deleteAnswer } from '../ctrls/answCtrl.js';
//~ import { verifyToken } from '../middl/verify.js';
import { canDeleteQuest, canDeleteAnswer  } from "../middl/verify.js";

const router = express.Router();

// Routes for questions  
router.post('/new', createQuestion);
router.get('/:questionId', getQuestion);
router.post('/:questionId/like', likeQuestion);
router.get('/', getQuestions); // Public route
router.delete('/:questionId', canDeleteQuest, deleteQuestion)

// Routes for answers  
router.post('/:questionId/answers', answerQuestion);
router.post('/:questionId/answers/:answerId/like', likeAnswer);
router.delete('/:questionId/answers/:answerId', canDeleteAnswer, deleteAnswer);
export default router;
