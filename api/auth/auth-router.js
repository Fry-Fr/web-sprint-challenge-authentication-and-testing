const router = require('express').Router();
const bcrypt = require('bcrypt');
const User = require('../users/users-model');
const tokenBuilder = require('./tokenBuilder');

const validRequest = (req, res, next) => {
  const { username, password } = req.body;
  const valid = Boolean(username, password);

  if (valid) {
    next();
  }else {
    next({ status: 422, message: "username and password required" })
  }
};

const validUsername = async (req, res, next) => {
  const { username } = req.body;
  const valid = await User.findBy(username);

  if (valid) {
    next({ status: 422, message: "username taken" });
  }else {
    next();
  }
};

router.post('/register', validRequest, validUsername, (req, res, next) => {
      let user = req.body;

      const rounds = process.env.BCRYPT_ROUNDS || 8;
      const hash = bcrypt.hashSync(user.password, rounds);

      user.password = hash;

      User.registerUser(user)
      .then(newUser => {
        res.status(201).json(newUser);
      })
      .catch(err => next(err))

});

router.post('/login', validRequest, (req, res, next) => {
      let { username, password } = req.body;

      User.findBy(username)
      .then(user => {
        if (user && bcrypt.compareSync(password, user.password)) {
          const token = tokenBuilder(user);

          res.status(200).json({
            message: `welcome, ${user.username}`,
            token: token,
          });
        }else {
          next({ status: 401, message: "invalid credentials" })
        }
      })
      .catch(err => next(err))
});

module.exports = router;
