import React from 'react';

import instance from '../../../utils/apis';

import logo from '../../assets/img/icon-34.png';
import { Button, message } from 'antd';
import dayjs from 'dayjs';
// import { CloseOutlined } from '@ant-design/icons';
import './Popup.css';

const Popup = () => {
  const fetchViews = (info) => {
    return new Promise((resolve) => {
      const { current_user } = info
      if (!current_user) {
        message.error('请先获取个人信息')
        return
      }

      instance.get('UserSetting/getViews?funcCode=0704&type=02', {
        headers: {
          uuid: current_user.uuid
        }
      }).then((res) => {
        const myView = (res?.data?.data || []).filter((item) => item.subType === "所有的")
        resolve(fetchManHours(info, myView?.[0]))
      })
    })
  }

  // 获取工时
  const fetchManHours = (info, myView) => {
    return new Promise((resolve, reject) => {
      const { current_user, weeklyDate } = info
      if (!current_user) {
        message.error('请先获取个人信息')
        return
      }

      const start_time = dayjs().startOf('week').add(1, 'day').format('YYYY/MM/DD');
      const end_time = dayjs().endOf('week').add(1, 'day').format('YYYY/MM/DD')

      const factor = JSON.stringify({
        "conditionRelation": "and",
        "conditionList": [
          { "field": "WorkTime.[Department]", "relation": "In", "value": "" },
          { "field": "WorkTime.WorkDate", "relation": "betweenAnd", "value": { "begin": weeklyDate[0] || start_time, "end": weeklyDate[1] || end_time } },
          { "field": "WorkTime.UserAccount", "relation": "In", "value": current_user.operator_id }
        ]
      })
      instance.post('UserSetting/maintain', {
        "action": "query",
        "id": myView.id,
        "type": "01",
        "menuCode": myView.menuCode,
        "pageNum": 1,
        "pageSize": 200,
        "factor": factor,
        "showAllNodes": "Y"
      }, {
        headers: {
          uuid: current_user.uuid
        }
      }).then((res) => {
        resolve(res.data)
      }).catch((err) => {
        reject(err)
      })
    })
  }

  // 拉取工时
  const getManHours = () => {
    chrome.storage.local.get(['current_user', 'weeklyDate']).then((res) => {
      fetchViews(res).then((res) => {
        const data = res.data;

        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
          chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            args: [{ msg: data, url: tabs[0].url }],
            func: (args) => {
              const rows = args.msg.rows;
              let htmlDom = '';
              const tableWrapper = document.getElementsByClassName('full-screen')[0]?.querySelector('.tableWrapper tbody');

              const myTableWrapper = document.getElementsByClassName('milkdown-menu-wrapper')[0]?.querySelector('.tableWrapper tbody');

              // eslint-disable-next-line array-callback-return
              rows.map((item) => {
                const { res5, res9, res13 } = item;


                if (res5?.includes('休假') || res5?.includes('技术管理') || res9?.includes('周会') || res9?.includes('站会')) {
                  return false;
                }

                let trContent = `
                  <tr>
                    <td style="text-align: left">
                      <div class="milkdown-cell-left ProseMirror-widget" contenteditable="false"></div>
                      <p class="paragraph">${res13 || ''}-${res5 || '-'}</p>
                    </td>
                    <td style="text-align: left">
                      <p class="paragraph">${res9 || '-'}</p>
                    </td>
                    <td style="text-align: left">
                      <p class="paragraph">100%</p>
                    </td>
                  </tr>
                 `;

                htmlDom += trContent;
              })

              htmlDom = `<tr>
                <th style="text-align: left">
                  <p class="paragraph">任务</p>
                </th>
                <th style="text-align: left">
                  <p class="paragraph">计划完成</p>
                </th>
                <th style="text-align: left">
                  <p class="paragraph">实际完成情况</p>
                </th>
              </tr>` + htmlDom;

              if ((!tableWrapper && !myTableWrapper) || !args.url?.includes('staffReportMgt')) {
                window.alert('请先进入周报填报编辑界面');
                return
              }

              (tableWrapper || myTableWrapper).innerHTML = '';

              setTimeout(() => {
                (tableWrapper || myTableWrapper).innerHTML = htmlDom;
              }, 30)

            },
          });
        });
      })
    }).catch((err) => {
      message.error(err.message || '拉取工时失败');
    })

  }

  // 拉取个人信息
  const getCurrentUser = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs[0].url.includes('rims.croot.com')) {
        message.error('此网站不是Rims系统')
      } else {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'GET_CURRENT_USER',
        }, (res) => {
          if (chrome.runtime.lastError?.message === 'Could not establish connection. Receiving end does not exist.') {
            message.error('你需要重新加载该页面才能使用。请重新加载页面后再试一次')
          } else if (res) {
            message.success('拉取个人信息成功')
          } else {
            message.error('拉取个人信息失败')
          }
        });
      }
    });
  }

  return (
    <div className='root-wrapper'>
      <div className='root-header'>
        <img src={logo} alt="rootnet logo" />
        <div>
          rims工时拉取
        </div>
      </div>
      <Button type="primary" block onClick={getCurrentUser} disabled={false}>
        获取个人信息
      </Button>
      <Button type="primary" block onClick={getManHours} disabled={false}>
        拉取工时内容
      </Button>
      {/* <div onClick={getManHours} className='root-closeWrapper'>
        <CloseOutlined />
      </div> */}
    </div>
  );
};

export default Popup;
