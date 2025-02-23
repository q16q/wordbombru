"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const api_1 = __importDefault(require("./api"));
const router = (0, express_1.Router)();
// Base routes
router.get('/', (req, res) => {
    res.json({ status: 'ok' });
});
// API routes
router.use('/api', api_1.default);
exports.default = router;
