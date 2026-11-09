const express = require('express');
const familyMemberController = require('../controllers/familyMember.controller');
const asyncHandler = require('../utils/asyncHandler');
const { authenticateToken } = require('../middleware/validateAuth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: FamilyMembers
 *   description: User family members and health profiles
 */

/**
 * @swagger
 * /api/family-members:
 *   get:
 *     summary: List family members for authenticated user
 *     tags: [FamilyMembers]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Family members fetched successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticateToken, asyncHandler(familyMemberController.listFamilyMembers));

/**
 * @swagger
 * /api/family-members:
 *   post:
 *     summary: Create a family member profile
 *     tags: [FamilyMembers]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: Family member created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticateToken, asyncHandler(familyMemberController.createFamilyMember));

/**
 * @swagger
 * /api/family-members/{id}:
 *   put:
 *     summary: Update a family member profile
 *     tags: [FamilyMembers]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Family member updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Family member not found
 */
router.put('/:id', authenticateToken, asyncHandler(familyMemberController.updateFamilyMember));

module.exports = router;
