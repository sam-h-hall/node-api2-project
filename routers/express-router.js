const express = require("express");
const router = express.Router();
const DBMethods = require("../data/db.js");
const Joi = require("joi");

const serverError = "Server error retrieving posts.";

const validatePost = (post, type) => {
  let schema;
  if (type === "post") {
    schema = Joi.object({
      title: Joi.string().required(),
      contents: Joi.string().required()
    });
  } else if (type === "comment") {
    schema = Joi.object({
      text: Joi.string().required()
    });
  }

  const options = {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true
  };

  const {
    error,
    value
  } = schema.validate(post, options);

  if (error) {
    return false;
  } else {
    return true;
  }
}

// GET "/api/posts"
router.get("/", (req, res) => {
  DBMethods.find()
    .then((posts) => {
      res.status(200).json(posts);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        message: serverError,
      });
    });
});

// GET "/api/posts/:id"
router.get("/:id", (req, res) => {
  const {
    id
  } = req.params;
  DBMethods.findById(id)
    .then((post) => {
      if (post) {
        res.status(200).json(post);
      } else {
        res.status(404).json({
          message: `Post with id "${id}" not found.`,
        });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        message: serverError,
      });
    });
});

// GET "/api/posts/:id/comments"
router.get("/:id/comments", (req, res) => {
  const {
    id
  } = req.params;
  DBMethods.findPostComments(id)
    .then((comment) => {
      if (comment) {
        res.status(200).json(comment);
      } else {
        res.status(404).json({
          message: `Comments on post with id: "${id}" could not be found.`,
        });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        message: serverError,
      });
    });
});

// POST "/api/posts"
router.post("/", (req, res) => {
  const post = req.body;
  if (validatePost(post, "post")) {
    DBMethods.insert(post)
      .then((p) => {
        res.status(201).json(post);
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({
          error: "There was an error while saving the post to the database",
        });
      });
  } else {
    res.status(400).json({
      errorMessage: "Please provide title and contents for the post"
    })
  }
});

// POST "/api/posts/:id/comments"
router.post("/:id/comments", (req, res) => {
  const {
    id
  } = req.params;
  const comment = req.body;
  if (validatePost(comment, "comment")) {
    DBMethods.findById(id)
      .then(match => {
        comment.post_id = id;
        DBMethods.insertComment(comment)
          .then(c => {
            res.status(201).json(c);
          })
          .catch(err => {
            console.log(err);
            res.status(500).json({
              error: "There was an error while saving the comment to the database"
            })
          })
      })
      .catch(err => {
        res.status(404).json({
          message: "The post with the specified id does not exist"
        })
      })
  } else {
    res.status(400).json({
      errorMessage: "Please provide text for the comment"
    })
  }
});

// DELETE "/api/posts/:id"
router.delete("/:id", (req, res) => {
  const {
    id
  } = req.params;
  let post;
  DBMethods.findById(id).then((p) => {
    if (p) {
      post = p;
    }
  });
  DBMethods.remove(id, post)
    .then((p) => {
      if (p) {
        res.status(200).json(post);
      } else {
        res.status(500).json({
          error: "The post could not be removed"
        });
      }
    })
    .catch((err) => {
      console.log(err);
      res.json(404).json({
        errorMessage: `Post with id ${id} could not be found.`,
      });
    });
});

// clean this up and get it working
router.put("/:id", (req, res) => {
  const {
    id
  } = req.params;
  const changes = req.body;
  if (validatePost(changes, "post")) {
    DBMethods.findById(id)
      .then((match) => {
        DBMethods.update(id, changes)
          .then(post => {
            res.status(200).json(changes);
          })
          .catch(err => {
            console.log(err);
            res.status(500).json({
              message: `There was an error updating the post with id ${id}`
            });
          });
      })
      .catch(err => {
        console.log(err);
        res.status(404).json({
          message: "The post with the specified id does not exist"
        });
      });
  } else {
    res.status(400).json({
      errorMessage: "Please provide title and contents for the post."
    })
  }
});

module.exports = router;