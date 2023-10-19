import { printLine } from './modules/print';

console.log('Content script works!');
console.log('Must reload extension for modifications to take effect.');

printLine("Using the 'printLine' function from the Print Module");

const getCurrentUserz = (sendResponse) => {
  const current_user = JSON.parse(window.sessionStorage.getItem('current_user'));

  // 获取周报日期
  // 所有页面下
  const titleDom = document.querySelector('.title-wrap .title');
  // 我的页面下
  const myTtitleDom = document.querySelector('.right-panel-header .right-panel-header-title .title');
  let weeklyDate = [];

  if (titleDom) {
    weeklyDate = titleDom.innerHTML.split('(')[1]?.split(')')[0]?.split('- ');
  } else if (myTtitleDom) {
    weeklyDate = myTtitleDom.innerHTML.split('(')[1]?.split(')')[0]?.split('- ');
  }

  if (current_user) {
    sendResponse && sendResponse(true)
  } else {
    sendResponse && sendResponse(false)
  }

  chrome.storage.local.set({
    current_user,
    weeklyDate
  });
}

chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  if (request.type === 'GET_CURRENT_USER') {
    getCurrentUserz(sendResponse)
  }
});

getCurrentUserz()
