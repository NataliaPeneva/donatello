const { Router } = require("express");

const router = new Router();
const { authenticateToken } = require("../middlewares/auth");
const { Projects, Donations, Tags, ProjectsTags } = require("../models");
const { userIdVerification } = require("../middlewares/userVerification");
const { findUserById } = require("../services/userService");
const { findProjectById } = require("../services/projectService");
const { findDonationById } = require("../services/donationService");

// - Get the 10 most recent projects (x number per page)
// - Get the 10 most funded projects based on amount
// - Get the 10 most popular projects based on number of transactions

router.get("/", async (req, res) => {
  const reqLimit = req.query.limit;
  const offset = req.query.offset || 0;

  // const sortOptions = {
  //   date: sortedByDate,
  //   donationAmount: sortedByDonationAmount
  // }

  try {
    const sortedByDate = await Projects.findAll({
      limit: reqLimit || 10,
      offset: offset || 0,
      order: [["updatedAt", "DESC"]],
    });
    const sortedByDonationAmount = await Projects.findAll({
      include: {
        model: Donations,
        as: "donations",
        // where: fn("sum", col("donationAmount")),
        // where: Donations.sum("donationAmount"),
      },
    });
    if (req.query.sortBy) {
      // const sortingFunc = sortOptions[date] || sortOptions[donationAmount]
      res.json({ sortedByDate });
    }

    // const whatSum = await Projects.sum("donationAmount")
    // console.log("SUM:", whatSum)
    // const sortedByDonation = await Projects.findAll({
    //   limit: 10,
    //   order: [[Projects.associations.Donations, "donationAmount", "DESC"]],
    // })
    // return res.json({ groupedDonations })
  } catch (error) {
    console.log("ERROR:", error);
    return res.status(500).json(error);
  }
});

router.get("/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const projects = await Projects.findAll({ where: { userId } });
    return res.json(projects);
  } catch (err) {
    return res.status(500).json(err);
  }
});

router.get("/:projectId/donations", async (req, res) => {
  const { projectId } = req.params;
  try {
    const project = await findProjectById(projectId);
    const donations = await findDonationById(projectId);
    const response = { project, donations };
    return res.json(response);
  } catch (err) {
    return res.status(500).json(err);
  }
});

router.post(
  "/:userId",
  authenticateToken,
  userIdVerification,
  async (req, res) => {
    const { projectName, projectDescription } = req.body.project;
    // console.log("projectName: ", projectName)
    const tagIds = req.body.tagIds;
    // const userId = await getVerifiedUserId(req, res)
    const { userId } = req.params;

    console.log(tagIds);
    // returns either an undefined or the actual token.
    try {
      const user = await findUserById(userId);

      const project = await Projects.create({
        projectName,
        projectDescription,
        userId: user.id,
      });

      // Issues:
      // 1. In the test our tagIds were undefined (issue with fake data)
      // 2. Model name was plural, should be singular
      // 3. Created at and Updated were not being added when calling project.addTags
      const projectTagData = await project.addTags(tagIds);

      return res.json({ ...project.dataValues, projectTags: projectTagData });
    } catch (err) {
      console.log(err);
      return res.status(500).json(err.message);
    }
  }
);

// this should return a redirect url for the payment
router.post("/:projectId/donations/", async (req, res) => {
  const { projectId, donationAmount, comment } = req.body;
  try {
    const project = await findProjectById(projectId);

    const donation = await Donations.create({
      projectId: project.id,
      donationAmount,
      comment,
    });
    return res.json(donation);
  } catch (error) {
    return res.status(500).json(error);
  }
});

router.patch("/:projectId", authenticateToken, async (req, res) => {
  const { projectId } = req.params;
  const reqProject = req.body;
  try {
    const project = await Projects.findOne({
      where: { id: projectId },
    });
    // const project = await findProjectById(projectId)
    // console.log("Project?", project)
    const updatedProject = await project.update({ ...reqProject });
    return res.json(updatedProject);
  } catch (err) {
    return res.status(500).json(err);
  }
});

router.delete("/:projectId", authenticateToken, async (req, res) => {
  const projectId = req.params.projectId;
  try {
    await Projects.destroy({ where: { id: projectId } });
    return res.status(204).json({ message: "Project deleted." });
  } catch (err) {
    return res.status(500).json({ error: "Something went wrong" });
  }
});

module.exports = router;
