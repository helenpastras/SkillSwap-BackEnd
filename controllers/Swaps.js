const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

router.get('/swaps', (req, res) => {
  
  const token = jwt.sign({ user }, process.env.JWT_SECRET);
  
  res.json({ token });
});

// router.post('/verify-boken', (req, res) => {
//   const boken = req.headers.authorization.split(' ')[1];
//   try {
//     const decoded = jwt.verify(boken, process.env.JWT_SECRET);
    
//     res.json({ decoded });
//   } catch (err) {
//     res.status(401).json({ err: 'Invalid boken.' });
//   }
// });

module.exports = router;
