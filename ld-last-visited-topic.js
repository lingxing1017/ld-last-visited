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
            <div class="ld-popup-label">上次浏览：</div>
            <a href="${url}" target="_blank" class="ld-popup-link">${title}</a>
        `;
        document.body.appendChild(box);
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
        .ld-popup-label {
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
    `;
    document.head.appendChild(style);

})();
