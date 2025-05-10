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
// @grant        GM_registerMenuCommand
// @run-at       document-idle
// ==/UserScript==


(function() {
    'use strict';

    // --- Popup for last post before refresh ---
    function showLastPostPopup() {
        const lastTopicId = GM_getValue('last_post_id');
        if (!lastTopicId) return;

        const title = GM_getValue('last_post_title') || `话题 ID：${lastTopicId}`;
        const url = `https://linux.do/t/${lastTopicId}`;

        const box = document.createElement('div');
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
                <span id="ld-locate-btn" class="ld-locate-icon-svg">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle cx="11" cy="11" r="7" stroke="#00bfff" stroke-width="2.5"/>
                    <line x1="16" y1="16" x2="22" y2="22" stroke="#00bfff" stroke-width="2.5"/>
                  </svg>
                </span>
            </div>
            <a href="${url}" target="_blank" class="ld-popup-link">${title}</a>
        `;
        document.body.appendChild(box);

        document.getElementById('ld-locate-btn').onclick = () => locateAndHighlightTopic(lastTopicId);
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
        .ld-locate-icon-svg {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            cursor: pointer;
            margin-left: 6px;
        }
        .ld-locate-icon-svg:hover {
            background-color: rgba(0, 191, 255, 0.25);
            box-shadow: 0 0 4px rgba(0, 191, 255, 0.5);
        }
        .ld-locate-icon-svg svg {
            pointer-events: none;
        }
    `;
    document.head.appendChild(style);

})();
