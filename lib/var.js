let projectIds = [911];
let privateToken = '';

module.exports = {
  setProjectIds: (ids) => {
    projectIds = ids;
  },
  getProjectIds: () => projectIds,
  setPrivateToken: (token) => {
    privateToken = token;
  },
  getPrivateToken: () => privateToken,
};
