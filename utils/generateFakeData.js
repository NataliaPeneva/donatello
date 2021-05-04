const faker = require("faker");

const tags = [
  "Art&Music",
  "Product",
  "Social",
  "Technology",
  "Sports",
  "Games",
  "Kids",
  "Fashion",
  "Health",
  "Community",
  "Sustainability",
  "Education",
  "Startup",
];

const randomIndex = (max) => Math.floor(Math.random() * max);

const fakeUser = () => {
  return {
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    email: faker.internet.email(),
    password: faker.internet.password(8),
    bankAccount: faker.finance.iban(),
  };
};

const fakeProject = (userId) => {
  return {
    projectName: faker.company.bsBuzz(),
    projectDescription: faker.company.catchPhrase(),
    userId,
  };
};

const fakeTags = () => {
  return [tags[randomIndex(12)], tags[randomIndex(12)]];
};

const fakeDonation = (projectId) => {
  return {
    donationAmount: faker.datatype.number(1000),
    projectId,
  };
};

module.exports = { fakeUser, fakeProject, fakeTags, fakeDonation };
