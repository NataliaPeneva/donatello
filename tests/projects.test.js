const app = require("../app")
const supertest = require("supertest")
const request = supertest(app)
const db = require("../models")
const { generateToken } = require("../utils/generateToken")
const {
  fakeUser,
  fakeProject,
  fakeDonation,
  fakeTags,
} = require("../utils/generateFakeData")

// setup
beforeEach(async () => {
  await db.ProjectTag.destroy({ where: {} })
  await db.Tag.destroy({ where: {} })
  await db.Donation.destroy({ where: {} })
  await db.Project.destroy({ where: {} })
  await db.User.destroy({ where: {} })
})
// tear down
afterAll(async () => {
  await db.ProjectTag.destroy({ where: {} })
  await db.Tag.destroy({ where: {} })
  await db.Donation.destroy({ where: {} })
  await db.Project.destroy({ where: {} })
  await db.User.destroy({ where: {} })
  await db.sequelize.close()
})

describe("/projects (get)", () => {
  test("should return 8 projects sorted by date", async (done) => {
    // arrange
    const limit = 8
    const offset = 0
    const sortBy = "recent"
    // const sortBy = "date"
    const { id: userId } = await db.User.create(fakeUser())

    for (i = 0; i < 10; i++) {
      await db.Project.create(fakeProject(userId))
    }

    // act
    const responseProject = await request
      .get("/projects")
      .query({ limit, offset, sortBy })
      .send()

    // assert
    expect(responseProject.body).toBeDefined()
    expect(responseProject.status).toBe(200)
    const responseLength = responseProject.body.sortedProjects.length
    expect(responseLength).toBe(8)
    done()
  })
  test("should return 8 projects sorted alphabetically", async (done) => {
    // arrange
    const limit = 8
    const offset = 0
    const sortBy = "alphabetically"
    // const sortBy = "date"
    const { id: userId } = await db.User.create(fakeUser())

    for (i = 0; i < 10; i++) {
      await db.Project.create(fakeProject(userId))
    }
    await db.Project.create({
      projectName: "AAAAAA",
      projectDescription: "first!",
      userId: userId,
    })

    // act
    const responseProject = await request
      .get("/projects")
      .query({ limit, offset, sortBy })
      .send()

    // assert
    expect(responseProject.body).toBeDefined()
    expect(responseProject.status).toBe(200)
    const responseLength = responseProject.body.sortedProjects.length
    expect(responseLength).toBe(8)
    expect(responseProject.body.sortedProjects[0].projectName).toBe("AAAAAA")
    done()
  })
})

describe("/projects/:userId (post)", () => {
  test("should create a new project when sent valid access token, project name & desc, & tagIds", async (done) => {
    // arrange
    const { id: userId } = await db.User.create(fakeUser())
    const token = generateToken({ userId })
    const tagNames = fakeTags()
    const project = fakeProject(userId)
    const tags = await db.Tag.bulkCreate(
      tagNames.map((tagName) => ({ tag: tagName }))
    )

    const body = {
      project,
      tagIds: tags.map((tag) => tag.id),
    }

    // act
    const responseProject = await request
      .post("/projects/" + userId)
      .set("Authorization", `Bearer ${token}`)
      .send(body)

    // assert
    expect(responseProject.body.ProjectTags).toHaveLength(2)
    expect(responseProject.status).toBe(200)
    done()
  })

  test.todo(
    ""

    // test("should NOT create a new project when sent a malformed access token", async (done) => {
    //   const user = await fakeUser()
    //   const newUser = await db.User.create(user)
    //   const userId = newUser.id
    //   // create a body with all the mandatory project data
    //   const body = fakeProject(userId)

    //   // act
    //   // send "bla" in the authorization header
    //   const responseProject = await request
    //     .post("/projects")
    //     .set("Authorization", `Bearer "bla"`)
    //     .send(body)

    //   // assert
    //   expect(responseProject.status).toBe(401)

    //   done()
    // })

    // test("should NOT create a new project when sent an expired access token", async (done) => {
    //   // arrange
    //   // create a new token using jwt sign -> .sign(payload, secret, { expiresIn: '-10s' }
    //   const user = await fakeUser()
    //   const newUser = await db.User.create(user)
    //   const userId = newUser.id
    //   const body = fakeProject(userId)

    //   const userIdObj = { userId }
    //   const token = jwt.sign(userIdObj, process.env.TOKEN_SECRET, {
    //     expiresIn: "-10s",
    //   })

    //   // act
    //   // send the expired token in the authorization header
    //   const responseProject = await request
    //     .post("/projects")
    //     .set("Authorization", `Bearer ${token}`)
    //     .send(body)

    //   // assert
    //   // status 401
    //   expect(responseProject.status).toBe(401)

    //   done()
    // })
  )
})

