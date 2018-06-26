import React, { Component } from 'react';
import _ from 'lodash';
import axios from '../lib/axios';

export default class App extends Component {
  constructor(props) {
    super(props);
    let privateToken = electron.require('./lib/var').getPrivateToken();
    if (!privateToken) {
      try {
        privateToken = localStorage.getItem('privateToken');
      } catch (error) {
        console.error(error);
      }
    }
    this.headers = {'Private-Token': privateToken };
    this.state = {
      projects: [],
      observerProjectIds: new Set(electron.require('./lib/var').getProjectIds()),
      projectInfo: new Map(),
      privateToken,
    };
    this.timer = null;
    this.planCount = {};
  }
  componentDidMount() {
    axios.get('/projects', { headers: this.headers, params: {
      // owned: true,
      membership: true,
      // starred: true,
      order_by: 'last_activity_at',
    }}).then((result) => {
      const projects = result.data || [];
      this.setState({ projects });
    })

    this.timer = setInterval(this.observe.bind(this), 1000);
  }
  componentWillUnmount() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
  handleObserverChange(id, e) {
    const value = e.target.checked;
    this.state.observerProjectIds[value ? 'add' : 'delete'](id);
    this.setState({
      observerProjectIds: this.state.observerProjectIds,
    }, () => {
      // 回调回主进程
      electron.require('./lib/var').setProjectIds(Array.from(this.state.observerProjectIds))

      if (this.timer) {
        clearInterval(this.timer);
        this.timer = setInterval(this.observe.bind(this), 1000);
      }
    })
  }
  observe() {
    const { observerProjectIds, projectInfo, projects } = this.state;

    for (let id of observerProjectIds) {
      axios.get(`/projects/${id}/jobs`, {
        params: {
          scope: ['created', 'pending', 'running']
        },
        headers: this.headers,
      }).then((rsp) => {
        const data = rsp.data || [];
        const group = _.groupBy(data, d => d.status);
        projectInfo.set(id, group);
        this.setState({ projectInfo });

        if (this.planCount[id] !== undefined && this.planCount[id] !== data.length && (data.length !== 0 || this.planCount[id] !== 0)) {
          const { Notification } = electron;
          const notification = new Notification({
            title: data.length === 0 ? '任务完成' : `有正在运行的任务: ${data.length}`,
            subtitle: (projects.filter(p => p.id === id)[0] || {}).name,
            body: Object.keys(group).map(k => `${k}:${group[k].map(g => g.name)}`).join(', '),
          });
          notification.show()
        }

        this.planCount[id] = data.length;
      })
    }
  }
  handlePrivateTokenChange(e) {
    const privateToken = e.target.value;
    if (privateToken.endsWith('#')) {
      electron.require('./lib/var').setPrivateToken(privateToken.slice(0, -1));
      this.headers = {'Private-Token': privateToken.slice(0, -1) };
      try {
        localStorage.setItem('privateToken', privateToken.slice(0, -1));
      } catch (error) {
        console.error(error);
      }
    }
    this.setState({ privateToken });
  }
  gotoJob(path_with_namespace, id) {
    electron.shell.openExternal(`http://code.smartstudy.com/${path_with_namespace}/-/jobs/${id}`);
  }
	render() {
    const { projects, observerProjectIds, projectInfo, privateToken } = this.state;
		return (
			<div className="container-box">
        <input type="password" value={privateToken} onChange={this.handlePrivateTokenChange.bind(this)} />
        {
          projects.map(p => {
            const group = projectInfo.get(p.id);
            console.log(p);
            return (
              <div key={p.id}>
                <input
                  type="checkbox"
                  data-id={p.id}
                  checked={observerProjectIds.has(p.id)}
                  onChange={this.handleObserverChange.bind(this, p.id)}
                />
                <span style={{ fontSize: '12px' }}>
                  {`${p.name_with_namespace}: ${p.id} (${p.description})`}
                </span>
                {
                  group ? (
                    <div style={{ margin: '10px 20px' }}>
                      {
                        Object.keys(group).map(k => (
                          <div key={k} style={{ margin: '10px 0' }} className={k}>
                            <span style={{ fontWeight: 'bold' }}>{k}</span>
                            <span style={{ fontWeight: 'bold' }}>{` => ${group[k].length}`}</span>
                            <div style={{ margin: '5px 16px' }}>
                              {
                                group[k].map(g => (
                                  <div
                                    key={`${k}_${g.id}`}
                                    onClick={this.gotoJob.bind(this, p.path_with_namespace, g.id)}
                                    className="item"
                                  >
                                    {`${g.name} (${g.ref}): ${Math.floor(g.duration/60)}m${Math.floor(g.duration%60)}s`}
                                  </div>
                                ))
                              }
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  ) : null
                }
              </div>
            );
          })
        }
      </div>
		);
	}
}
