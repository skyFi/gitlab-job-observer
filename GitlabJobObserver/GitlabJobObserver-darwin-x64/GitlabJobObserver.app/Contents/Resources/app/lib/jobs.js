const axios = require('./axios');
const _ = require('lodash');
const notification = require('./notification');

module.exports = function(callback = () => {}) {
  const list = [];
  console.log(require('./var').getProjectIds());
  if (require('./var').getPrivateToken()) {
    require('./var').getProjectIds().forEach((id) => {
      list.push(new Promise((resolve, reject) => {
        axios.get(`/projects/${id}/jobs`, {
          params: {
            scope: ['created', 'pending', 'running']
          },
          headers: {'Private-Token': require('./var').getPrivateToken()}
        }).then((rsp) => {
          const data = rsp.data || [];
          const group = _.groupBy(data, d => d.status);
          resolve({
            id, group
          })
        }, (error) => {
          console.error(error);
          reject(error);
          errorHandle(error);
        }).catch((error) => {
          console.error(error);
          reject(error);
          errorHandle(error);
        })
      }));
    });
  }
  Promise.all(list).then(function(values) {
    callback(values);
  });
}

function errorHandle(error) {
  notification({
    title: '错误',
    body: error.stack || error,
  });
}
