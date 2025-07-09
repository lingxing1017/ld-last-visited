// ==UserScript==
// @name         ld-last-visited-topic
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Displays a floating popup showing the last topic you viewed before the current page refresh on linux.do.
// @author       Hygge
// @match        https://linux.do/latest*
// @match        https://linux.do/latest?order=created
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @run-at       document-idle
// ==/UserScript==


(function() {
    'use strict';

    // --- Toast Notification ---
    function showToast(msg, type = 'info') {
        const toast = document.createElement('div');
        toast.textContent = msg;
        toast.style.position = 'fixed';
        toast.style.left = '50%';
        toast.style.top = '24px';
        toast.style.transform = 'translateX(-50%)';
        toast.style.background = type === 'error' ? '#f44336' : (type === 'success' ? '#4caf50' : '#333');
        toast.style.color = '#fff';
        toast.style.padding = '10px 18px';
        toast.style.borderRadius = '6px';
        toast.style.fontSize = '15px';
        toast.style.zIndex = 99999;
        toast.style.boxShadow = '0 2px 16px rgba(0,0,0,0.18)';
        toast.style.opacity = '0.96';
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.transition = 'opacity 0.4s';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 400);
        }, 1700);
    }

    // --- WebDAV Credentials & Fixed File URL ---
    const DEFAULT_WEBDAV_FILE_URL = 'https://mori.teracloud.jp/dav/LinuxDo/ld-last-visited.json';
    function getWebdavFileUrl() {
        return GM_getValue('webdav_file_url', DEFAULT_WEBDAV_FILE_URL);
    }
    function getWebdavCreds() {
        return {
            username: GM_getValue('webdav_username', ''),
            password: GM_getValue('webdav_password', ''),
        };
    }

    // --- Tampermonkey Menus to Set WebDAV Username/Password Separately ---
    GM_registerMenuCommand('设置 WebDAV 用户名', async function() {
        const username = prompt('输入 WebDAV 用户名', GM_getValue('webdav_username', ''));
        if (username == null) return;
        GM_setValue('webdav_username', username);
        showToast('WebDAV 用户名已保存', 'success');
    });
    GM_registerMenuCommand('设置 WebDAV 密码', async function() {
        const password = prompt('输入 WebDAV 密码', GM_getValue('webdav_password', ''));
        if (password == null) return;
        GM_setValue('webdav_password', password);
        showToast('WebDAV 密码已保存', 'success');
    });
    GM_registerMenuCommand('设置 WebDAV 地址', async function() {
        const fileUrl = prompt('输入 WebDAV 文件 URL', GM_getValue('webdav_file_url', DEFAULT_WEBDAV_FILE_URL));
        if (fileUrl == null) return;
        GM_setValue('webdav_file_url', fileUrl);
        showToast('WebDAV 地址已保存', 'success');
    });
    // --- Popup for last post before refresh ---
    // --- WebDAV Upload ---
    function uploadToWebDAV() {
        const { username, password } = getWebdavCreds();
        if (!username || !password) {
            showToast('请先在菜单中设置 WebDAV 用户名/密码', 'error');
            return;
        }
        const last_post_id = GM_getValue('last_post_id', '');
        const last_post_title = GM_getValue('last_post_title', '');
        const data = JSON.stringify({ last_post_id, last_post_title });
        GM_xmlhttpRequest({
            method: "PUT",
            url: getWebdavFileUrl(),
            headers: {
                "Content-Type": "application/json"
            },
            data: data,
            anonymous: false,
            user: username,
            password: password,
            onload: function(resp) {
                if (resp.status >= 200 && resp.status < 300) {
                    showToast('上传成功', 'success');
                } else {
                    showToast('上传失败: ' + resp.status, 'error');
                }
            },
            onerror: function() {
                showToast('上传出错', 'error');
            }
        });
    }

    // --- WebDAV Download ---
    function downloadFromWebDAV(refreshPopup = true) {
        const { username, password } = getWebdavCreds();
        if (!username || !password) {
            showToast('请先在菜单中设置 WebDAV 用户名/密码', 'error');
            return;
        }
        GM_xmlhttpRequest({
            method: "GET",
            url: getWebdavFileUrl(),
            headers: { "Accept": "application/json" },
            anonymous: false,
            user: username,
            password: password,
            responseType: "json",
            onload: function(resp) {
                if (resp.status >= 200 && resp.status < 300) {
                    let json;
                    try {
                        json = resp.response || JSON.parse(resp.responseText);
                    } catch (e) {
                        showToast('下载内容解析失败', 'error');
                        return;
                    }
                    if (json && json.last_post_id) {
                        GM_setValue('last_downloaded_id', json.last_post_id);
                        GM_setValue('last_downloaded_title', json.last_post_title || '');
                        showToast('下载成功', 'success');
                        if (refreshPopup) {
                            removeLastPostPopup();
                            showLastPostPopup();
                        }
                    } else {
                        showToast('下载内容无效', 'error');
                    }
                } else {
                    showToast('下载失败: ' + resp.status, 'error');
                }
            },
            onerror: function() {
                showToast('下载出错', 'error');
            }
        });
    }

    // --- Remove popup helper (for refresh) ---
    function removeLastPostPopup() {
        const popup = document.getElementById('ld-last-popup');
        if (popup) popup.remove();
    }

    // --- Popup for last post before refresh ---
    function showLastPostPopup() {
        const lastTopicId = GM_getValue('last_downloaded_id') || GM_getValue('last_post_id');
        if (!lastTopicId) return;

        const title = GM_getValue('last_downloaded_title') || GM_getValue('last_post_title') || `话题 ID：${lastTopicId}`;
        const url = `https://linux.do/t/${lastTopicId}`;

        removeLastPostPopup();

        const box = document.createElement('div');
        box.id = 'ld-last-popup';
        box.style.position = 'fixed';
        box.style.top = '0';
        box.style.left = '0';
        box.style.margin = '0';
        box.style.background = 'white';
        box.style.border = '1px solid #888';
        box.style.padding = '10px';
        box.style.boxShadow = '0 0 8px rgba(0,0,0,0.2)';
        box.style.zIndex = '9999';
        box.style.width = '220px';
        box.style.borderRadius = '8px';
        box.innerHTML = `
            <div class="ld-popup-label-flex">
                <span>上次浏览：</span>
                <span style="display: flex; gap: 2px;">
                  <span id="ld-upload-btn" class="ld-locate-icon-svg ld-circular-btn" title="上传">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="8" stroke="#00bfff" stroke-width="2.5"/>
                      <path d="M12 7v7" stroke="#00bfff" stroke-width="2.5" stroke-linecap="round"/>
                      <path d="M8.5 11.5L12 7l3.5 4.5" stroke="#00bfff" stroke-width="2.5" stroke-linecap="round" fill="none"/>
                    </svg>
                  </span>
                  <span id="ld-download-btn" class="ld-locate-icon-svg ld-circular-btn" title="下载">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="8" stroke="#00bfff" stroke-width="2.5"/>
                      <path d="M12 17v-7" stroke="#00bfff" stroke-width="2.5" stroke-linecap="round"/>
                      <path d="M8.5 12.5L12 17l3.5-4.5" stroke="#00bfff" stroke-width="2.5" stroke-linecap="round" fill="none"/>
                    </svg>
                  </span>
                  <span id="ld-locate-btn" class="ld-locate-icon-svg ld-circular-btn" title="定位">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <circle cx="11" cy="11" r="7" stroke="#00bfff" stroke-width="2.5"/>
                      <line x1="16" y1="16" x2="22" y2="22" stroke="#00bfff" stroke-width="2.5"/>
                    </svg>
                  </span>
                </span>
            </div>
            <a href="${url}" target="_blank" class="ld-popup-link">${title}</a>
        `;
        document.body.appendChild(box);

        document.getElementById('ld-locate-btn').onclick = () => locateAndHighlightTopic(lastTopicId);
        document.getElementById('ld-upload-btn').onclick = () => uploadToWebDAV();
        document.getElementById('ld-download-btn').onclick = () => downloadFromWebDAV(true);
    }

    function locateAndHighlightTopic(topicId) {
        const tryFind = () => {
            const rows = document.querySelectorAll('tr.topic-list-item');
            for (const row of rows) {
                const link = row.querySelector('a.raw-topic-link');
                const match = link?.href.match(/\/t\/.*?\/(\d+)/);
                if (match && match[1] === topicId) {
                    row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    link.style.backgroundColor = '#ffff66';
                    link.style.padding = '2px 4px';
                    uploadToWebDAV();
                    return true;
                }
            }
            return false;
        };

        if (tryFind()) return;

        let lastHeight = 0;
        const interval = setInterval(() => {
            window.scrollBy(0, 1000);
            setTimeout(() => {
                if (tryFind()) {
                    clearInterval(interval);
                } else if (document.documentElement.scrollHeight === lastHeight) {
                    clearInterval(interval);
                } else {
                    lastHeight = document.documentElement.scrollHeight;
                }
            }, 500);
        }, 1000);
    }


    // --- MutationObserver to detect when topics are loaded and show popup ---
    function waitForTopicsAndShowPopup() {
        // Always clear download state immediately on page refresh
        GM_deleteValue('last_downloaded_id');
        GM_deleteValue('last_downloaded_title');
        // Always try to show popup immediately
        showLastPostPopup();
        // Helper to check if topics exist
        function topicsExist() {
            return document.querySelector('tr.topic-list-item');
        }
        // Helper to set latest topic id if available
        function setLatestTopicId() {
            const latestRow = [...document.querySelectorAll('tr.topic-list-item')][0];
            const link = latestRow?.querySelector('a.raw-topic-link');
            const topicIdMatch = link?.href.match(/\/t\/.*?\/(\d+)/);
            if (topicIdMatch) {
                GM_setValue('last_post_id', topicIdMatch[1]);
                GM_setValue('last_post_title', link?.textContent?.trim() || '');
                GM_deleteValue('last_downloaded_id');
                GM_deleteValue('last_downloaded_title');
            }
        }
        // If topics are already present, always set latest topic id
        if (topicsExist()) {
            setLatestTopicId();
            return;
        }
        // Otherwise, observe for topic list items being added
        const target = document.querySelector('#main-outlet') || document.body;
        const observer = new MutationObserver((mutations, obs) => {
            if (topicsExist()) {
                showLastPostPopup();
                setLatestTopicId();
                obs.disconnect();
            }
        });
        observer.observe(target, { childList: true, subtree: true });
    }

    // Immediately call the function to handle popup logic
    waitForTopicsAndShowPopup();

    const style = document.createElement('style');
    style.textContent = `
        .ld-popup-label-flex {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 6px;
            font-weight: bold;
            color: #666666;
        }
        .ld-popup-link {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1.3em;
            color: #336699;
            font-size: 14px;
        }
        .ld-circular-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            cursor: pointer;
            margin-left: 4px;
            transition: background 0.14s, box-shadow 0.14s;
        }
        .ld-circular-btn:hover {
            background-color: rgba(0, 191, 255, 0.18);
            box-shadow: 0 0 4px rgba(0, 191, 255, 0.4);
        }
        .ld-circular-btn svg {
            pointer-events: none;
        }
    `;
    document.head.appendChild(style);

})();
