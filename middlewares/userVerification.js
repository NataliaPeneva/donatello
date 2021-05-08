require("dotenv").config()
const jwt = require("jsonwebtoken")
const { findProjectById } = require("../services/projectService")

const userIdFromToken = (headers) => {
  const authHeader = headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]
  const decoded = jwt.verify(token, process.env.TOKEN_SECRET)
  return decoded.userId
}

const userIdVerification = async (req, res, next) => {
  const userIdFromReq = req.params.userId
  const userId = await userIdFromToken(req.headers)
  if (userIdFromReq !== userId)
    return res.status(401).json("user Id is different")
  next()
}

const userIdVerificationFromProject = async (req, res, next) => {
  const { projectId } = req.params
  const project = await findProjectById(projectId)
  const userIdFrProject = project.userId
  const userIdFrToken = await userIdFromToken(req.headers)
  if (userIdFrProject !== userIdFrToken)
    return res.status(401).json("user Id is different")
  req.project = project
  next()
}

module.exports = { userIdVerification, userIdVerificationFromProject }