describe("/projects/:projectId (patch)", () => {
  test("should return an updated project", async (done) => {
    // arrange
    const { id: userId } = await db.User.create(fakeUser())
    const { id: projectId } = await db.Project.create(fakeProject(userId))
    const token = generateToken({ userId })

    const body = {
      projectName: "New project",
      projectDescription: "Let's see if this works!",
    }

    // act
    const responseUpdatedProject = await request
      .patch("/projects/" + projectId)
      .set("Authorization", `Bearer ${token}`)
      .send(body)

    // assert
    expect(responseUpdatedProject.body).toBeDefined()
    // expect(responseUpdatedProject.body).toBe(null)
    expect(responseUpdatedProject.status).toBe(200)
    const responseProjectName = responseUpdatedProject.body.projectName
    expect(responseProjectName).toBe(body.projectName)
    done()
  })
  test("should return an error if user tries to update something they shouldn't", async (done) => {
    // arrange
    const { id: userId } = await db.User.create(fakeUser())
    const { id: projectId } = await db.Project.create(fakeProject(userId))
    const token = generateToken({ userId })

    const body = {
      projectName: "New project",
      projectDescription: "Let's see if this works!",
      somethingElse: "blaaa",
    }

    // act
    const responseUpdatedProject = await request
      .patch("/projects/" + projectId)
      .set("Authorization", `Bearer ${token}`)
      .send(body)

    // assert
    expect(responseUpdatedProject.body).toBeDefined()
    const expectedResponse =
      "somethingElse can't be updated. Only projectName and projectDescription can be updated."
    expect(responseUpdatedProject.body.message).toBe(expectedResponse)
    expect(responseUpdatedProject.status).toBe(403)
    done()
  })
})

describe("/projects/:projectId/tags (post)", () => {
  test("should return an updated tag", async (done) => {
    // arrange
    const { id: userId } = await db.User.create(fakeUser())
    const tagNames = fakeTags()

    const tags = await db.Tag.bulkCreate(
      tagNames.map((tagName) => ({ tag: tagName }))
    )
    const tagIds = tags.map((tag) => tag.id)
    const projectDBCreated = await db.Project.create(fakeProject(userId))

    const projectId = projectDBCreated.id
    const body = {
      tagIds,
    }
    const token = generateToken({ userId })

    // act
    const responseUpdatedTags = await request
      .post("/projects/" + projectId + "/tags")
      .set("Authorization", `Bearer ${token}`)
      .send(body)

    // assert
    expect(responseUpdatedTags.body).toBeDefined()
    expect(responseUpdatedTags.body).toHaveLength(2)
    expect(responseUpdatedTags.body[0].projectId).toBe(projectId)
    expect(responseUpdatedTags.status).toBe(200)
    done()
  })
})

describe("/projects/:projectId/donations (post)", () => {
  test("should return a new donation", async (done) => {
    // arrange
    const { id: userId } = await db.User.create(fakeUser())
    const projectDBCreated = await db.Project.create(fakeProject(userId))

    const projectId = projectDBCreated.id
    const body = {
      donationAmount: "2.00",
      comment: "TEST",
    }

    // act
    const responseDonation = await request
      .post("/projects/" + projectId + "/donations/")
      .send(body)

    // assert
    expect(responseDonation.body).toBeDefined()
    expect(responseDonation.status).toBe(200)
    done()
  })
})

describe("/projects/:projectId/tags/:tagId (delete)", () => {
  test("should return 204 if successful", async (done) => {
    // arrange
    const { id: userId } = await db.User.create(fakeUser())
    const tagNames = fakeTags()

    const tags = await db.Tag.bulkCreate(
      tagNames.map((tagName) => ({ tag: tagName }))
    )
    const tagIds = tags.map((tag) => ({ tagId: tag.id }))
    const projectDBCreated = await db.Project.create(
      {
        ...fakeProject(userId),
        ProjectTags: tagIds,
      },
      { include: [db.ProjectTag] }
    )

    const projectId = projectDBCreated.id
    const tagId = projectDBCreated.ProjectTags[0].tagId
    const token = generateToken({ userId })

    //act
    const responseDeletedProject = await request
      .delete(`/projects/${projectId}/tags/${tagId}`)
      .set("Authorization", `Bearer ${token}`)
      .send()

    // assert
    expect(responseDeletedProject.status).toBe(204)
    done()
  })
})

describe("/projects/:projectId (delete)", () => {
  test("should return 204 if successful", async (done) => {
    // arrange
    const { id: userId } = await db.User.create(fakeUser())
    const { id: projectId } = await db.Project.create(fakeProject(userId))
    const token = generateToken({ userId })

    //act
    const responseDeletedProject = await request
      .delete("/projects/" + projectId)
      .set("Authorization", `Bearer ${token}`)
      .send()

    // assert
    expect(responseDeletedProject.status).toBe(204)
    done()
  })
})

describe("/projects/:userId (get)", () => {
  test("should return all projects for a specific user", async (done) => {
    // arrange
    const { id: userId } = await db.User.create(fakeUser())
    const createProject = await db.Project.create(fakeProject(userId))

    // act
    const responseProject = await request.get("/projects/" + userId).send()

    // assert
    expect(responseProject.body).toBeDefined()
    expect(responseProject.status).toBe(200)
    done()
  })
  test.todo(
    "/projects/:userId should return an error if the user doesn't have any projects"
  )
})